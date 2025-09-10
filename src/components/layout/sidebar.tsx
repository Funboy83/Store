
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Boxes,
  ChevronDown,
  FileText,
  HelpCircle,
  LayoutDashboard,
  PanelLeftClose,
  PanelRightClose,
  Settings,
} from 'lucide-react';
import React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

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

const preferenceNavItems = [
  {
    href: '/dashboard/settings',
    icon: Settings,
    label: 'Settings',
  },
  {
    href: '/dashboard/help',
    icon: HelpCircle,
    label: 'Help Center',
  },
];

function SidebarCollapseTrigger() {
  const { state, toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={toggleSidebar}
    >
      {state === 'expanded' ? <PanelLeftClose /> : <PanelRightClose />}
    </Button>
  );
}

export function MainSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <Logo />
      </div>

      <div className="p-4">
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <Avatar className="h-6 w-6">
              <AvatarImage src="https://picsum.photos/seed/user/40/40" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            {state === 'expanded' && <span className="font-semibold truncate">Uxerflow</span>}
          </div>
          {state === 'expanded' && <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      <SidebarContent className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          {state === 'expanded' ? (
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Main Menu
            </h3>
          ) : (
             <div className="h-8" />
          )}
          <SidebarMenu>
            {mainNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="w-full"
                    tooltip={item.label}
                  >
                    <>
                      <item.icon className="h-4 w-4" />
                      {state === 'expanded' && <span>{item.label}</span>}
                    </>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>

        <div className="px-4 py-2">
           {state === 'expanded' ? (
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Preference
            </h3>
            ) : (
                <div className="h-8" />
            )}
          <SidebarMenu>
            {preferenceNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    className="w-full"
                    tooltip={item.label}
                  >
                    <>
                      <item.icon className="h-4 w-4" />
                      {state === 'expanded' && <span>{item.label}</span>}
                    </>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t flex justify-end">
        <SidebarCollapseTrigger />
      </SidebarFooter>
    </div>
  );
}
