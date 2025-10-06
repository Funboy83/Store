'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

export default function DebugInventoryReturnPage() {
  const [creditNoteId, setCreditNoteId] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleCheck = async () => {
    if (!creditNoteId.trim()) return;
    
    setIsChecking(true);
    try {
      const response = await fetch(`/api/debug-inventory-return?creditNoteId=${creditNoteId}`);
      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
      } else {
        setResults({ error: data.error });
      }
    } catch (error) {
      setResults({ error: 'Failed to check inventory status' });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Available':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Sold':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'IN_HISTORY':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'NOT_FOUND':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'CUSTOM_ITEM':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
        return <Badge className="bg-green-100 text-green-800">✓ Available</Badge>;
      case 'Sold':
        return <Badge variant="destructive">✗ Still Sold</Badge>;
      case 'IN_HISTORY':
        return <Badge className="bg-blue-100 text-blue-800">📦 In History (Can Restore)</Badge>;
      case 'NOT_FOUND':
        return <Badge variant="secondary">⚠ Not Found</Badge>;
      case 'CUSTOM_ITEM':
        return <Badge variant="outline">Custom Item</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Debug Inventory Returns</h1>
        <p className="text-muted-foreground">Check if returned items were properly updated in inventory</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Return Checker
          </CardTitle>
          <CardDescription>
            Enter a credit note ID to check if the returned items were properly updated in inventory
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Credit Note ID (e.g., FBTGpHT28gCH7qhYPSq)"
              value={creditNoteId}
              onChange={(e) => setCreditNoteId(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleCheck} disabled={isChecking || !creditNoteId.trim()}>
              {isChecking ? 'Checking...' : 'Check Status'}
            </Button>
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
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Credit Note Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Credit Note ID:</strong> {results.creditNote.id}</div>
                  <div><strong>Credit Note Number:</strong> {results.creditNote.creditNoteNumber || 'Not set'}</div>
                  <div><strong>Issue Date:</strong> {results.creditNote.issueDate}</div>
                  <div><strong>Status:</strong> {results.creditNote.status}</div>
                  <div><strong>Total Credit:</strong> ${results.creditNote.totalCredit}</div>
                  <div><strong>Items Returned:</strong> {results.returnedItems.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Status Check</CardTitle>
                  <CardDescription>
                    Status of each returned item in the inventory system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.inventoryItems.map((item: any, index: number) => (
                      <div key={index}>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(item.status)}
                            <div>
                              <div className="font-semibold">{item.itemName}</div>
                              <div className="text-sm text-muted-foreground">
                                Inventory ID: {item.inventoryId}
                              </div>
                              {item.note && (
                                <div className="text-xs text-blue-600">{item.note}</div>
                              )}
                              {item.error && (
                                <div className="text-xs text-red-600">Error: {item.error}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(item.status)}
                            <div className="text-xs text-muted-foreground">
                              Found: {item.found ? 'Yes' : 'No'}
                            </div>
                          </div>
                        </div>
                        
                        {item.data && (
                          <div className="ml-8 mt-2 p-2 bg-gray-50 rounded text-xs">
                            <strong>Full inventory data:</strong>
                            <pre className="mt-1 whitespace-pre-wrap">
                              {JSON.stringify(item.data, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {index < results.inventoryItems.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Expected Behavior:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>Before Return:</strong> Items should show "IN_HISTORY" (found in inventory history)</li>
                      <li>• <strong>After Return:</strong> Items should show "Available" (restored to inventory)</li>
                      <li>• Custom items will show "CUSTOM_ITEM" (not tracked in inventory)</li>
                      <li>• If items show "NOT_FOUND", the inventoryId might be incorrect or missing from history</li>
                      <li>• The system now restores items from inventory history instead of updating existing items</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}