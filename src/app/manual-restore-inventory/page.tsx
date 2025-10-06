'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, AlertTriangle, CheckCircle, Settings } from 'lucide-react';

export default function ManualRestorePage() {
  const [creditNoteId, setCreditNoteId] = useState('');
  const [originalInvoiceId, setOriginalInvoiceId] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleRestore = async () => {
    if (!creditNoteId.trim() || !originalInvoiceId.trim()) return;
    
    setIsRestoring(true);
    try {
      const response = await fetch('/api/manual-restore-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          creditNoteId: creditNoteId.trim(),
          originalInvoiceId: originalInvoiceId.trim()
        })
      });
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({ error: 'Failed to restore inventory items' });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manual Inventory Restore</h1>
        <p className="text-muted-foreground">Manually restore returned items to inventory from history</p>
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Settings className="h-5 w-5" />
            Emergency Restore Tool
          </CardTitle>
          <CardDescription className="text-orange-600">
            Use this tool if the automatic refund process didn't restore inventory items properly.
            This will find items in inventory history and restore them to "Available" status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Credit Note ID</label>
              <Input
                placeholder="e.g., FBTGpHT28gCH7qhYPSq"
                value={creditNoteId}
                onChange={(e) => setCreditNoteId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Original Invoice ID</label>
              <Input
                placeholder="e.g., eNBIdKceqj6UnQzQl"
                value={originalInvoiceId}
                onChange={(e) => setOriginalInvoiceId(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleRestore} 
            disabled={isRestoring || !creditNoteId.trim() || !originalInvoiceId.trim()}
            className="w-full"
          >
            {isRestoring ? 'Restoring Items...' : 'Restore Items to Inventory'}
          </Button>
          
          <div className="text-xs text-orange-600 space-y-1">
            <p><strong>How to find IDs:</strong></p>
            <p>• Credit Note ID: From credit note URL or debug tools</p>
            <p>• Original Invoice ID: From credit note details or invoice URL</p>
          </div>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-4">
          {results.error ? (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600">{results.error}</p>
                {results.details && (
                  <p className="text-sm text-red-500 mt-2">{results.details}</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    {results.message}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-green-600">
                    <p>Credit Note: {results.results?.creditNoteId}</p>
                    <p>Original Invoice: {results.results?.originalInvoiceId}</p>
                    <p>Items Restored: {results.results?.restoredItems?.length || 0}</p>
                  </div>
                </CardContent>
              </Card>

              {results.results?.restoredItems && results.results.restoredItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Restored Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {results.results.restoredItems.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-semibold">{item.brand} {item.model}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {item.id} | IMEI: {item.imei}
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {item.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {results.results?.errors && results.results.errors.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-700">Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {results.results.errors.map((error: any, index: number) => (
                        <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                          <strong>History ID:</strong> {error.historyId}<br/>
                          <strong>Error:</strong> {error.error}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}