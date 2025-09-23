'use client';

import { useState, useCallback } from 'react';
import { MainSidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isMobile);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        <MainSidebar isCollapsed={isSidebarCollapsed} />
        <div className={cn("flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out")}>
          <Header onToggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 sm:p-10">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
