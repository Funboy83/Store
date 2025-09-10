'use client';

import { useState } from 'react';
import { MainSidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      <MainSidebar isOpen={isSidebarOpen} />
      <main className="flex-1 flex flex-col">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="p-6 sm:p-10 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
