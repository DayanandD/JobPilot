import { getStorage, setStorage } from '../anna/annaStorage';

const SAVED_JOBS_STORAGE_KEY = 'saved_job_ids';

export async function loadSavedJobIdsFromStorage(): Promise<string[]> {
  try {
    const ids = await getStorage<string[]>(SAVED_JOBS_STORAGE_KEY);
    return Array.isArray(ids) ? ids : [];
  } catch (err) {
    console.error('Failed to load saved job IDs from storage:', err);
    return [];
  }
}

export async function persistSavedJobIdsToStorage(savedJobIds: string[]): Promise<boolean> {
  try {
    return await setStorage<string[]>(SAVED_JOBS_STORAGE_KEY, savedJobIds);
  } catch (err) {
    console.error('Failed to persist saved job IDs to storage:', err);
    return false;
  }
}

export async function toggleSavedJobInStorage(jobId: string, currentSavedIds: string[]): Promise<string[]> {
  const isSaved = currentSavedIds.includes(jobId);
  const updatedIds = isSaved 
    ? currentSavedIds.filter(id => id !== jobId)
    : [...currentSavedIds, jobId];

  await persistSavedJobIdsToStorage(updatedIds);
  return updatedIds;
}
