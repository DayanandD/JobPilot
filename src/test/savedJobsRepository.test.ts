import { describe, it, expect } from 'vitest';
import { 
  toggleSavedJobInStorage, 
  persistSavedJobIdsToStorage, 
  loadSavedJobIdsFromStorage 
} from '../repositories/savedJobsRepository';

describe('Saved Jobs Repository Tests', () => {
  it('toggles saved job ID by adding if not present', async () => {
    const initial = ['j1', 'j2'];
    const updated = await toggleSavedJobInStorage('j3', initial);
    expect(updated).toEqual(['j1', 'j2', 'j3']);
  });

  it('toggles saved job ID by removing if already present', async () => {
    const initial = ['j1', 'j2', 'j3'];
    const updated = await toggleSavedJobInStorage('j2', initial);
    expect(updated).toEqual(['j1', 'j3']);
  });

  it('persists and loads saved job IDs from storage', async () => {
    const sampleIds = ['job_101', 'job_102'];
    await persistSavedJobIdsToStorage(sampleIds);
    const loaded = await loadSavedJobIdsFromStorage();
    expect(loaded).toEqual(sampleIds);
  });
});
