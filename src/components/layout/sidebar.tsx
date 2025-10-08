
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Boxes, LayoutGrid, BarChart3, Users, Settings, Landmark, ArrowLeftRight, Wrench, Smartphone, ChevronDown, ChevronRight, Package, Truck, FolderOpen } from 'lucide-react';
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
  },
  {
    href: '/dashboard/credit-notes',
    icon: BarChart3,
    label: 'Credit Notes',
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
  },
  {
    href: '/dashboard/general-inventory',
    icon: Boxes,
    label: 'General Inventory',
  },
  {
    href: '/dashboard/services',
    icon: Wrench,
    label: 'Manage Services',
  },
  {
    href: '/dashboard/restock',
    icon: Truck,
    label: 'Restock Inventory',
  }
];

const settingsSubItems = [
  {
    href: '/dashboard/settings/categories',
    icon: FolderOpen,
    label: 'Categories',
  },
  {
    href: '/dashboard/settings/custom-fields',
    icon: Package,
    label: 'Custom Fields',
  },
  {
    href: '/dashboard/admin',
    icon: Settings,
    label: 'Admin Panel',
  }
];

const settingsNavItem = {
    href: '/dashboard/settings',
    icon: Settings,
    label: 'Settings',
};

// Debug section (temporary)
const debugNavItems = [
  {
    href: '/debug-inventory',
    icon: LayoutGrid,
    label: 'Debug Inventory',
  },
  {
    href: '/debug-database-paths',
    icon: LayoutGrid,
    label: 'Database Paths',
  }
];

interface MainSidebarProps {
  isCollapsed: boolean;
}

export function MainSidebar({ isCollapsed }: MainSidebarProps) {
  const pathname = usePathname();
  const [isInventoryExpanded, setIsInventoryExpanded] = useState(
    pathname.startsWith('/dashboard/inventory') || pathname.startsWith('/dashboard/parts') || pathname.startsWith('/dashboard/general-inventory') || pathname.startsWith('/dashboard/services') || pathname.startsWith('/dashboard/restock')
  );
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(
    pathname.startsWith('/dashboard/settings')
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
    const isInventoryActive = pathname.startsWith('/dashboard/inventory') || pathname.startsWith('/dashboard/parts') || pathname.startsWith('/dashboard/general-inventory') || pathname.startsWith('/dashboard/services') || pathname.startsWith('/dashboard/restock');
    
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

  const renderSettingsSection = () => {
    const isSettingsActive = pathname.startsWith('/dashboard/settings');
    
    return (
      <div key="settings">
        <div
          className={cn(
            'flex items-center p-3 rounded-lg cursor-pointer transition-colors',
            isCollapsed ? 'justify-center' : '',
            isSettingsActive
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-slate-800'
          )}
          onClick={() => !isCollapsed && setIsSettingsExpanded(!isSettingsExpanded)}
          title="Settings"
        >
          <Settings className="h-7 w-7 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="ml-4 font-medium flex-1">Settings</span>
              {isSettingsExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
        </div>
        
        {!isCollapsed && isSettingsExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {settingsSubItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
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
            {renderSettingsSection()}
            
            {/* Debug Section */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              {debugNavItems.map(renderNavItem)}
            </div>
        </div>
      </div>
    </aside>
  );
}
