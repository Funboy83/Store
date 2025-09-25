'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Part } from '@/lib/types';
import { Eye, Edit, Trash2, AlertTriangle, Package } from 'lucide-react';
import Link from 'next/link';

interface PartsTableProps {
  parts: Part[];
}

const getConditionColor = (condition: string) => {
  const colors: Record<string, string> = {
    'New': 'default',
    'Refurbished': 'secondary',
    'Used - Excellent': 'outline',
    'Used - Good': 'outline',
    'Used - Fair': 'destructive'
  };
  return colors[condition] || 'outline';
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Screen': 'default',
    'Battery': 'secondary',
    'Camera': 'outline',
    'Speaker': 'destructive',
    'Microphone': 'secondary',
    'Charging Port': 'default',
  };
  return colors[category] || 'outline';
};

export function PartsTable({ parts }: PartsTableProps) {
  if (parts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No parts found in inventory</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/dashboard/parts/new">
                Add your first part
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parts Inventory ({parts.length} parts)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand/Model</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parts.map((part) => {
              const isLowStock = part.totalQuantityInStock <= part.minQuantity;
              const isOutOfStock = part.totalQuantityInStock === 0;
              
              return (
                <TableRow key={part.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <div className="font-medium">{part.name}</div>
                        {part.partNumber && (
                          <div className="text-sm text-muted-foreground">
                            PN: {part.partNumber}
                          </div>
                        )}
                        {part.customFields && Object.keys(part.customFields).length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {Object.entries(part.customFields).map(([key, value]) => (
                              <div key={key} className="text-xs text-muted-foreground">
                                <span className="font-medium">{key}:</span> {value}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {isOutOfStock && (
                          <Badge variant="destructive" className="text-xs">
                            Out of Stock
                          </Badge>
                        )}
                        {isLowStock && !isOutOfStock && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {part.category ? (
                      <Badge variant={getCategoryColor(part.category) as "default" | "destructive" | "outline" | "secondary"}>
                        {part.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">No category</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      {part.brand && <div className="font-medium">{part.brand}</div>}
                      {part.model && (
                        <div className="text-sm text-muted-foreground">{part.model}</div>
                      )}
                      {!part.brand && !part.model && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getConditionColor(part.condition) as "default" | "destructive" | "outline" | "secondary"}>
                      {part.condition}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span className={isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : ''}>
                        {part.totalQuantityInStock}
                      </span>
                      {part.minQuantity > 0 && (
                        <span className="text-muted-foreground text-sm">
                          / {part.minQuantity} min
                        </span>
                      )}
                      {part.batches.length > 1 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                          {part.batches.length} batches
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">${part.avgCost.toFixed(2)}</span>
                      <div className="text-xs text-muted-foreground">avg cost</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">${part.price}</span>
                      {part.price > part.avgCost && (
                        <div className="text-xs text-green-600">
                          +${(part.price - part.avgCost).toFixed(2)} margin
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/parts/${part.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/parts/${part.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}