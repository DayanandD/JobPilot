import { useEffect, useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useAppStore } from '../../app/useAppStore';
import { initAnnaClient } from '../../anna';
import { DashboardView } from '../../features/dashboard/DashboardView';
import { JobsView } from '../../features/jobs/JobsView';
import { SavedJobsView } from '../../features/jobs/SavedJobsView';
import { ApplicationsView } from '../../features/applications/ApplicationsView';
import { InterviewView } from '../../features/interview/InterviewView';
import { ProfileView } from '../../features/profile/ProfileView';
import { SettingsView } from '../../features/settings/SettingsView';

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { activeTab, setIsConnectedToAnna } = useAppStore();

  useEffect(() => {
    initAnnaClient().then(({ isConnected, error }) => {
      setIsConnectedToAnna(isConnected);
      if (!isConnected && error) {
        setConnectionError(error);
      }
    });
  }, [setIsConnectedToAnna]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'jobs':
        return <JobsView />;
      case 'saved':
        return <SavedJobsView />;
      case 'applications':
        return <ApplicationsView />;
      case 'interview':
        return <InterviewView />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex overflow-hidden antialiased font-sans">
      {/* Full-height Sidebar on Left */}
      <Sidebar />
      
      {/* Main Content Area on Right */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        
        {connectionError && (
          <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-between shrink-0">
            <span className="font-medium">{connectionError}</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      <MobileNav 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </div>
  );
}
