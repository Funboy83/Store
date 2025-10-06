'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Folder, Search } from 'lucide-react';

export default function DatabasePathsPage() {
  const [paths, setPaths] = useState<any[]>([]);

  useEffect(() => {
    const currentPath = 'app-data/cellsmart-data';
    const oldPath = 'cellphone-inventory-system/data';
    
    setPaths([
      {
        name: 'Current Active Path',
        path: currentPath,
        collection: 'inventory',
        fullPath: `${currentPath} > inventory`,
        status: 'active',
        description: 'This is where the app currently stores and reads phone inventory data'
      },
      {
        name: 'Legacy Path (Deprecated)',
        path: oldPath,
        collection: 'inventory',
        fullPath: `${oldPath} > inventory`,
        status: 'deprecated',
        description: 'Old path that might contain historical data (not actively used)'
      }
    ]);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Firebase Database Paths</h1>
        <p className="text-muted-foreground">Phone inventory database structure and paths</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paths.map((pathInfo, index) => (
          <Card key={index} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {pathInfo.name}
                </CardTitle>
                <Badge variant={pathInfo.status === 'active' ? 'default' : 'secondary'}>
                  {pathInfo.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-100 p-3 rounded-md font-mono text-sm">
                <div className="flex items-center gap-2 text-blue-600">
                  <Folder className="h-4 w-4" />
                  {pathInfo.path}
                </div>
                <div className="ml-6 flex items-center gap-2 text-green-600">
                  <Folder className="h-4 w-4" />
                  {pathInfo.collection}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {pathInfo.description}
              </p>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Full Firebase Path:</h4>
                <div className="bg-black text-green-400 p-2 rounded font-mono text-xs">
                  {pathInfo.fullPath}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Search className="h-5 w-5" />
            How to Find Your Data in Firebase Console
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Steps to locate phone inventory in Firebase:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Open Firebase Console → Your Project → Firestore Database</li>
              <li>Look for document: <code className="bg-gray-200 px-1 rounded">app-data</code></li>
              <li>Inside that document, find: <code className="bg-gray-200 px-1 rounded">cellsmart-data</code></li>
              <li>Inside that collection, look for: <code className="bg-gray-200 px-1 rounded">inventory</code></li>
              <li>Each phone will be a separate document inside the inventory collection</li>
            </ol>
          </div>
          
          <div className="bg-white p-3 rounded border border-orange-200">
            <h4 className="font-semibold text-sm mb-2">Current Active Path:</h4>
            <div className="font-mono text-xs">
              📁 Root Collection<br/>
              &nbsp;&nbsp;📄 app-data (document)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;📁 cellsmart-data (subcollection)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;📁 inventory (subcollection)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;📄 [phone-id-1] (document)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;📄 [phone-id-2] (document)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;📄 ...
            </div>
          </div>

          <div className="text-sm text-orange-700">
            <strong>Note:</strong> If you don't see any phones in the current path, they might be in the legacy path: 
            <code className="bg-gray-200 px-1 rounded ml-1">cellphone-inventory-system/data/inventory</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}