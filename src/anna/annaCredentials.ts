import { getAnnaRuntime } from './annaClient';

export interface PlatformAccount {
  providerId: string;
  accountId: string;
  accountName?: string;
  isDefault: boolean;
}

export async function listPlatformAccounts(providerId: string): Promise<PlatformAccount[]> {
  const runtime = getAnnaRuntime() as any;

  if (runtime.credentials && typeof runtime.credentials.list_accounts === 'function') {
    try {
      const res = await runtime.credentials.list_accounts({ provider_id: providerId });
      return res.accounts || [];
    } catch (err) {
      console.warn(`[annaCredentials] list_accounts failed for provider ${providerId}:`, err);
    }
  }

  return [];
}
