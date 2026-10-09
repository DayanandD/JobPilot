import { create } from 'zustand';
import { 
  TabType, 
  CandidateProfile, 
  Job, 
  JobApplication, 
  ApplicationStatus,
  MockInterviewSession 
} from '../types';
import { toggleSavedJobInStorage } from '../repositories/savedJobsRepository';

interface AppState {
  activeTab: TabType;
  candidateProfile: CandidateProfile | null;
  jobs: Job[];
  savedJobIds: string[];
  applications: JobApplication[];
  activeMockSession: MockInterviewSession | null;
  isConnectedToAnna: boolean;
  searchQuery: string;
  selectedLocation: string;
  selectedRemoteType: string;

  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Actions
  setActiveTab: (tab: TabType) => void;
  setCandidateProfile: (profile: CandidateProfile | null) => void;
  setJobs: (jobs: Job[]) => void;
  setSavedJobIds: (savedJobIds: string[]) => void;
  toggleSaveJob: (jobId: string) => Promise<void>;
  addApplication: (application: JobApplication) => void;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;
  setActiveMockSession: (session: MockInterviewSession | null) => void;
  setIsConnectedToAnna: (connected: boolean) => void;
  setSearchFilters: (query: string, location: string, remoteType: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  candidateProfile: null,
  jobs: [],
  savedJobIds: [],
  applications: [],
  activeMockSession: null,
  isConnectedToAnna: false,
  searchQuery: '',
  selectedLocation: '',
  selectedRemoteType: 'all',
  isSidebarCollapsed: false,

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setCandidateProfile: (profile) => set({ candidateProfile: profile }),
  setJobs: (jobs) => set({ jobs }),
  setSavedJobIds: (savedJobIds) => set({ savedJobIds }),
  toggleSaveJob: async (jobId) => {
    const current = useAppStore.getState().savedJobIds;
    const isSaved = current.includes(jobId);
    const updated = isSaved 
      ? current.filter(id => id !== jobId)
      : [...current, jobId];

    set({ savedJobIds: updated });
    await toggleSavedJobInStorage(jobId, current);
  },
  addApplication: (application) => set((state) => ({
    applications: [application, ...state.applications]
  })),
  updateApplicationStatus: (id, status) => set((state) => ({
    applications: state.applications.map(app => {
      if (app.id !== id) return app;
      const history = app.statusHistory || [];
      return {
        ...app,
        status,
        statusHistory: [...history, { status, timestamp: new Date().toISOString() }],
        updatedAt: new Date().toISOString()
      };
    })
  })),
  setActiveMockSession: (session) => set({ activeMockSession: session }),
  setIsConnectedToAnna: (connected) => set({ isConnectedToAnna: connected }),
  setSearchFilters: (query, location, remoteType) => set({
    searchQuery: query,
    selectedLocation: location,
    selectedRemoteType: remoteType
  })
}));
