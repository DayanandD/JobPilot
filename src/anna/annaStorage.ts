import { getAnnaRuntime } from './annaClient';

export async function getStorage<T>(key: string): Promise<T | null> {
  const runtime = getAnnaRuntime();

  if (!runtime.storage || typeof runtime.storage.get !== 'function') {
    const raw = localStorage.getItem(`jobpilot_${key}`);
    return raw ? JSON.parse(raw) : null;
  }

  try {
    const res = await runtime.storage.get({ key });
    if (res && res.exists !== false && res.value !== undefined && res.value !== null) {
      return res.value as T;
    }
    return null;
  } catch (err) {
    console.warn(`[annaStorage] get failed for key "${key}", falling back to localStorage.`, err);
    const raw = localStorage.getItem(`jobpilot_${key}`);
    return raw ? JSON.parse(raw) : null;
  }
}

export async function setStorage<T>(key: string, value: T): Promise<boolean> {
  const runtime = getAnnaRuntime();

  // Always sync to local cache for instant UI availability
  try {
    localStorage.setItem(`jobpilot_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage setItem failed:', e);
  }

  if (!runtime.storage || typeof runtime.storage.set !== 'function') {
    return true;
  }

  try {
    const res = await runtime.storage.set({ key, value });
    return res?.ok ?? true;
  } catch (err) {
    console.warn(`[annaStorage] set failed for key "${key}".`, err);
    return false;
  }
}

export async function deleteStorage(key: string): Promise<boolean> {
  const runtime = getAnnaRuntime();
  localStorage.removeItem(`jobpilot_${key}`);

  if (!runtime.storage || typeof runtime.storage.delete !== 'function') {
    return true;
  }

  try {
    const res = await runtime.storage.delete({ key });
    return res?.ok ?? true;
  } catch (err) {
    console.warn(`[annaStorage] delete failed for key "${key}".`, err);
    return false;
  }
}
