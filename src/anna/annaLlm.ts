import { getAnnaRuntime } from './annaClient';

export interface LlmCompletionOptions {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{ type: 'text' | 'image'; text?: string; data?: string; mimeType?: string }>;
  }>;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LlmCompletionResult {
  role: 'assistant';
  text: string;
  model?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export async function annaLlmComplete(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
  const runtime = getAnnaRuntime();

  if (!runtime.llm || typeof runtime.llm.complete !== 'function') {
    throw new Error('Anna LLM service not available in current host environment.');
  }

  const formattedMessages = options.systemPrompt 
    ? [{ role: 'system', content: options.systemPrompt }, ...options.messages]
    : options.messages;

  try {
    const res = await runtime.llm.complete({
      messages: formattedMessages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        content: typeof msg.content === 'string' ? { type: 'text', text: msg.content } : msg.content
      })),
      maxTokens: options.maxTokens || 2048,
      temperature: options.temperature || 0.3
    });

    const outputText = typeof res.content === 'string' ? res.content : (res.content?.text || '');

    return {
      role: 'assistant',
      text: outputText,
      model: res.model,
      usage: res.usage
    };
  } catch (err: any) {
    console.error('annaLlmComplete failed:', err);
    throw new Error(err?.message || 'Anna LLM completion request failed.');
  }
}

export async function annaLlmEmbed(text: string): Promise<number[]> {
  const runtime = getAnnaRuntime();

  if (runtime.llm && typeof runtime.llm.embed === 'function') {
    try {
      const res = await runtime.llm.embed({ text });
      return res.embedding || res.vector || [];
    } catch (err) {
      console.warn('annaLlmEmbed failed, returning empty embedding vector.', err);
    }
  }

  return [];
}
