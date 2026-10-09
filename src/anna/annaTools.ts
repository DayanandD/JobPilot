import { getAnnaRuntime } from './annaClient';

const TOOL_ID = 'tool-dev-jobpilot';

export interface ExecutaInvokeResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
  };
}

export async function invokeExecutaTool<T = any>(
  methodName: string, 
  args: Record<string, any> = {},
  timeoutMs: number = 30000
): Promise<ExecutaInvokeResult<T>> {
  const runtime = getAnnaRuntime();

  if (!runtime.tools || typeof runtime.tools.invoke !== 'function') {
    console.warn(`[annaTools] runtime.tools.invoke unavailable. Cannot invoke "${methodName}".`);
    return {
      success: false,
      error: { code: -32601, message: 'Tools API unavailable in runtime environment' }
    };
  }

  try {
    const res = await runtime.tools.invoke({
      tool_id: TOOL_ID,
      method: methodName,
      args,
      timeoutMs
    });

    if (res && res.result) {
      if (res.result.success !== undefined) {
        return res.result as ExecutaInvokeResult<T>;
      }
      return { success: true, data: res.result as T };
    }

    return { success: true, data: res as any };
  } catch (err: any) {
    console.error(`[annaTools] invokeExecutaTool "${methodName}" failed:`, err);
    return {
      success: false,
      error: {
        code: err?.code || -32603,
        message: err?.message || `Execution of tool "${methodName}" failed.`
      }
    };
  }
}
