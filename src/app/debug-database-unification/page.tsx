'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Database, ArrowRight, AlertTriangle, CheckCircle, Users, ShoppingCart, FileText, Package } from 'lucide-react';

export default function DatabaseUnificationPage() {
  const [isChecking, setIsChecking] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [migrationResults, setMigrationResults] = useState<any>(null);

  const handleCheckAllPaths = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/migrate-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' })
      });
      
      const data = await response.json();
      if (data.results) {
        setResults(data.results);
      }
    } catch (error) {
      console.error('Error checking paths:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleMigrateAll = async () => {
    if (!confirm('Are you sure you want to migrate all data? This will copy all old data to the new path.')) {
      return;
    }
    
    setIsMigrating(true);
    try {
      const response = await fetch('/api/migrate-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'migrate-all' })
      });
      
      const data = await response.json();
      setMigrationResults(data);
      
      // Refresh the check results
      await handleCheckAllPaths();
    } catch (error) {
      console.error('Error migrating data:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'data_in_new_path':
        return <Badge className="bg-green-100 text-green-800">✓ New Path</Badge>;
      case 'data_in_old_path':
        return <Badge variant="destructive">⚠ Old Path</Badge>;
      case 'data_split':
        return <Badge className="bg-yellow-100 text-yellow-800">⚠ Split</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getIcon = (collection: string) => {
    switch (collection) {
      case 'customers':
        return <Users className="h-5 w-5" />;
      case 'inventory':
        return <Package className="h-5 w-5" />;
      case 'invoices':
        return <FileText className="h-5 w-5" />;
      case 'repairJobs':
        return <ShoppingCart className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Database Path Unification</h1>
        <p className="text-muted-foreground">Diagnose and fix database path inconsistencies</p>
      </div>

      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Database Path Issue Detected
          </CardTitle>
          <CardDescription>
            Your data is scattered across different database paths, causing inconsistencies where new data doesn't appear.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">The Problem:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Old data exists in: <code className="bg-gray-200 px-1 rounded">cellphone-inventory-system/data</code></li>
              <li>New data is being saved to: <code className="bg-gray-200 px-1 rounded">app-data/cellsmart-data</code></li>
              <li>The app only reads from the new path, so old data appears missing</li>
              <li>New customers/inventory you add won't show existing old data</li>
            </ul>
          </div>

          <Separator />

          <Button onClick={handleCheckAllPaths} disabled={isChecking} className="w-full">
            {isChecking ? 'Checking Database Paths...' : 'Check All Database Paths'}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Database Status Report</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(results).map(([collection, data]: [string, any]) => (
              <Card key={collection}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      {getIcon(collection)}
                      {collection.charAt(0).toUpperCase() + collection.slice(1)}
                    </div>
                    {getStatusBadge(data.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Old Path:</span>
                    <Badge variant="outline">{data.old} items</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">New Path:</span>
                    <Badge variant="outline">{data.new} items</Badge>
                  </div>
                  
                  {data.status === 'data_in_old_path' && (
                    <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs">
                      <strong>Action needed:</strong> Migrate {data.old} items to new path
                    </div>
                  )}
                  
                  {data.status === 'data_split' && (
                    <div className="bg-orange-50 border border-orange-200 p-2 rounded text-xs">
                      <strong>Action needed:</strong> Merge {data.old} old items with {data.new} new items
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                Recommended Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold">Step 1: Backup Current Data</h4>
                <p className="text-sm">Export current data before making any changes</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Step 2: Migrate Old Data</h4>
                <p className="text-sm">Copy all data from old paths to new unified path</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Step 3: Verify Migration</h4>
                <p className="text-sm">Ensure all data appears correctly in the app</p>
              </div>

              <div className="pt-4">
                <Button 
                  className="w-full" 
                  onClick={handleMigrateAll}
                  disabled={isMigrating}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  {isMigrating ? 'Migrating All Data...' : 'Auto-Migrate All Data'}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  This will copy all data from old paths to the new unified path
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {migrationResults && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Migration Complete
            </CardTitle>
            <CardDescription>
              {migrationResults.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(migrationResults.results || {}).map(([collection, result]: [string, any]) => (
                <div key={collection} className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.migrated}</div>
                  <div className="text-sm text-muted-foreground">{collection}</div>
                  {result.status === 'error' && (
                    <div className="text-xs text-red-600">Error</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Path Configuration</CardTitle>
          <CardDescription>All modules are now configured to use the unified path</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-100 p-3 rounded-md font-mono text-sm">
            <div className="text-green-600 font-semibold">✓ Unified Path (All modules):</div>
            <div className="ml-4">app-data/cellsmart-data</div>
          </div>
          
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold text-sm">Modules using unified path:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>✓ Customers</div>
              <div>✓ Inventory</div>
              <div>✓ Invoices</div>
              <div>✓ Repair Jobs</div>
              <div>✓ Payments</div>
              <div>✓ Parts</div>
              <div>✓ Credit Notes</div>
              <div>✓ Edit History</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}