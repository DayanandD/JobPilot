export interface AnnaRuntime {
  windowUuid?: string;
  appId?: string;
  versionId?: string;
  entryPayload?: any;
  runtimeState?: Record<string, any>;
  tools?: {
    invoke: (args: { tool_id: string; method?: string; args: any; timeoutMs?: number }) => Promise<{ result: any }>;
    invokeAsync?: (args: { tool_id: string; method?: string; args?: any }) => Promise<{ jobId: string }>;
  };
  llm?: {
    complete: (req: any) => Promise<any>;
    embed?: (req: any) => Promise<any>;
  };
  storage?: {
    get: (args: { key: string }) => Promise<{ value: any; exists?: boolean }>;
    set: (args: { key: string; value: any }) => Promise<{ ok: boolean }>;
    delete: (args: { key: string }) => Promise<{ ok: boolean }>;
    list: (args: { prefix?: string }) => Promise<{ items: any[] }>;
  };
  files?: {
    upload_init?: (args: any) => Promise<any>;
    download_url?: (args: { path: string }) => Promise<{ url: string }>;
  };
  upload?: {
    inline?: (args: { bytes_b64: string; mime: string; purpose: string; filename?: string }) => Promise<{ file_ref: string; url: string }>;
  };
  web?: {
    search: (args: { query: string; max_results?: number; search_depth?: string }) => Promise<{ results: any[]; quota_consumed?: number }>;
    fetch: (args: { urls: string[]; format?: string }) => Promise<{ pages: any[] }>;
  };
  window?: {
    set_title: (args: { title: string }) => Promise<any>;
    resize: (args: { w: number; h: number }) => Promise<any>;
    focus: () => Promise<any>;
    close: (args?: { reason?: string }) => Promise<any>;
  };
  on?: (event: string, handler: (payload: any) => void) => () => void;
}

import { AnnaAppRuntime as AppRuntimeSDK } from '@anna-ai/app-runtime';

let annaRuntimeInstance: AnnaRuntime | null = null;
let isConnected = false;

export async function initAnnaClient(): Promise<{ runtime: AnnaRuntime | null; isConnected: boolean; error?: string }> {
  if (annaRuntimeInstance && isConnected) {
    return { runtime: annaRuntimeInstance, isConnected: true };
  }

  try {
    // 1. Primary: Connect via bundled @anna-ai/app-runtime SDK if wid/t parameters exist in URL (works for Anna Host iframe & anna-app dev harness)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('wid') || params.get('t')) {
        try {
          const connectedRuntime = await AppRuntimeSDK.connect();
          if (connectedRuntime) {
            annaRuntimeInstance = connectedRuntime as unknown as AnnaRuntime;
            isConnected = true;
            return { runtime: annaRuntimeInstance, isConnected: true };
          }
        } catch (connErr) {
          console.warn('[Anna Runtime] AppRuntimeSDK.connect() failed:', connErr);
        }
      }
    }

    // 2. Check window global runtime injected by Anna AI OS Host
    if (typeof window !== 'undefined' && (window as any).AnnaAppRuntime) {
      const AnnaAppRuntime = (window as any).AnnaAppRuntime;
      const connectedRuntime = await AnnaAppRuntime.connect();
      if (connectedRuntime) {
        annaRuntimeInstance = connectedRuntime;
        isConnected = true;
        return { runtime: connectedRuntime, isConnected: true };
      }
    }

    // 3. Check ESM host SDK module path when served inside Anna AI OS app container
    if (typeof window !== 'undefined') {
      try {
        const sdkPath = '/static/anna-apps/_sdk/latest/index.js';
        const sdkModule = await import(/* @vite-ignore */ sdkPath);
        if (sdkModule?.AnnaAppRuntime) {
          const connectedRuntime = await sdkModule.AnnaAppRuntime.connect();
          if (connectedRuntime) {
            annaRuntimeInstance = connectedRuntime;
            isConnected = true;
            return { runtime: connectedRuntime, isConnected: true };
          }
        }
      } catch (_err: any) {
        // ESM path not available
      }
    }
  } catch (err: any) {
    console.warn('[Anna Runtime Info] Anna App Runtime SDK not present in this browser window environment.');
  }

  // STOP operation - do NOT fall back to mock runtime in production
  annaRuntimeInstance = null;
  isConnected = false;

  return {
    runtime: null,
    isConnected: false,
    error: 'JobPilot could not connect to the Anna App Runtime. Please reopen the app and try again.'
  };
}

export function getAnnaRuntime(): AnnaRuntime {
  if (!annaRuntimeInstance) {
    throw new Error('JobPilot could not connect to the Anna App Runtime. Please reopen the app and try again.');
  }
  return annaRuntimeInstance;
}

/**
 * Utility for unit test setup ONLY. Sets a test runtime instance.
 */
export function setAnnaRuntimeForTesting(runtime: AnnaRuntime | null): void {
  annaRuntimeInstance = runtime;
  isConnected = !!runtime;
}
