
'use client';

import React from 'react';
import {
  Sidebar,
  SidebarProvider,
} from '@/components/ui/sidebar';

interface AppLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function AppLayout({ sidebar, children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>{sidebar}</Sidebar>
        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    </SidebarProvider>
  );
}
