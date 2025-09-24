'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getInventoryStats } from '@/lib/inventory-integration';
import { Package, Smartphone, Database } from 'lucide-react';

export function InventoryStatsCard() {
  const stats = getInventoryStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Inventory Integration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalDevices}</div>
            <div className="text-sm text-muted-foreground">Total Devices</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.availableDevices}</div>
            <div className="text-sm text-muted-foreground">Available</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Brands in Stock:</div>
          <div className="flex flex-wrap gap-1">
            {stats.brandStats.slice(0, 6).map((brand) => (
              <Badge key={brand.brand} variant="outline" className="text-xs">
                {brand.brand} ({brand.count})
              </Badge>
            ))}
            {stats.brandStats.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{stats.brandStats.length - 6} more
              </Badge>
            )}
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center text-xs text-muted-foreground">
            <Smartphone className="h-3 w-3 mr-1" />
            <span>Auto-populate from inventory lookup</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}