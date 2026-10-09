import { getStorage, setStorage, deleteStorage } from '../anna/annaStorage';
import { CandidateProfile } from '../types';
import { CandidateProfileSchema } from '../domain/profileDomain';

const PROFILE_STORAGE_KEY = 'candidate_profile';

export async function saveProfileToStorage(profile: CandidateProfile): Promise<boolean> {
  // Validate schema before persisting
  const parseResult = CandidateProfileSchema.safeParse(profile);
  if (!parseResult.success) {
    console.warn('Profile validation warning before storage:', parseResult.error.format());
  }

  return await setStorage<CandidateProfile>(PROFILE_STORAGE_KEY, profile);
}

export async function loadProfileFromStorage(): Promise<CandidateProfile | null> {
  try {
    const profile = await getStorage<CandidateProfile>(PROFILE_STORAGE_KEY);
    if (!profile) return null;

    const parseResult = CandidateProfileSchema.safeParse(profile);
    if (!parseResult.success) {
      console.warn('Loaded profile schema mismatch:', parseResult.error.format());
      return profile; // Return raw object to avoid data loss
    }

    return parseResult.data;
  } catch (err) {
    console.error('Failed to load candidate profile from APS storage:', err);
    return null;
  }
}

export async function clearProfileFromStorage(): Promise<boolean> {
  return await deleteStorage(PROFILE_STORAGE_KEY);
}
