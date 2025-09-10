'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, LayoutDashboard, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '../logo';

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
        'bg-card border-r flex flex-col transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex items-center justify-center h-20 border-b">
        <Logo isCollapsed={isCollapsed} />
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {mainNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
          return (
            <Link href={item.href} key={item.href} passHref>
              <div
                className={cn(
                  'flex items-center p-3 rounded-lg cursor-pointer',
                  isCollapsed ? 'justify-center' : 'justify-start',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
                title={item.label}
              >
                <item.icon className="h-6 w-6" />
                {!isCollapsed && <span className="ml-4 font-medium">{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
