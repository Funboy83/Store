import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Package, AlertTriangle } from 'lucide-react';
import { getPart } from '@/lib/actions/parts';
import { CustomFieldsDisplay } from '@/components/inventory/custom-fields-display';

interface PartDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PartDetailPage({ params }: PartDetailPageProps) {
  const { id } = await params;
  const result = await getPart(id);

  if (!result.success || !result.part) {
    notFound();
  }

  const part = result.part;
  const isLowStock = part.quantity <= part.minQuantity;
  const isOutOfStock = part.quantity === 0;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/parts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{part.name}</h1>
            <p className="text-muted-foreground">Part details and inventory information</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/parts/${id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Part
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Part Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="font-medium">{part.name}</p>
                </div>
                


                {part.partNumber && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Part Number</label>
                    <p className="font-mono text-sm">{part.partNumber}</p>
                  </div>
                )}

                {part.brand && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Brand</label>
                    <p>{part.brand}</p>
                  </div>
                )}



                <div>
                  <label className="text-sm font-medium text-muted-foreground">Condition</label>
                  <div className="mt-1">
                    <Badge variant={getConditionColor(part.condition) as "default" | "destructive" | "outline" | "secondary"}>
                      {part.condition}
                    </Badge>
                  </div>
                </div>

                {part.supplier && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Supplier</label>
                    <p>{part.supplier}</p>
                  </div>
                )}

                {part.location && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Storage Location</label>
                    <p>{part.location}</p>
                  </div>
                )}
              </div>

              {part.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="mt-1 text-sm">{part.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <CustomFieldsDisplay 
            customFields={part.customFields} 
          />
        </div>

        {/* Inventory & Pricing */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Inventory Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Stock Level</span>
                <div className="flex items-center space-x-2">
                  {isOutOfStock && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  {isLowStock && !isOutOfStock && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className={`font-bold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-green-600'}`}>
                    {part.quantity}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Min. Quantity</span>
                <span className="text-muted-foreground">{part.minQuantity}</span>
              </div>

              {isOutOfStock && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Out of Stock</p>
                      <p className="text-xs text-red-600">This part is currently out of stock</p>
                    </div>
                  </div>
                </div>
              )}

              {isLowStock && !isOutOfStock && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Low Stock Warning</p>
                      <p className="text-xs text-amber-600">Stock is below minimum level</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Unit Cost</span>
                <span className="font-mono">${part.cost.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selling Price</span>
                <span className="font-mono font-bold">${part.price.toFixed(2)}</span>
              </div>

              {part.cost > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Markup</span>
                  <span className="text-green-600 font-medium">
                    {((part.price - part.cost) / part.cost * 100).toFixed(1)}%
                  </span>
                </div>
              )}

              <hr />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Value</span>
                <span className="font-mono font-bold">
                  ${(part.quantity * part.cost).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}