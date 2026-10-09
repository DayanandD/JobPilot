import { useState } from 'react';
import { 
  Briefcase, 
  Building2, 
  ExternalLink, 
  Plus, 
  Clock, 
  Sparkles,
  Copy,
  Check,
  Download,
  X,
  Loader2
} from 'lucide-react';
import { useAppStore } from '../../app/useAppStore';
import { ApplicationStatus, JobApplication } from '../../types';
import { generateCoverLetter } from '../../domain/applicationCopilot';

const STATUS_BADGES: Record<ApplicationStatus, { label: string; color: string }> = {
  saved: { label: 'Saved', color: 'bg-slate-700 text-slate-300' },
  preparing: { label: 'Preparing', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  applied: { label: 'Applied', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  recruiter_contacted: { label: 'Recruiter Contacted', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  interview_scheduled: { label: 'Interview Scheduled', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  interviewing: { label: 'Interviewing', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  offer: { label: 'Offer Received', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  withdrawn: { label: 'Withdrawn', color: 'bg-slate-800 text-slate-400' },
};

export function ApplicationsView() {
  const { applications, updateApplicationStatus, candidateProfile, jobs, setActiveTab } = useAppStore();
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  const [activeCoverLetterApp, setActiveCoverLetterApp] = useState<JobApplication | null>(null);
  const [coverLetterText, setCoverLetterText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const filteredApplications = selectedStatusFilter === 'all'
    ? applications
    : applications.filter(app => app.status === selectedStatusFilter);

  const handleOpenCoverLetterModal = async (app: JobApplication) => {
    setActiveCoverLetterApp(app);
    if (app.coverLetter) {
      setCoverLetterText(app.coverLetter);
      return;
    }

    setIsGenerating(true);
    setCoverLetterText('');
    try {
      const targetJob = jobs.find(j => j.id === app.jobId) || {
        id: app.jobId,
        provider: 'local',
        providerJobId: app.jobId,
        title: app.jobTitle,
        company: app.company,
        location: app.location,
        remoteType: 'remote' as const,
        employmentType: 'full-time' as const,
        description: `Role at ${app.company} for ${app.jobTitle}`,
        requirements: [],
        preferredSkills: [],
        sourceUrl: app.sourceUrl || '',
        publishedAt: new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString()
      };

      const result = await generateCoverLetter(
        candidateProfile || {
          id: 'prof_default',
          fullName: 'Candidate',
          title: app.jobTitle,
          email: '',
          location: app.location,
          summary: '',
          yearsOfExperience: 3,
          skills: [],
          workExperience: [],
          education: [],
          certifications: [],
          projects: [],
          preferences: { preferredRoles: [], preferredLocations: [], remotePreference: 'all', employmentTypes: [] },
          isConfirmed: false
        },
        targetJob
      );
      setCoverLetterText(result.content);
    } catch (err) {
      console.error('Failed to generate cover letter:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([coverLetterText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Cover_Letter_${activeCoverLetterApp?.company || 'JobPilot'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-400" />
            <span>Application Tracker</span>
          </h1>
          <p className="text-sm text-slate-400">
            Track application stages, status changes, cover letters, and follow-up schedules.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('jobs')}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-lg shadow-cyan-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Application</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
            selectedStatusFilter === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          All ({applications.length})
        </button>
        {Object.entries(STATUS_BADGES).map(([key, info]) => {
          const count = applications.filter(a => a.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setSelectedStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedStatusFilter === key
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              {info.label} ({count})
            </button>
          );
        })}
      </div>

      {filteredApplications.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">No active applications in this view</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add new job applications from your saved jobs list or search results to track your progress.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('jobs')}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors shadow-lg shadow-cyan-600/20"
          >
            Explore Jobs & Apply
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const badge = STATUS_BADGES[app.status] || STATUS_BADGES.saved;

            return (
              <div
                key={app.id}
                className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{app.jobTitle}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {app.company}
                      </span>
                      <span>•</span>
                      <span>{app.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
                      {badge.label}
                    </span>

                    <select
                      value={app.status}
                      onChange={(e) => updateApplicationStatus(app.id, e.target.value as ApplicationStatus)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      {Object.entries(STATUS_BADGES).map(([key, info]) => (
                        <option key={key} value={key}>
                          {info.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 pt-3 border-t border-slate-700/40">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Applied: {app.appliedDate || 'Not submitted yet'}
                    </span>

                    {app.sourceUrl && (
                      <a
                        href={app.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          if (app.sourceUrl) {
                            window.open(app.sourceUrl, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <span>Destination Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenCoverLetterModal(app)}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{app.coverLetter ? 'View Cover Letter' : 'Generate Cover Letter'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Cover Letter Modal */}
      {activeCoverLetterApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveCoverLetterApp(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
              <Sparkles className="w-5 h-5" />
              <span>Cover Letter — {activeCoverLetterApp.jobTitle} at {activeCoverLetterApp.company}</span>
            </div>

            {isGenerating ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-300">Generating grounded cover letter via Anna AI...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  rows={10}
                  value={coverLetterText}
                  onChange={(e) => setCoverLetterText(e.target.value)}
                  className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Grounded strictly in your candidate profile data.
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium transition-colors flex items-center gap-1.5"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs text-white font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-600/20"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download .TXT</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
