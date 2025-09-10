'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, LayoutDashboard, FileText, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

const mainNavItems = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    href: '/dashboard/inventory',
    icon: Boxes,
    label: 'Inventory',
  },
  {
    href: '/dashboard/invoices',
    icon: FileText,
    label: 'Invoices',
  },
];

interface MainSidebarProps {
  isCollapsed: boolean;
}

export function MainSidebar({ isCollapsed }: MainSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-center h-20 border-b border-sidebar-border">
        <Smartphone className="h-9 w-9 text-sidebar-primary" />
        {!isCollapsed && (
          <h1 className="text-xl font-bold ml-2 text-sidebar-foreground">CellSmart</h1>
        )}
      </div>
      <nav className="flex-1 px-2 sm:px-4 py-4 space-y-2">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={item.href} passHref>
              <button
                className={cn(
                  'w-full flex items-center p-3 rounded-lg',
                  isCollapsed ? 'justify-center' : 'justify-start',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'hover:bg-sidebar-accent'
                )}
              >
                <item.icon className="h-6 w-6" />
                {!isCollapsed && <span className="ml-4">{item.label}</span>}
              </button>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
