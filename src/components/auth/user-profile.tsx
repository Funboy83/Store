'use client';

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Shield, LogOut } from 'lucide-react';

export function UserProfile() {
  const { user, logout, isAdmin, userRole } = useAuth();

  if (!user) return null;

  const getUserDisplayName = () => {
    return user.displayName || user.email?.split('@')[0] || 'User';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4" />
          User Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.photoURL || "https://picsum.photos/seed/user/48/48"} />
            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
              {getUserDisplayName().charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">
                {getUserDisplayName()}
              </h3>
              {isAdmin && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {userRole} Account
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={logout}
          className="w-full flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}