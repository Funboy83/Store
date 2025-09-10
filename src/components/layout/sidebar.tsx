'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, ChevronDown, FileText, HelpCircle, LayoutDashboard, Settings } from 'lucide-react';
import React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';

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
    }
]

export function MainSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-card border-r h-screen sticky top-0">
        <div className="p-4">
            <Logo />
        </div>

        <div className="p-4">
            <Button variant="outline" className="w-full justify-between">
                <div className='flex items-center gap-2'>
                    <Avatar className="h-6 w-6">
                        <AvatarImage src="https://picsum.photos/seed/user/40/40" />
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">Uxerflow</span>
                </div>
                <ChevronDown className="h-4 w-4" />
            </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Main Menu</h3>
                <SidebarMenu>
                {mainNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref>
                        <SidebarMenuButton asChild isActive={pathname === item.href} className="w-full">
                        <React.Fragment>
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                        </React.Fragment>
                        </SidebarMenuButton>
                    </Link>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </div>

            <div className="px-4 py-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Preference</h3>
                <SidebarMenu>
                {preferenceNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref>
                        <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} className="w-full">
                        <React.Fragment>
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                        </React.Fragment>
                        </SidebarMenuButton>
                    </Link>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </div>
        </div>

        <div className="p-4 border-t">
            {/* Dark mode toggle or other footer content can go here */}
        </div>
    </div>
  );
}
