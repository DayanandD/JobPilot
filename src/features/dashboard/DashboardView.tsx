import { 
  Briefcase, 
  Bookmark, 
  CheckCircle2, 
  Search, 
  Sparkles, 
  FileText, 
  ArrowRight,
  UserCheck,
  Building2,
  TrendingUp,
  MessageSquareCode
} from 'lucide-react';
import { useAppStore } from '../../app/useAppStore';

export function DashboardView() {
  const { 
    candidateProfile, 
    jobs, 
    savedJobIds, 
    applications, 
    setActiveTab 
  } = useAppStore();

  const isProfileComplete = candidateProfile?.isConfirmed ?? false;
  const activeApplications = applications.filter(a => a.status !== 'rejected' && a.status !== 'withdrawn');

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-6 md:p-8 border border-slate-700/60 shadow-xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            AI Career Copilot Ready
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Welcome to JobPilot AI{candidateProfile?.fullName ? `, ${candidateProfile.fullName}` : ''}
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Find the right jobs, understand your match, prepare tailored applications, and practice interviews — grounded in your confirmed experience.
          </p>
        </div>
      </div>

      {/* Profile Onboarding Alert Banner if Profile is incomplete */}
      {!isProfileComplete && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5 sm:mt-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-200">Candidate Profile Incomplete</h3>
              <p className="text-xs text-amber-300/80">
                Upload your resume or confirm your background to unlock deterministic job match scoring.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('profile')}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            Set Up Profile
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveTab('jobs')}
          className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 cursor-pointer transition-all hover:bg-slate-800/80 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Available Jobs</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">{jobs.length}</div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-cyan-400" />
            <span>Updated real-time</span>
          </p>
        </div>

        <div 
          onClick={() => setActiveTab('saved')}
          className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 cursor-pointer transition-all hover:bg-slate-800/80 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Saved Jobs</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">{savedJobIds.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Bookmarked for application</p>
        </div>

        <div 
          onClick={() => setActiveTab('applications')}
          className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 cursor-pointer transition-all hover:bg-slate-800/80 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Applications</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">{activeApplications.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">In progress tracker</p>
        </div>

        <div 
          onClick={() => setActiveTab('interview')}
          className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 cursor-pointer transition-all hover:bg-slate-800/80 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Interview Sessions</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <MessageSquareCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">Ready</div>
          <p className="text-[11px] text-slate-400 mt-1">Mock interview simulator</p>
        </div>
      </div>

      {/* Action Cards & Quick Launch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommended Actions */}
        <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            <span>Recommended Actions</span>
          </h2>
          <div className="space-y-3">
            <div 
              onClick={() => setActiveTab('profile')}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/40 hover:border-slate-600 cursor-pointer flex items-center justify-between group transition-colors"
            >
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  1. Parse & Verify Resume
                </div>
                <div className="text-xs text-slate-400">
                  Extract skills, technologies, and experience parameters.
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </div>

            <div 
              onClick={() => setActiveTab('jobs')}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/40 hover:border-slate-600 cursor-pointer flex items-center justify-between group transition-colors"
            >
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  2. Search & Analyze Live Jobs
                </div>
                <div className="text-xs text-slate-400">
                  Run deterministic match scoring against role requirements.
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </div>

            <div 
              onClick={() => setActiveTab('interview')}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/40 hover:border-slate-600 cursor-pointer flex items-center justify-between group transition-colors"
            >
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  3. Practice Mock Interview
                </div>
                <div className="text-xs text-slate-400">
                  Simulate technical & behavioral interview questions with instant evaluation.
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </div>
          </div>
        </div>

        {/* Quick Profile Summary */}
        <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <span>Profile Overview</span>
          </h2>

          {candidateProfile ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-400">Target Title</div>
                <div className="text-sm font-semibold text-white">{candidateProfile.title || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Experience Level</div>
                <div className="text-sm font-semibold text-white">{candidateProfile.yearsOfExperience} Years</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Key Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {candidateProfile.skills.slice(0, 6).map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium"
                    >
                      {skill.name}
                    </span>
                  ))}
                  {candidateProfile.skills.length > 6 && (
                    <span className="text-xs text-slate-400 self-center">
                      +{candidateProfile.skills.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-slate-400">No profile configured yet.</p>
              <button
                onClick={() => setActiveTab('profile')}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors shadow-lg shadow-cyan-600/20"
              >
                Upload Resume or Create Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
