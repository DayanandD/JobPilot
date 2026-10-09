import { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Bookmark, 
  Sparkles, 
  ExternalLink, 
  Building2, 
  DollarSign, 
  Layers,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useAppStore } from '../../app/useAppStore';
import { Job, RemoteType } from '../../types';
import { searchJobsWithDeduplication } from '../../repositories/jobRepository';
import { calculateJobFreshness } from '../../domain/jobProvider';
import { submitInstantApplication } from '../../domain/applicationCopilot';

export function JobsView() {
  const { 
    jobs, 
    setJobs,
    savedJobIds, 
    toggleSaveJob, 
    searchQuery, 
    selectedLocation, 
    selectedRemoteType,
    setSearchFilters,
    candidateProfile,
    setActiveTab,
    applications,
    addApplication
  } = useAppStore();

  const [queryInput, setQueryInput] = useState(searchQuery || candidateProfile?.title || '.NET Developer');
  const [locationInput, setLocationInput] = useState(selectedLocation || candidateProfile?.location || 'Hyderabad');
  const [remoteInput, setRemoteInput] = useState<RemoteType>(selectedRemoteType as RemoteType || 'all');
  const [freshnessInput, setFreshnessInput] = useState<number>(14);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instantApplyMsg, setInstantApplyMsg] = useState<string | null>(null);
  const [isInstantApplying, setIsInstantApplying] = useState(false);

  const executeSearch = async (keywords: string, location: string, remote: RemoteType, maxAgeDays: number = freshnessInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await searchJobsWithDeduplication({
        keywords,
        location,
        remoteType: remote,
        maxAgeDays,
        limit: 30
      }, candidateProfile);
      setJobs(results);
      if (results.length > 0) {
        setSelectedJob(results[0]);
      } else {
        setSelectedJob(null);
      }
    } catch (err: any) {
      console.error('Job search failed:', err);
      setError('Could not retrieve live job listings at this time. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync search inputs with Candidate Profile when profile changes
  useEffect(() => {
    if (candidateProfile) {
      const targetQuery = candidateProfile.title || '.NET Developer';
      let targetLoc = candidateProfile.location || 'Hyderabad';
      for (const prefix of ["Software Engineer", "Full-Stack .NET Developer", "Full-Stack Developer", "Fullstack Developer", "Developer", "Engineer", "Software", "Senior", "Lead", "Architect"]) {
        if (targetLoc.startsWith(prefix)) {
          targetLoc = targetLoc.slice(prefix.length).trim();
        }
      }
      setQueryInput(targetQuery);
      setLocationInput(targetLoc);
      executeSearch(targetQuery, targetLoc, remoteInput, freshnessInput);
    } else if (jobs.length === 0) {
      executeSearch('.NET Developer', 'Hyderabad', 'all', freshnessInput);
    } else if (!selectedJob && jobs.length > 0) {
      setSelectedJob(jobs[0]);
    }
  }, [candidateProfile?.id, candidateProfile?.title, candidateProfile?.location]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFilters(queryInput, locationInput, remoteInput);
    executeSearch(queryInput, locationInput, remoteInput, freshnessInput);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Job Search & Recommendations</h1>
          <p className="text-sm text-slate-400">
            Search fresh, verified job listings (max 7-14 days old) prioritized by user filters, profile match score, and recency.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-lg">
          <div className="lg:col-span-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Job title, skills, or keywords..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="lg:col-span-3 relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="City, state, or country..."
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={remoteInput}
              onChange={(e) => setRemoteInput(e.target.value as RemoteType)}
              className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Modes</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={freshnessInput}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setFreshnessInput(val);
                executeSearch(queryInput, locationInput, remoteInput, val);
              }}
              className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value={7}>Fresh (≤ 7 Days)</option>
              <option value={14}>Fresh (≤ 14 Days)</option>
              <option value={30}>Max 30 Days</option>
              <option value={0}>All Jobs</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors shrink-0 shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Search</span>
              )}
            </button>
          </div>
        </form>

        {/* Quick Multi-Role & Multi-City Filter Chips */}
        {candidateProfile?.preferences && (
          <div className="space-y-2 pt-1">
            {candidateProfile.preferences.preferredRoles && candidateProfile.preferences.preferredRoles.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
                <span className="text-slate-400 font-semibold shrink-0">Roles:</span>
                {candidateProfile.preferences.preferredRoles.map((role, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQueryInput(role);
                      executeSearch(role, locationInput, remoteInput);
                    }}
                    className={`px-3 py-1 rounded-lg border font-medium transition-colors shrink-0 ${
                      queryInput.toLowerCase() === role.toLowerCase()
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}

            {candidateProfile.preferences.preferredLocations && candidateProfile.preferences.preferredLocations.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
                <span className="text-slate-400 font-semibold shrink-0">Cities:</span>
                {candidateProfile.preferences.preferredLocations.map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setLocationInput(loc);
                      executeSearch(queryInput, loc, remoteInput);
                    }}
                    className={`px-3 py-1 rounded-lg border font-medium transition-colors shrink-0 ${
                      locationInput.toLowerCase() === loc.toLowerCase()
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-xs text-red-300 font-medium">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Job List Column */}
        <div className={`space-y-3 ${selectedJob ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Showing {jobs.length} results</span>
            <span>Sorted by relevance</span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/40 animate-pulse space-y-3">
                  <div className="h-4 bg-slate-700/60 rounded w-3/4" />
                  <div className="h-3 bg-slate-700/40 rounded w-1/2" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-6 bg-slate-700/40 rounded w-16" />
                    <div className="h-6 bg-slate-700/40 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-slate-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">No jobs found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try searching for software developer, .NET Developer, React Developer, or clearing filters.
              </p>
            </div>
          ) : (
            jobs.map((job) => {
              const isSaved = savedJobIds.includes(job.id);
              const isSelected = selectedJob?.id === job.id;
              const freshness = calculateJobFreshness(job);

              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500/60 shadow-lg shadow-cyan-500/5'
                      : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white hover:text-cyan-400 transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-medium text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {job.company}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {job.location}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveJob(job.id);
                      }}
                      className={`p-2 rounded-xl border transition-colors ${
                        isSaved
                          ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                          : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-white'
                      }`}
                      aria-label="Save Job"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-700/40 text-slate-300 capitalize font-medium">
                      {job.remoteType}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-700/40 text-slate-300 capitalize font-medium">
                      {job.employmentType}
                    </span>
                    {job.salary && job.salary !== 'Not specified' && (
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {job.salary}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/40">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {freshness.displayText}
                    </span>
                    <span className="flex items-center gap-1 text-cyan-400 font-medium">
                      View details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Job Detail Panel */}
        {selectedJob && (
          <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 space-y-6 sticky top-20 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-700/60 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedJob.title}</h2>
                <div className="text-sm text-cyan-400 font-medium mt-1">{selectedJob.company}</div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                  <span>{selectedJob.location}</span>
                  <span>•</span>
                  <span className="capitalize">{selectedJob.remoteType}</span>
                  <span>•</span>
                  <span>{selectedJob.employmentType}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSaveJob(selectedJob.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    savedJobIds.includes(selectedJob.id)
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>{savedJobIds.includes(selectedJob.id) ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  onClick={async () => {
                    if (!selectedJob) return;
                    setIsInstantApplying(true);
                    setInstantApplyMsg(null);
                    try {
                      const res = await submitInstantApplication(
                        candidateProfile || {
                          id: 'prof_default',
                          fullName: 'Candidate',
                          title: selectedJob.title,
                          email: '',
                          location: selectedJob.location,
                          summary: '',
                          yearsOfExperience: 3,
                          skills: [],
                          workExperience: [],
                          education: [],
                          certifications: [],
                          projects: [],
                          preferences: { preferredRoles: [], preferredLocations: [], remotePreference: 'all', employmentTypes: [] },
                          isConfirmed: true
                        },
                        selectedJob
                      );
                      
                      const existing = applications.find(a => a.jobId === selectedJob.id);
                      if (!existing) {
                        addApplication({
                          id: res.applicationId,
                          jobId: selectedJob.id,
                          jobTitle: selectedJob.title,
                          company: selectedJob.company,
                          location: selectedJob.location,
                          sourceUrl: selectedJob.sourceUrl,
                          status: 'applied',
                          appliedDate: new Date().toISOString().split('T')[0],
                          notes: [],
                          statusHistory: [{ status: 'applied', timestamp: new Date().toISOString() }],
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        });
                      }
                      setInstantApplyMsg(res.confirmationMessage);
                    } catch (err: any) {
                      console.error('Instant apply error:', err);
                    } finally {
                      setIsInstantApplying(false);
                    }
                  }}
                  disabled={isInstantApplying}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20 shrink-0"
                >
                  {isInstantApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>{isInstantApplying ? 'Submitting...' : 'Instant 1-Click Apply'}</span>
                </button>

                <a
                  href={selectedJob.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    if (selectedJob.sourceUrl) {
                      window.open(selectedJob.sourceUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-600/20 shrink-0"
                >
                  <span>Apply on Site</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {instantApplyMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-300 font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{instantApplyMsg}</span>
                </div>
                <button
                  onClick={() => setActiveTab('applications')}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors shrink-0"
                >
                  View in Tracker
                </button>
              </div>
            )}

            {/* AI Action Hub */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>AI Application Copilot Actions</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const existing = useAppStore.getState().applications.find(a => a.jobId === selectedJob.id);
                    if (!existing) {
                      useAppStore.getState().addApplication({
                        id: `app_${Date.now()}`,
                        jobId: selectedJob.id,
                        jobTitle: selectedJob.title,
                        company: selectedJob.company,
                        location: selectedJob.location,
                        sourceUrl: selectedJob.sourceUrl,
                        status: 'preparing',
                        appliedDate: new Date().toISOString().split('T')[0],
                        notes: [],
                        statusHistory: [{ status: 'preparing', timestamp: new Date().toISOString() }],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      });
                    }
                    setActiveTab('applications');
                  }}
                  className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-left text-xs font-medium text-slate-200 transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:text-cyan-400 transition-colors">Generate Cover Letter</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('interview');
                  }}
                  className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-left text-xs font-medium text-slate-200 transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:text-blue-400 transition-colors">Practice Interview Questions</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                </button>
              </div>
            </div>

            {/* Requirements & Description */}
            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Key Skills & Requirements
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.requirements.map((req, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/60 text-xs font-medium text-slate-200"
                    >
                      {req}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Job Description
                </h3>
                <p className="whitespace-pre-line leading-relaxed text-slate-300 text-xs sm:text-sm">
                  {selectedJob.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
