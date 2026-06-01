/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginOverlay } from './components/LoginOverlay';

// Target Views
import { DashboardView } from './pages/DashboardView';
import { HistoryView } from './pages/HistoryView';
import { AdjustmentsView } from './pages/AdjustmentsView';
import { AtestadoView } from './pages/AtestadoView';
import { ProfileView } from './pages/ProfileView';
import { AdminUsersView } from './pages/AdminUsersView';
import { AdminShiftsView } from './pages/AdminShiftsView';
import { AdminApprovalsView } from './pages/AdminApprovalsView';
import { AdminReportsView } from './pages/AdminReportsView';

import { motion } from 'motion/react';
import { RefreshCcw } from 'lucide-react';
import { PrimeTimeLogo } from './components/PrimeTimeLogo';

function AppContent() {
  const { user, isInitialLoading } = useApp();
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Reset viewport routing safely when a user switches/logins to avoid stale tabs
  React.useEffect(() => {
    setCurrentRoute('dashboard');
  }, [user?.id]);

  // Full-screen initial loading state
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 gap-4">
        <PrimeTimeLogo size={64} />
        <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs">
          <RefreshCcw size={14} className="animate-spin text-emerald-400" />
          <span>Sintonizando servidores seguros...</span>
        </div>
      </div>
    );
  }

  // If user is absent, direct them to logon
  if (!user) {
    return <LoginOverlay />;
  }

  // Otherwise, display full-screen operational SaaS platform
  const renderView = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardView />;
      case 'history':
        return <HistoryView />;
      case 'adjustments':
        return <AdjustmentsView />;
      case 'upload':
        return <AtestadoView />;
      case 'profile':
        return <ProfileView />;
      
      // Admin options
      case 'admin-users':
        return <AdminUsersView />;
      case 'admin-shifts':
        return <AdminShiftsView />;
      case 'admin-approvals':
        return <AdminApprovalsView />;
      case 'admin-reports':
        return <AdminReportsView />;
      
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 antialiased font-sans flex transition-colors duration-200">
      
      {/* Universal Corporate Menu Sidebar Drawer */}
      <Sidebar 
        currentRoute={currentRoute} 
        onRouteChange={(route) => {
          setCurrentRoute(route);
          setIsMobileSidebarOpen(false);
        }}
        isOpenOnMobile={isMobileSidebarOpen}
        setIsOpenOnMobile={setIsMobileSidebarOpen}
      />

      {/* Main SaaS panel viewport */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <Header onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />

        {/* Scrollable workspace content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <motion.div
              key={currentRoute}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {renderView()}
            </motion.div>
          </div>
        </main>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

