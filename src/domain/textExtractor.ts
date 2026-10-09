import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up local pdf.js worker URL (bundled via Vite, avoiding external CDN dependency)
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export interface TextExtractionResult {
  success: boolean;
  text: string;
  error?: string;
  extractedLength: number;
}

/**
 * Extracts readable plain text from PDF, DOCX, or TXT file ArrayBuffers.
 */
export async function extractTextFromFile(file: File): Promise<TextExtractionResult> {
  const fileNameLower = file.name.toLowerCase();

  try {
    let arrayBuffer: ArrayBuffer;
    if (typeof file.arrayBuffer === 'function') {
      arrayBuffer = await file.arrayBuffer();
    } else {
      const text = typeof file.text === 'function' ? await file.text() : '';
      const encoder = new TextEncoder();
      arrayBuffer = encoder.encode(text).buffer as ArrayBuffer;
    }

    if (fileNameLower.endsWith('.txt')) {
      const textDecoder = new TextDecoder('utf-8');
      const rawText = textDecoder.decode(arrayBuffer).trim();
      if (!rawText || rawText.length < 10) {
        return {
          success: false,
          text: '',
          error: 'The uploaded TXT file is empty or contains insufficient text.',
          extractedLength: 0
        };
      }
      return {
        success: true,
        text: rawText,
        extractedLength: rawText.length
      };
    }

    if (fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc')) {
      const result = await mammoth.extractRawText({ arrayBuffer });
      const rawText = (result.value || '').trim();
      
      if (!rawText || rawText.length < 15) {
        return {
          success: false,
          text: '',
          error: 'This DOCX resume appears to be empty or contains no readable text.',
          extractedLength: 0
        };
      }

      return {
        success: true,
        text: rawText,
        extractedLength: rawText.length
      };
    }

    if (fileNameLower.endsWith('.pdf')) {
      const pdfText = await extractTextFromPdfArrayBuffer(arrayBuffer);
      const cleanText = pdfText.trim();

      // Check for raw PDF header leakage (%PDF-1.5) or image-only scanned document
      if (!cleanText || cleanText.length < 20 || cleanText.startsWith('%PDF-')) {
        return {
          success: false,
          text: '',
          error: 'This resume appears to be image-based or contains no readable text. Please upload a text-readable PDF or supported document.',
          extractedLength: 0
        };
      }

      return {
        success: true,
        text: cleanText,
        extractedLength: cleanText.length
      };
    }

    return {
      success: false,
      text: '',
      error: 'Unsupported file extension. Only PDF, DOCX, and TXT files are allowed.',
      extractedLength: 0
    };
  } catch (err: any) {
    console.error('[Resume Extraction Error]', err?.message || err);
    return {
      success: false,
      text: '',
      error: `Failed to extract text from file (${file.name}): ${err?.message || 'Unreadable file'}`,
      extractedLength: 0
    };
  }
}

/**
 * Extracts plain text from a PDF ArrayBuffer using pdfjs-dist page text content streams.
 */
async function extractTextFromPdfArrayBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
    disableFontFace: true
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str || '')
      .join(' ');
    
    fullText += pageText + '\n';
  }

  return fullText.replace(/\s+/g, ' ').trim();
}
