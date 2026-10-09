import { Bookmark, Building2, MapPin, ExternalLink, Trash2, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../app/useAppStore';

export function SavedJobsView() {
  const { jobs, savedJobIds, toggleSaveJob, setActiveTab } = useAppStore();

  const savedJobs = jobs.filter(job => savedJobIds.includes(job.id));

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-purple-400" />
          <span>Saved Jobs</span>
        </h1>
        <p className="text-sm text-slate-400">
          Your bookmarked positions. Prepare tailored materials or track application status.
        </p>
      </div>

      {savedJobs.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">No saved jobs yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Browse available listings in the Job Search tab and click the bookmark icon to save jobs here.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('jobs')}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors shadow-lg shadow-cyan-600/20"
          >
            Explore Jobs
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedJobs.map((job) => (
            <div
              key={job.id}
              className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">{job.title}</h3>
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
                  onClick={() => toggleSaveJob(job.id)}
                  className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Remove from saved jobs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-700/40 text-slate-300 capitalize">
                  {job.remoteType}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-700/40 text-slate-300 capitalize">
                  {job.employmentType}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-700/40">
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>Official URL</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => setActiveTab('applications')}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Prepare Application</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
