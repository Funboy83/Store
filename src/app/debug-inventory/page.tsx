'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { checkBothInventoryPaths, migrateInventoryToNewPath } from '@/lib/actions/inventory-migration';
import { Database, ArrowRight } from 'lucide-react';

export default function InventoryDebugPage() {
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleCheck = async () => {
    setLoading(true);
    try {
      const result = await checkBothInventoryPaths();
      setResults(result);
    } catch (error) {
      console.error('Error checking paths:', error);
    }
    setLoading(false);
  };

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const result = await migrateInventoryToNewPath();
      alert(result.success ? result.message : result.error);
      // Refresh data after migration
      if (result.success) {
        handleCheck();
      }
    } catch (error) {
      console.error('Error migrating:', error);
      alert('Migration failed');
    }
    setMigrating(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory Debug & Migration</h1>
        <p className="text-muted-foreground">Check and migrate inventory data between database paths</p>
      </div>

      <div className="flex gap-4">
        <Button onClick={handleCheck} disabled={loading}>
          <Database className="mr-2 h-4 w-4" />
          {loading ? 'Checking...' : 'Check Both Paths'}
        </Button>
        
        {results?.old?.length > 0 && (
          <Button onClick={handleMigrate} disabled={migrating} variant="outline">
            <ArrowRight className="mr-2 h-4 w-4" />
            {migrating ? 'Migrating...' : 'Migrate to New Path'}
          </Button>
        )}
      </div>

      {results && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Old Path (cellphone-inventory-system)
                <Badge variant={results.old.length > 0 ? 'default' : 'secondary'}>
                  {results.old.length} items
                </Badge>
              </CardTitle>
              <CardDescription>Items in the old database path</CardDescription>
            </CardHeader>
            <CardContent>
              {results.old.length > 0 ? (
                <div className="space-y-2">
                  {results.old.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="p-2 border rounded text-sm">
                      <div className="font-medium">{item.brand} {item.model}</div>
                      <div className="text-xs text-muted-foreground">IMEI: {item.imei}</div>
                    </div>
                  ))}
                  {results.old.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{results.old.length - 5} more items...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No items found</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                New Path (app-data/cellsmart-data)
                <Badge variant={results.new.length > 0 ? 'default' : 'secondary'}>
                  {results.new.length} items
                </Badge>
              </CardTitle>
              <CardDescription>Items in the new database path</CardDescription>
            </CardHeader>
            <CardContent>
              {results.new.length > 0 ? (
                <div className="space-y-2">
                  {results.new.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="p-2 border rounded text-sm">
                      <div className="font-medium">{item.brand} {item.model}</div>
                      <div className="text-xs text-muted-foreground">IMEI: {item.imei}</div>
                    </div>
                  ))}
                  {results.new.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{results.new.length - 5} more items...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No items found</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}