import { getStorage, setStorage } from '../anna/annaStorage';
import { JobApplication, ApplicationStatus, ApplicationNote } from '../types';

const APPLICATIONS_STORAGE_KEY = 'job_applications';

export const VALID_STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  saved: ['preparing', 'applied', 'withdrawn'],
  preparing: ['applied', 'saved', 'withdrawn'],
  applied: ['recruiter_contacted', 'interview_scheduled', 'interviewing', 'rejected', 'withdrawn'],
  recruiter_contacted: ['interview_scheduled', 'interviewing', 'offer', 'rejected', 'withdrawn'],
  interview_scheduled: ['interviewing', 'offer', 'rejected', 'withdrawn'],
  interviewing: ['offer', 'rejected', 'withdrawn'],
  offer: ['rejected', 'withdrawn'],
  rejected: ['saved'],
  withdrawn: ['saved']
};

/**
 * Validates whether transition from currentStatus to nextStatus is permitted.
 */
export function isValidStatusTransition(currentStatus: ApplicationStatus, nextStatus: ApplicationStatus): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(nextStatus) : true;
}

export async function loadApplicationsFromStorage(): Promise<JobApplication[]> {
  try {
    const apps = await getStorage<JobApplication[]>(APPLICATIONS_STORAGE_KEY);
    return Array.isArray(apps) ? apps : [];
  } catch (err) {
    console.error('Failed to load applications from storage:', err);
    return [];
  }
}

export async function saveApplicationsToStorage(applications: JobApplication[]): Promise<boolean> {
  try {
    return await setStorage<JobApplication[]>(APPLICATIONS_STORAGE_KEY, applications);
  } catch (err) {
    console.error('Failed to save applications to storage:', err);
    return false;
  }
}

export async function createNewApplication(
  jobId: string,
  jobTitle: string,
  company: string,
  location: string,
  sourceUrl: string,
  initialStatus: ApplicationStatus = 'saved'
): Promise<JobApplication> {
  const now = new Date().toISOString();
  const newApp: JobApplication = {
    id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    jobId,
    jobTitle,
    company,
    location,
    sourceUrl,
    status: initialStatus,
    appliedDate: initialStatus === 'applied' ? now : undefined,
    notes: [],
    statusHistory: [{ status: initialStatus, timestamp: now }],
    createdAt: now,
    updatedAt: now
  };

  const existing = await loadApplicationsFromStorage();
  const updated = [newApp, ...existing];
  await saveApplicationsToStorage(updated);
  return newApp;
}

export async function updateApplicationState(
  appId: string, 
  newStatus: ApplicationStatus, 
  applications: JobApplication[]
): Promise<JobApplication[]> {
  const now = new Date().toISOString();

  const updatedApps = applications.map(app => {
    if (app.id !== appId) return app;

    if (!isValidStatusTransition(app.status, newStatus)) {
      console.warn(`Invalid status transition requested from "${app.status}" to "${newStatus}" for app ${appId}`);
    }

    const history = app.statusHistory || [];
    return {
      ...app,
      status: newStatus,
      appliedDate: newStatus === 'applied' ? (app.appliedDate || now) : app.appliedDate,
      statusHistory: [...history, { status: newStatus, timestamp: now }],
      updatedAt: now
    };
  });

  await saveApplicationsToStorage(updatedApps);
  return updatedApps;
}

export async function addNoteToApplication(
  appId: string, 
  noteContent: string, 
  applications: JobApplication[]
): Promise<JobApplication[]> {
  const now = new Date().toISOString();
  const newNote: ApplicationNote = {
    id: `note_${Date.now()}`,
    createdAt: now,
    content: noteContent
  };

  const updatedApps = applications.map(app => {
    if (app.id !== appId) return app;
    return {
      ...app,
      notes: [...(app.notes || []), newNote],
      updatedAt: now
    };
  });

  await saveApplicationsToStorage(updatedApps);
  return updatedApps;
}
