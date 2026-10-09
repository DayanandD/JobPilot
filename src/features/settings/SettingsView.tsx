import { Settings, Shield, Trash2, Cpu } from 'lucide-react';
import { useAppStore } from '../../app/useAppStore';

export function SettingsView() {
  const { isConnectedToAnna, setCandidateProfile } = useAppStore();

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to delete all stored candidate profile data, saved jobs, and applications? This cannot be undone.')) {
      setCandidateProfile(null);
      alert('All local user data deleted successfully.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-400" />
          <span>Settings & Data Controls</span>
        </h1>
        <p className="text-sm text-slate-400">
          Manage platform connectivity, Anna Persistent Storage settings, and privacy controls.
        </p>
      </div>

      <div className="space-y-4 max-w-3xl">
        {/* Anna OS Integration Status */}
        <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Anna AI OS Bridge Status</span>
          </div>
          <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-900/60 border border-slate-700/40">
            <span className="text-slate-300">@anna-ai/app-runtime SDK Connection</span>
            <span className={`font-semibold px-2 py-0.5 rounded ${
              isConnectedToAnna ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
            }`}>
              {isConnectedToAnna ? 'Connected' : 'Standalone / Local Harness'}
            </span>
          </div>
        </div>

        {/* Data Storage & Privacy Controls */}
        <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Privacy & User Data Deletion</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            In compliance with Anna platform guidelines, you retain full ownership of your candidate profile, resume data, and job applications. You can permanently delete all stored records at any time.
          </p>

          <div className="pt-2">
            <button
              onClick={handleClearAllData}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All Candidate Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
