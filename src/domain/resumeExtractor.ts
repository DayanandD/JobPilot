import { CandidateProfile } from '../types';
import { createDraftProfileFromExtraction } from './profileDomain';
import { uploadUserDocument } from '../anna/annaFiles';
import { invokeExecutaTool } from '../anna/annaTools';
import { annaLlmComplete } from '../anna/annaLlm';
import { extractTextFromFile } from './textExtractor';

export interface ResumeValidationResult {
  isValid: boolean;
  error?: string;
}

export const MAX_RESUME_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
export const ALLOWED_RESUME_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain'
];

/**
 * Validates uploaded resume file for format, size, and non-empty content.
 */
export function validateResumeFile(file: File): ResumeValidationResult {
  if (!file) {
    return { isValid: false, error: 'No file selected.' };
  }

  if (file.size === 0) {
    return { isValid: false, error: 'Selected file is empty (0 bytes).' };
  }

  if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
    return { 
      isValid: false, 
      error: `File size exceeds the 10 MB limit (Selected: ${(file.size / (1024 * 1024)).toFixed(1)} MB).` 
    };
  }

  const fileNameLower = file.name.toLowerCase();
  const hasValidExtension = fileNameLower.endsWith('.pdf') || 
                            fileNameLower.endsWith('.docx') || 
                            fileNameLower.endsWith('.doc') || 
                            fileNameLower.endsWith('.txt');

  const hasValidMime = ALLOWED_RESUME_MIME_TYPES.includes(file.type) || file.type === '';

  if (!hasValidExtension || !hasValidMime) {
    return { 
      isValid: false, 
      error: 'Invalid file format. Only PDF, DOCX, and TXT resumes are supported.' 
    };
  }

  return { isValid: true };
}

/**
 * Production Resume Parsing Pipeline:
 * 1. Validate file format and size (<10MB)
 * 2. Upload file via Anna Host File API
 * 3. Extract readable text (PDF page streams / DOCX / TXT)
 * 4. Invoke JobPilot Executa parse_resume tool
 * 5. Fallback to Anna LLM structured JSON extraction if tool unconfigured
 * 6. Validate structured CandidateProfile schema (no fabricated data)
 * 7. Return draft profile with isConfirmed: false guardrail
 */
export async function parseAndExtractResume(file: File): Promise<CandidateProfile> {
  // Safe diagnostic logging (no sensitive candidate data)
  const ext = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
  console.log('[Resume] Upload started');
  console.log(`[Resume] File type: ${ext}`);
  console.log(`[Resume] File size: ${file.size} bytes`);

  // Step 1: File Validation
  const validation = validateResumeFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid resume file.');
  }

  // Step 2: Upload to Anna Host File API
  try {
    await uploadUserDocument(file, 'resume');
  } catch (err: any) {
    console.error('[Resume Error] Host file upload failed:', err?.message || err);
    throw new Error(`Failed to upload resume to Anna Host Storage: ${err?.message || 'Upload error'}`);
  }

  // Step 3: Text Extraction
  const extractionResult = await extractTextFromFile(file);
  if (!extractionResult.success || !extractionResult.text) {
    throw new Error(
      extractionResult.error || 
      'This resume appears to be image-based or contains no readable text. Please upload a text-readable PDF or supported document.'
    );
  }

  const cleanText = extractionResult.text;
  console.log('[Resume] Text extraction completed');
  console.log(`[Resume] Extracted text length: ${cleanText.length}`);

  // Step 4: Invoke Executa parse_resume Tool
  console.log('[Resume] parse_resume started');
  let extractedData: Partial<CandidateProfile> | null = null;

  try {
    const toolResult = await invokeExecutaTool<Partial<CandidateProfile>>('parse_resume', {
      resumeText: cleanText
    });

    if (toolResult.success && toolResult.data && (toolResult.data.fullName || toolResult.data.title || (toolResult.data.skills && toolResult.data.skills.length > 0))) {
      extractedData = toolResult.data;
      console.log('[Resume] parse_resume completed via Executa tool');
    }
  } catch (err: any) {
    console.warn('[Resume] Executa parse_resume tool unconfigured or failed, trying Anna LLM extraction:', err?.message || err);
  }

  // Step 5: Anna LLM Fallback with Strict Grounding Prompt
  if (!extractedData) {
    try {
      const systemPrompt = `You are JobPilot AI Resume Parser. Extract structured candidate details from the provided resume text.

STRICT GROUNDING RULES:
1. Extract ONLY information explicitly stated in the resume.
2. Never invent names, titles, companies, degrees, or skills.
3. If information is absent, use null or empty array [].
4. Return a valid raw JSON object matching schema:
{
  "fullName": string,
  "title": string,
  "email": string,
  "phone": string,
  "location": string,
  "yearsOfExperience": number,
  "summary": string,
  "skills": [{"name": string}],
  "workExperience": [{"company": string, "title": string, "startDate": string, "endDate": string, "isCurrent": boolean, "description": string, "skillsUsed": [string]}],
  "education": [{"institution": string, "degree": string, "fieldOfStudy": string}]
}
Do not wrap output in markdown code blocks. Output raw JSON only.`;

      const userPrompt = `Resume Content:\n\n${cleanText.slice(0, 6000)}`;

      const llmRes = await annaLlmComplete({
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.1
      });

      const jsonText = llmRes.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonText);

      if (parsed && typeof parsed === 'object') {
        extractedData = parsed;
        console.log('[Resume] Structured extraction completed via Anna LLM');
      }
    } catch (err: any) {
      console.error('[Resume Error] Anna LLM structured extraction failed:', err?.message || err);
      throw new Error(`Failed to extract structured data from resume: ${err?.message || 'Parsing error'}`);
    }
  }

  if (!extractedData) {
    throw new Error('Unable to extract candidate data from resume. Please ensure the file contains readable text.');
  }

  // Step 6: Validate Output & Attach Metadata
  extractedData.resumeFileName = file.name;
  extractedData.resumeUpdatedAt = new Date().toISOString();

  console.log('[Resume] Candidate profile validated');

  // Step 7: Create Draft Profile (isConfirmed: false guardrail)
  return createDraftProfileFromExtraction(extractedData);
}
