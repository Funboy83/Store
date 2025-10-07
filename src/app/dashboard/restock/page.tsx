'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddPartModal } from '@/components/parts/add-part-modal';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, DollarSign, Calendar, FileText, Search, Trash2, Loader2, Info, ShoppingCart } from 'lucide-react';
import { Part, Supplier, PurchaseOrderItem } from '@/lib/types';
import { getParts } from '@/lib/actions/parts';
import { getSuppliers } from '@/lib/actions/suppliers';
import { createPurchaseOrder as createPO } from '@/lib/actions/purchase-orders';

// Local type for restock items (different from PurchaseOrderItem)
type RestockItem = {
  partId: string;
  partName: string;
  quantity: number;
  costPerItem: number;
  totalCost: number;
};

export default function RestockPage() {
  const { toast } = useToast();
  
  // State management
  const [parts, setParts] = useState<Part[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [items, setItems] = useState<RestockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  
  // Add Part Modal State
  const [showNewPartModal, setShowNewPartModal] = useState<boolean>(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Filter parts based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = parts.filter(part => 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (part.category && part.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredParts(filtered);
    } else {
      setFilteredParts(parts);
    }
  }, [searchTerm, parts]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load actual parts and suppliers from the database
      const [partsData, suppliersData] = await Promise.all([
        getParts(),
        getSuppliers()
      ]);

      setParts(partsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load parts and suppliers.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addItemToPurchaseOrder = (part: Part) => {
    const existingItem = items.find(item => item.partId === part.id);
    
    if (existingItem) {
      // Update quantity if item already exists
      setItems(prev => prev.map(item => 
        item.partId === part.id 
          ? { ...item, quantity: item.quantity + 1, totalCost: (item.quantity + 1) * item.costPerItem }
          : item
      ));
    } else {
      // Add new item
      const newItem: RestockItem = {
        partId: part.id,
        partName: part.name,
        quantity: 1,
        costPerItem: part.avgCost, // Use average cost as default
        totalCost: part.avgCost
      };
      setItems(prev => [...prev, newItem]);
    }

    toast({
      title: 'Item Added',
      description: `${part.name} added to purchase order.`
    });
  };

  const removeItemFromPurchaseOrder = (partId: string) => {
    setItems(prev => prev.filter(item => item.partId !== partId));
  };

  const updateItemQuantity = (partId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromPurchaseOrder(partId);
      return;
    }

    setItems(prev => prev.map(item => 
      item.partId === partId 
        ? { ...item, quantity, totalCost: quantity * item.costPerItem }
        : item
    ));
  };

  const updateItemCost = (partId: string, costPerItem: number) => {
    setItems(prev => prev.map(item => 
      item.partId === partId 
        ? { ...item, costPerItem, totalCost: item.quantity * costPerItem }
        : item
    ));
  };

  const getTotalCost = () => {
    return items.reduce((total, item) => total + item.totalCost, 0);
  };

  const createPurchaseOrder = async () => {
    if (!selectedSupplier || items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a supplier and add items to the purchase order.',
        variant: 'destructive'
      });
      return;
    }

    setCreating(true);
    
    try {
      // Convert RestockItems to PurchaseOrderItems
      const purchaseOrderItems: PurchaseOrderItem[] = items.map(item => ({
        partId: item.partId,
        partName: item.partName,
        quantityReceived: item.quantity,
        costPerItem: item.costPerItem,
        totalCost: item.totalCost
      }));

      // Find supplier name
      const supplier = suppliers.find(s => s.id === selectedSupplier);
      
      const result = await createPO({
        supplierId: selectedSupplier,
        supplierName: supplier?.name || '',
        purchaseDate: new Date().toISOString(),
        referenceNumber: referenceNumber || undefined,
        items: purchaseOrderItems,
        notes: `Restock order created from dashboard`
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `Purchase order created with ${items.length} items for $${getTotalCost().toFixed(2)}.`
        });

        // Reset form
        setItems([]);
        setReferenceNumber('');
        setSelectedSupplier('');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create purchase order.',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const handlePartCreated = (part: Part) => {
    // Reload parts to include the new part
    loadData();
    
    // Automatically add the new part to the purchase order
    addItemToPurchaseOrder(part);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restock Inventory</h1>
          <p className="text-muted-foreground">
            Create purchase orders and manage inventory restocking
          </p>
        </div>
        <Button onClick={createPurchaseOrder} disabled={items.length === 0 || creating}>
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Purchase Order
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Available Parts */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Available Parts
                  </CardTitle>
                  <CardDescription>
                    Search and add parts that need restocking
                  </CardDescription>
                </div>
                <Button 
                  size="sm"
                  onClick={() => setShowNewPartModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Part
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search parts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Parts List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading parts...</span>
                  </div>
                ) : filteredParts.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    {searchTerm ? 'No parts found matching your search.' : 'No parts available.'}
                  </div>
                ) : (
                  filteredParts.map(part => (
                  <div key={part.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-lg">{part.name}</div>
                          {part.totalQuantityInStock <= part.minQuantity && (
                            <Badge variant="destructive" className="text-xs">
                              Low Stock
                            </Badge>
                          )}
                          {part.batches.length > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              {part.batches.length} batches
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Part #:</span>
                            <span className="ml-1">{part.partNumber || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Category:</span>
                            <span className="ml-1">{part.category || 'General'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Brand:</span>
                            <span className="ml-1">{part.brand || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Model:</span>
                            <span className="ml-1">{part.model || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Condition:</span>
                            <span className="ml-1">{part.condition}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Location:</span>
                            <span className="ml-1">{part.location || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className={`font-medium ${part.totalQuantityInStock <= part.minQuantity ? 'text-red-600' : ''}`}>
                              {part.totalQuantityInStock}
                            </span>
                            <span className="text-muted-foreground">
                              / {part.minQuantity} min
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-green-600">
                              ${part.avgCost.toFixed(2)} avg
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              ${part.price.toFixed(2)} sell
                            </span>
                          </div>
                        </div>

                        {part.notes && (
                          <div className="text-sm text-muted-foreground bg-muted/30 rounded p-2">
                            <Info className="h-3 w-3 inline mr-1" />
                            {part.notes}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => addItemToPurchaseOrder(part)}
                        className="ml-4"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Purchase Order */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Purchase Order
              </CardTitle>
              <CardDescription>
                Configure your purchase order details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Supplier Selection */}
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reference Number */}
              <div className="space-y-2">
                <Label>Reference Number (Optional)</Label>
                <Input
                  placeholder="PO-2024-001"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <Label>Items ({items.length})</Label>
                <div className="border rounded-lg">
                  {items.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No items added to purchase order
                    </div>
                  ) : (
                    <div className="divide-y">
                      {items.map(item => (
                        <div key={item.partId} className="p-3 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{item.partName}</div>
                            <div className="text-sm text-muted-foreground">
                              ${item.costPerItem.toFixed(2)} each
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs">Qty</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.partId, parseInt(e.target.value) || 0)}
                                className="w-20"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs">Cost</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.costPerItem}
                                onChange={(e) => updateItemCost(item.partId, parseFloat(e.target.value) || 0)}
                                className="w-24"
                              />
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              <Label className="text-xs">Total</Label>
                              <div className="font-medium min-w-20 text-right">
                                ${item.totalCost.toFixed(2)}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeItemFromPurchaseOrder(item.partId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Total */}
                      <div className="p-3 bg-muted/50 font-medium flex justify-between">
                        <span>Total</span>
                        <span>${getTotalCost().toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            After creating your purchase order, you can manage it through the purchase orders section and commit it to inventory when items are received.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/suppliers'}>
              Manage Suppliers
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/parts'}>
              View All Parts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Part Modal */}
      <AddPartModal
        open={showNewPartModal}
        onOpenChange={setShowNewPartModal}
        onPartCreated={handlePartCreated}
      />
    </div>
  );
}