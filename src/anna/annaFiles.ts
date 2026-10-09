import { getAnnaRuntime } from './annaClient';

export interface FileUploadResult {
  fileRef: string;
  downloadUrl: string;
  filename: string;
}

export async function uploadUserDocument(
  file: File,
  purpose: string = 'resume'
): Promise<FileUploadResult> {
  const runtime = getAnnaRuntime();

  // Convert File to Base64
  let arrayBuffer: ArrayBuffer;
  if (typeof file.arrayBuffer === 'function') {
    arrayBuffer = await file.arrayBuffer();
  } else {
    const text = typeof file.text === 'function' ? await file.text() : '';
    const encoder = new TextEncoder();
    arrayBuffer = encoder.encode(text).buffer as ArrayBuffer;
  }
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64String = typeof btoa === 'function' 
    ? btoa(binary) 
    : (typeof (globalThis as any).Buffer !== 'undefined' ? (globalThis as any).Buffer.from(binary, 'binary').toString('base64') : '');

  if (runtime.upload && typeof runtime.upload.inline === 'function') {
    try {
      const res = await runtime.upload.inline({
        bytes_b64: base64String,
        mime: file.type || 'application/pdf',
        purpose,
        filename: file.name
      });

      return {
        fileRef: res.file_ref,
        downloadUrl: res.url,
        filename: file.name
      };
    } catch (err) {
      console.warn('anna.upload.inline failed, creating object URL fallback.', err);
    }
  }

  // Fallback for standalone/mock environment
  const mockUrl = URL.createObjectURL(file);
  return {
    fileRef: `mock_ref_${Date.now()}`,
    downloadUrl: mockUrl,
    filename: file.name
  };
}
