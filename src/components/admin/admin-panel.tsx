'use client';

import { useAdmin } from '@/hooks/use-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, BarChart3, Settings } from 'lucide-react';

export function AdminPanel() {
  const { isAdmin, userRole, user } = useAdmin();

  if (!isAdmin) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Panel
          </CardTitle>
          <CardDescription>
            Administrative controls and management tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-yellow-800 text-sm flex items-center gap-2">
              🔒 Admin access required to view this panel
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Admin Panel
          <Badge variant="secondary" className="ml-2">
            Admin Access
          </Badge>
        </CardTitle>
        <CardDescription>
          Welcome, {user?.displayName || user?.email} - Administrative controls and management tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">User Management</h3>
            </div>
            <p className="text-sm text-blue-700">Manage user accounts and permissions</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Reports</h3>
            </div>
            <p className="text-sm text-green-700">View detailed analytics and reports</p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">System Settings</h3>
            </div>
            <p className="text-sm text-purple-700">Configure system-wide settings</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Admin Information</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Role:</strong> {userRole}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Display Name:</strong> {user?.displayName || 'Not set'}</p>
            <p><strong>Admin Status:</strong> <span className="text-green-600 font-semibold">Active</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}