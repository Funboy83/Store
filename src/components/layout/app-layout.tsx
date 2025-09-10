
'use client';

import React from 'react';

interface AppLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function AppLayout({ sidebar, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {sidebar}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
