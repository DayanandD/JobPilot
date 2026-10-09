import { Menu, UserCheck, UserX, Cpu } from 'lucide-react';
import { useAppStore } from '../../app/useAppStore';
import logoIcon from '../../assets/JobPilot.png';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Dashboard Overview',
  jobs: 'Live Job Discovery',
  saved: 'Saved Jobs Collection',
  applications: 'Application Tracker',
  interview: 'Interview Copilot & Simulator',
  profile: 'Candidate Profile',
  settings: 'Settings & Integrations'
};

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { 
    candidateProfile, 
    isConnectedToAnna, 
    activeTab, 
    setActiveTab
  } = useAppStore();

  return (
    <header className="h-[3.8rem] border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between shadow-sm shrink-0">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle Button */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Logo Branding */}
        <div className="flex items-center gap-2 md:hidden">
          <img src={logoIcon} alt="JobPilot Logo" className="w-7 h-7 object-contain" />
          <span className="font-bold text-white tracking-tight text-sm">JobPilot AI</span>
        </div>

        {/* Current Active View Title (Desktop) */}
        <div className="hidden md:flex items-center gap-2.5">
          <h2 className="font-bold text-white tracking-tight text-base">
            {TAB_TITLES[activeTab] || 'Dashboard Overview'}
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
            JobPilot AI
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Anna OS Connectivity Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <Cpu className={`w-3.5 h-3.5 ${isConnectedToAnna ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="text-slate-300 font-medium hidden sm:inline">
            {isConnectedToAnna ? 'Anna OS Ready' : 'Standalone Mode'}
          </span>
        </div>

        {/* Profile Readiness Chip */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            candidateProfile?.isConfirmed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
          }`}
        >
          {candidateProfile?.isConfirmed ? (
            <>
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Profile Active</span>
            </>
          ) : (
            <>
              <UserX className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Setup Profile</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
