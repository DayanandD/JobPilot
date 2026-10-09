import { 
  LayoutDashboard, 
  Search, 
  Bookmark, 
  Briefcase, 
  MessageSquareCode, 
  User, 
  Settings,
  X 
} from 'lucide-react';
import { useAppStore } from '../../app/useAppStore';
import { TabType } from '../../types';
import logoDark from '../../assets/JobPilot_AI_dark.png';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { activeTab, setActiveTab, savedJobIds, applications } = useAppStore();

  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'jobs' as TabType, label: 'Search', icon: Search },
    { id: 'saved' as TabType, label: 'Saved', icon: Bookmark, badge: savedJobIds.length },
    { id: 'applications' as TabType, label: 'Applications', icon: Briefcase, badge: applications.length },
    { id: 'interview' as TabType, label: 'Interview', icon: MessageSquareCode },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  const bottomNavItems = [
    { id: 'dashboard' as TabType, label: 'Home', icon: LayoutDashboard },
    { id: 'jobs' as TabType, label: 'Search', icon: Search },
    { id: 'applications' as TabType, label: 'Tracker', icon: Briefcase, badge: applications.length },
    { id: 'interview' as TabType, label: 'Interview', icon: MessageSquareCode },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Side Drawer */}
      <div 
        className={`fixed top-0 bottom-0 left-0 w-72 bg-slate-900 border-r border-slate-800 z-50 p-4 transition-transform duration-300 md:hidden flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <img src={logoDark} alt="JobPilot AI Logo" className="h-8 object-contain" />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-slate-500 text-center">
          JobPilot AI Mobile View
        </div>
      </div>

      {/* Bottom Navigation Bar for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 border-t border-slate-800 backdrop-blur z-30 px-2 flex items-center justify-around">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors relative ${
                isActive ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-cyan-400" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
