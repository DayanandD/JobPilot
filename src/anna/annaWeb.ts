import { getAnnaRuntime } from './annaClient';

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  site?: string;
  published_at?: string;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  quotaConsumed?: number;
}

export async function annaWebSearch(
  query: string, 
  maxResults: number = 10
): Promise<WebSearchResponse> {
  const runtime = getAnnaRuntime();

  if (!runtime.web || typeof runtime.web.search !== 'function') {
    console.warn('Anna Web Search service unavailable in current runtime.');
    return { results: [] };
  }

  try {
    const res = await runtime.web.search({
      query,
      max_results: maxResults,
      search_depth: 'advanced'
    });

    return {
      results: res.results || [],
      quotaConsumed: res.quota_consumed
    };
  } catch (err: any) {
    if (err?.code === 'APP_NOT_GRANTED' || err?.message?.includes('web_grant')) {
      console.warn('Anna Web Search requires web_grant consent from user.');
    } else {
      console.error('annaWebSearch failed:', err);
    }
    return { results: [] };
  }
}

export async function annaWebFetch(urls: string[]): Promise<Array<{ url: string; ok: boolean; title?: string; content?: string }>> {
  const runtime = getAnnaRuntime();

  if (!runtime.web || typeof runtime.web.fetch !== 'function') {
    return [];
  }

  try {
    const res = await runtime.web.fetch({ urls, format: 'markdown' });
    return res.pages || [];
  } catch (err) {
    console.error('annaWebFetch failed:', err);
    return [];
  }
}
