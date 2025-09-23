'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield, ExternalLink } from 'lucide-react';
import { AUTH_CONFIG } from '@/lib/auth-config';

export function AuthDebugPanel() {
  const { user, isAuthenticated, isAdmin, userRole, logout } = useAuth();

  const testRedirect = () => {
    const loginUrl = AUTH_CONFIG.getLoginUrl();
    console.log('Redirecting to:', loginUrl);
    window.location.href = loginUrl;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
        <User className="h-4 w-4" />
        Auth Debug Panel
      </h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}
        </div>
        
        <div>
          <strong>Login URL:</strong> 
          <br />
          <span className="text-blue-600 break-all">{AUTH_CONFIG.getLoginUrl()}</span>
        </div>
        
        {user && (
          <>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>Display Name:</strong> {user.displayName || 'Not set'}
            </div>
            <div>
              <strong>Role:</strong> {userRole}
            </div>
            <div>
              <strong>Admin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}
            </div>
          </>
        )}
        
        <div className="flex gap-2 mt-3">
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={logout}
            className="flex-1 flex items-center gap-1"
          >
            <LogOut className="h-3 w-3" />
            Logout
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={testRedirect}
            className="flex-1 flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Test Redirect
          </Button>
        </div>
      </div>
    </div>
  );
}