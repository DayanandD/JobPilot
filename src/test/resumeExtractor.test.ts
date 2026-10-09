import { describe, it, expect } from 'vitest';
import { validateResumeFile, MAX_RESUME_FILE_SIZE_BYTES } from '../domain/resumeExtractor';

describe('resumeExtractor Validation Tests', () => {
  it('accepts valid PDF resume file', () => {
    const validFile = new File(['Dummy PDF Content'], 'resume.pdf', { type: 'application/pdf' });
    const result = validateResumeFile(validFile);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts valid DOCX resume file', () => {
    const validFile = new File(['Dummy DOCX Content'], 'resume.docx', { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    const result = validateResumeFile(validFile);
    expect(result.isValid).toBe(true);
  });

  it('rejects empty file (0 bytes)', () => {
    const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' });
    const result = validateResumeFile(emptyFile);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('rejects oversized file (>10 MB)', () => {
    const oversizedBlob = new Array(MAX_RESUME_FILE_SIZE_BYTES + 1024).fill('a').join('');
    const bigFile = new File([oversizedBlob], 'large_resume.pdf', { type: 'application/pdf' });
    const result = validateResumeFile(bigFile);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('10 MB limit');
  });

  it('rejects unpermitted file extensions (.exe, .zip)', () => {
    const badFile = new File(['Binary Data'], 'executable.exe', { type: 'application/x-msdownload' });
    const result = validateResumeFile(badFile);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Invalid file format');
  });
});
