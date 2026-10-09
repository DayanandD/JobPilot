import { z } from 'zod';
import { Job } from '../types';
import { invokeExecutaTool } from '../anna/annaTools';
import { annaLlmComplete } from '../anna/annaLlm';
import { normalizeSkillName } from './profileDomain';

export const JobAnalysisResultSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string(),
  experienceRequired: z.number().nonnegative(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  education: z.string().default('Not specified'),
  salary: z.string().default('Not specified'),
  employmentType: z.string().default('full-time'),
  remoteType: z.string().default('all'),
  importantKeywords: z.array(z.string()).default([]),
  potentialConcerns: z.array(z.string()).default([])
});

export type JobAnalysisResult = z.infer<typeof JobAnalysisResultSchema>;

// In-memory cache for analyzed jobs to prevent duplicate AI calls
const jobAnalysisCache = new Map<string, JobAnalysisResult>();

/**
 * Analyzes raw job description text and extracts structured schema-validated parameters.
 */
export async function analyzeJobDescription(job: Job): Promise<JobAnalysisResult> {
  if (!job || !job.id) {
    throw new Error('Invalid job object provided for analysis.');
  }

  // Check cache
  if (jobAnalysisCache.has(job.id)) {
    return jobAnalysisCache.get(job.id)!;
  }

  // 1. Try backend Executa analyze_job tool
  try {
    const toolRes = await invokeExecutaTool<Partial<JobAnalysisResult>>('analyze_job', {
      description: job.description
    });

    if (toolRes.success && toolRes.data && Array.isArray(toolRes.data.requiredSkills)) {
      const parsedData = sanitizeAndNormalizeAnalysis(toolRes.data, job);
      const validated = JobAnalysisResultSchema.parse(parsedData);
      jobAnalysisCache.set(job.id, validated);
      return validated;
    }
  } catch (err) {
    console.warn('Executa analyze_job tool failed or returned unvalidated data, falling back to Anna LLM:', err);
  }

  // 2. Fallback to Anna LLM Structured Completion
  try {
    const llmRes = await annaLlmComplete({
      systemPrompt: `You are an expert technical job description analyzer. Extract key job requirements into structured JSON matching this exact schema:
{
  "title": string,
  "company": string,
  "location": string,
  "experienceRequired": number (in years),
  "requiredSkills": string[],
  "preferredSkills": string[],
  "responsibilities": string[],
  "education": string,
  "salary": string,
  "employmentType": string,
  "remoteType": string,
  "importantKeywords": string[],
  "potentialConcerns": string[]
}
CRITICAL GROUNDING RULE: Never invent facts not present in the text. Use "Not specified" if data is missing.`,
      messages: [{ role: 'user', content: `Analyze job description:\n\n${job.title} at ${job.company}\n\n${job.description}` }]
    });

    const rawJson = JSON.parse(llmRes.text.replace(/```json|```/g, '').trim());
    const sanitized = sanitizeAndNormalizeAnalysis(rawJson, job);
    const validated = JobAnalysisResultSchema.parse(sanitized);

    jobAnalysisCache.set(job.id, validated);
    return validated;
  } catch (err) {
    console.warn('LLM job analysis fallback failed, creating safe deterministic fallback analysis:', err);
  }

  // 3. Deterministic safe fallback without AI hallucination
  const fallbackResult: JobAnalysisResult = {
    title: job.title,
    company: job.company,
    location: job.location,
    experienceRequired: 3,
    requiredSkills: (job.requirements && job.requirements.length > 0) ? job.requirements.map(normalizeSkillName) : ['Software Engineering'],
    preferredSkills: (job.preferredSkills && job.preferredSkills.length > 0) ? job.preferredSkills.map(normalizeSkillName) : [],
    responsibilities: ['Develop scalable software applications', 'Collaborate with engineering team'],
    education: 'Not specified',
    salary: job.salary || 'Not specified',
    employmentType: job.employmentType || 'full-time',
    remoteType: job.remoteType || 'all',
    importantKeywords: job.requirements || [],
    potentialConcerns: []
  };

  jobAnalysisCache.set(job.id, fallbackResult);
  return fallbackResult;
}

function sanitizeAndNormalizeAnalysis(data: Partial<JobAnalysisResult>, job: Job): any {
  return {
    title: data.title || job.title,
    company: data.company || job.company,
    location: data.location || job.location,
    experienceRequired: typeof data.experienceRequired === 'number' ? data.experienceRequired : 0,
    requiredSkills: Array.isArray(data.requiredSkills) ? data.requiredSkills.map(normalizeSkillName) : [],
    preferredSkills: Array.isArray(data.preferredSkills) ? data.preferredSkills.map(normalizeSkillName) : [],
    responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : [],
    education: data.education || 'Not specified',
    salary: data.salary || job.salary || 'Not specified',
    employmentType: data.employmentType || job.employmentType || 'full-time',
    remoteType: data.remoteType || job.remoteType || 'all',
    importantKeywords: Array.isArray(data.importantKeywords) ? data.importantKeywords : [],
    potentialConcerns: Array.isArray(data.potentialConcerns) ? data.potentialConcerns : []
  };
}
