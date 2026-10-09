import { useState } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Bookmark, 
  Briefcase, 
  MessageSquareCode, 
  User, 
  Settings,
  PanelLeftOpen,
  PanelLeftClose,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../app/useAppStore';
import { TabType } from '../../types';
import logoDark from '../../assets/JobPilot_AI_dark.png';
import logoIcon from '../../assets/JobPilot.png';

interface NavItem {
  id: TabType;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

export function Sidebar() {
  const [imgError, setImgError] = useState(false);
  const { 
    activeTab, 
    setActiveTab, 
    savedJobIds, 
    applications,
    isSidebarCollapsed,
    toggleSidebar
  } = useAppStore();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'jobs', label: 'Job Search', icon: Search },
    { id: 'saved', label: 'Saved Jobs', icon: Bookmark, badge: savedJobIds.length },
    { id: 'applications', label: 'Applications', icon: Briefcase, badge: applications.length },
    { id: 'interview', label: 'Interview Copilot', icon: MessageSquareCode },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside 
      className={`h-screen border-r border-slate-800 bg-slate-900/90 hidden md:flex flex-col justify-between shrink-0 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-20' : 'w-[15.5rem]'
      }`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top Header of Sidebar (Aligned with main Header height h-[3.8rem]) */}
        <div className="h-[3.8rem] border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
          {isSidebarCollapsed ? (
            <div className="flex items-center justify-between w-full">
              {!imgError ? (
                <img 
                  src={logoIcon} 
                  alt="JobPilot Logo" 
                  className="w-8 h-8 object-contain cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setActiveTab('dashboard')}
                  onError={() => setImgError(true)}
                  title="JobPilot AI"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                  <Sparkles className="w-5 h-5" />
                </div>
              )}
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Expand Sidebar"
              >
                <PanelLeftOpen className="w-5 h-5 text-cyan-400" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-2">
              {!imgError ? (
                <img 
                  src={logoDark} 
                  alt="JobPilot AI Logo" 
                  className="h-[3.8rem] w-[10rem] object-contain cursor-pointer hover:opacity-95 transition-opacity" 
                  onClick={() => setActiveTab('dashboard')}
                  onError={() => setImgError(true)}
                  title="JobPilot AI"
                />
              ) : (
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-white tracking-tight text-lg">JobPilot <span className="text-cyan-400">AI</span></span>
                </div>
              )}
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!isSidebarCollapsed && (
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Main Menu
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            if (isSidebarCollapsed) {
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-full flex items-center justify-center p-3 rounded-xl transition-all relative ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400" />
                  )}
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Section */}
        {!isSidebarCollapsed && (
          <div className="p-3 border-t border-slate-800/80 shrink-0">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400 space-y-0.5">
              <div className="font-semibold text-slate-200">JobPilot AI v1.0</div>
              <div>Anna AI OS sandboxed SPA</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
