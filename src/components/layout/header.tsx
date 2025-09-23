'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Menu, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout, isAdmin, userRole } = useAuth();

  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'User';
  };

  return (
    <header className="bg-white shadow-sm h-20 flex items-center justify-between px-6 flex-shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="text-gray-600 hover:text-gray-800"
      >
        <Menu className="h-7 w-7" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              {getUserDisplayName()}
            </span>
            {isAdmin && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <Shield className="h-3 w-3" />
                Admin
              </Badge>
            )}
          </div>
          <span className="text-xs text-slate-500 capitalize">
            {userRole} Account
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
         <Avatar className="h-10 w-10">
            <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/user/40/40"} />
            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
              {getUserDisplayName().charAt(0).toUpperCase()}
            </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
