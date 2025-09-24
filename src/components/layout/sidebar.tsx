
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Boxes, LayoutGrid, BarChart3, Users, Settings, Landmark, ArrowLeftRight, Wrench, Smartphone, ChevronDown, ChevronRight, Package, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '../logo';

const mainNavItems = [
  {
    href: '/dashboard',
    icon: LayoutGrid,
    label: 'Dashboard',
  },
  {
    href: '/dashboard/repairs',
    icon: Smartphone,
    label: 'Repair Shop',
  },
  {
    href: '/dashboard/jobs',
    icon: Wrench,
    label: 'Jobs',
  },
  {
    href: '/dashboard/invoices',
    icon: BarChart3,
    label: 'Invoices',
  },
  {
    href: '/dashboard/repair-customers',
    icon: Users,
    label: 'Repair Customers',
  },
  {
    href: '/dashboard/customers',
    icon: Users,
    label: 'Store Customers',
  },
  {
    href: '/dashboard/suppliers',
    icon: Truck,
    label: 'Suppliers',
  },
  {
    href: '/dashboard/finance',
    icon: Landmark,
    label: 'Finance',
  },
  {
    href: '/dashboard/refund-exchange',
    icon: ArrowLeftRight,
    label: 'Refund & Exchange',
  }
];

const inventorySubItems = [
  {
    href: '/dashboard/inventory',
    icon: Smartphone,
    label: 'Manage Phones',
  },
  {
    href: '/dashboard/parts',
    icon: Package,
    label: 'Manage Parts',
  }
];

const settingsNavItem = {
    href: '/dashboard/settings',
    icon: Settings,
    label: 'Settings',
};

interface MainSidebarProps {
  isCollapsed: boolean;
}

export function MainSidebar({ isCollapsed }: MainSidebarProps) {
  const pathname = usePathname();
  const [isInventoryExpanded, setIsInventoryExpanded] = useState(
    pathname.startsWith('/dashboard/inventory') || pathname.startsWith('/dashboard/parts')
  );

  const renderNavItem = (item: typeof mainNavItems[0]) => {
    const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
    return (
        <Link href={item.href} key={item.href} passHref>
          <div
            className={cn(
              'flex items-center p-3 rounded-lg cursor-pointer transition-colors',
              isCollapsed ? 'justify-center' : '',
              isActive
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-slate-800'
            )}
            title={item.label}
          >
            <item.icon className="h-7 w-7 shrink-0" />
            {!isCollapsed && <span className="ml-4 font-medium">{item.label}</span>}
          </div>
        </Link>
    );
  };

  const renderInventorySection = () => {
    const isInventoryActive = pathname.startsWith('/dashboard/inventory') || pathname.startsWith('/dashboard/parts');
    
    return (
      <div key="inventory">
        <div
          className={cn(
            'flex items-center p-3 rounded-lg cursor-pointer transition-colors',
            isCollapsed ? 'justify-center' : '',
            isInventoryActive
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-slate-800'
          )}
          onClick={() => !isCollapsed && setIsInventoryExpanded(!isInventoryExpanded)}
          title="Inventory"
        >
          <Boxes className="h-7 w-7 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="ml-4 font-medium flex-1">Inventory</span>
              {isInventoryExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
        </div>
        
        {!isCollapsed && isInventoryExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {inventorySubItems.map((item) => {
              const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
              return (
                <Link href={item.href} key={item.href} passHref>
                  <div
                    className={cn(
                      'flex items-center p-2 rounded-lg cursor-pointer transition-colors pl-8',
                      isActive
                        ? 'bg-indigo-500 text-white'
                        : 'hover:bg-slate-700'
                    )}
                    title={item.label}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="ml-3 text-sm font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        'bg-slate-900 text-gray-200 flex flex-col transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex items-center h-20 border-b border-slate-800 flex-shrink-0 px-4">
        <Logo isCollapsed={isCollapsed} />
      </div>
      <div className="flex-1 flex flex-col justify-between py-4">
        <nav className="flex-1 px-4 space-y-2">
            {mainNavItems.map(renderNavItem)}
            {renderInventorySection()}
        </nav>
        <div className="px-4">
            {renderNavItem(settingsNavItem)}
        </div>
      </div>
    </aside>
  );
}
