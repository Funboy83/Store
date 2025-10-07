'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Database } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; migratedCount?: number; error?: string } | null>(null);

  const runMigration = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const response = await fetch('/api/migrate-legacy-parts', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Database className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Legacy Parts Migration</CardTitle>
            <CardDescription>
              Migrate parts that don't have proper batch data. This will create legacy batches for parts 
              that have inventory but no batch information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runMigration}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? 'Running Migration...' : 'Run Legacy Parts Migration'}
            </Button>

            {result && (
              <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription>
                    {result.success 
                      ? `Migration completed successfully! Migrated ${result.migratedCount} parts.`
                      : `Migration failed: ${result.error}`
                    }
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Current system status and diagnostic information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Inventory System:</span>
                <span className="text-green-600">FIFO Batch Tracking</span>
              </div>
              <div className="flex justify-between">
                <span>Purchase Orders:</span>
                <span className="text-green-600">Integrated</span>
              </div>
              <div className="flex justify-between">
                <span>Real-time Deduction:</span>
                <span className="text-green-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}