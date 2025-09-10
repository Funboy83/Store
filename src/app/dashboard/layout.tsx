'use client';

import React, { useState, useEffect } from 'react';
import { MainSidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Optional: persist sidebar state in localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setIsSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prevState => {
      const newState = !prevState;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
      return newState;
    });
  };

  return (
    <div className="flex min-h-screen">
      <MainSidebar isCollapsed={isSidebarCollapsed} />
      <main className="flex-1 flex flex-col">
        <Header onToggleSidebar={toggleSidebar} />
        <div className="p-6 sm:p-10 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
