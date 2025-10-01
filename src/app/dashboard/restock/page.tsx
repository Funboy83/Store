'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Package, DollarSign, Calendar, FileText, Search, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Part, PurchaseOrderItem, Supplier } from '@/lib/types';
import { getParts } from '@/lib/actions/parts';
import { getSuppliers } from '@/lib/actions/suppliers';
import { createPurchaseOrder, commitPurchaseOrderToInventory } from '@/lib/actions/purchase-orders';
import { AddPartModal } from '@/components/parts/add-part-modal';
import { AddSupplierModal } from '@/components/suppliers/add-supplier-modal';

export default function RestockPage() {
  const { toast } = useToast();
  const [parts, setParts] = useState<Part[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);

  // Purchase order state
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);

  // Search state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  
  // Modal state
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter parts based on search term
    if (searchTerm) {
      const filtered = parts.filter(part => 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (part.partNumber && part.partNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (part.brand && part.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (part.model && part.model.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredParts(filtered);
    } else {
      setFilteredParts([]);
    }
  }, [searchTerm, parts]);

  const loadData = async () => {
    try {
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
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierChange = (value: string) => {
    setSelectedSupplier(value);
    const supplier = suppliers.find(s => s.id === value);
    setSupplierName(supplier?.name || '');
  };

  const addPartToOrder = (part: Part) => {
    const existingItem = items.find(item => item.partId === part.id);
    
    if (existingItem) {
      toast({
        title: 'Already Added',
        description: 'Part is already added to this order',
        variant: 'destructive',
      });
      return;
    }

    const newItem: PurchaseOrderItem = {
      partId: part.id,
      partName: part.name,
      partNumber: part.partNumber,
      brand: part.brand,
      model: part.model,
      condition: part.condition,
      customFields: part.customFields,
      quantityReceived: 1,
      costPerItem: part.avgCost || 0, // Default to current average cost or 0 for new parts
      totalCost: part.avgCost || 0
    };

    setItems([...items, newItem]);
    setSearchTerm('');
    toast({
      title: 'Part Added',
      description: `Added ${part.name} to restock order`,
    });
  };

  const handlePartCreated = (newPart: Part) => {
    // Add the newly created part to the parts list
    setParts(prevParts => [...prevParts, newPart]);
    
    // Automatically add it to the restock order
    addPartToOrder(newPart);
  };

  const handleSupplierCreated = (newSupplier: Supplier) => {
    // Add the newly created supplier to the suppliers list
    setSuppliers(prevSuppliers => [...prevSuppliers, newSupplier]);
    
    // Automatically select the new supplier
    setSelectedSupplier(newSupplier.id);
    setSupplierName(''); // Clear manual supplier name since we selected one
    
    toast({
      title: 'Supplier Created',
      description: `${newSupplier.name} has been added and selected`,
    });
  };

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total cost
    if (field === 'quantityReceived' || field === 'costPerItem') {
      updatedItems[index].totalCost = updatedItems[index].quantityReceived * updatedItems[index].costPerItem;
    }
    
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    toast({
      title: 'Item Removed',
      description: 'Item removed from order',
    });
  };

  const calculateOrderTotals = () => {
    const totalItems = items.reduce((sum, item) => sum + item.quantityReceived, 0);
    const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
    return { totalItems, totalCost };
  };

  const handleCommitToInventory = async () => {
    if (items.length === 0) {
      toast({
        title: 'No Items',
        description: 'Please add at least one item to the order',
        variant: 'destructive',
      });
      return;
    }

    if (!supplierName.trim()) {
      toast({
        title: 'Missing Supplier',
        description: 'Please select a supplier or enter supplier name',
        variant: 'destructive',
      });
      return;
    }

    setCommitting(true);

    try {
      // Create the purchase order
      const createResult = await createPurchaseOrder({
        supplierId: selectedSupplier || undefined,
        supplierName: supplierName.trim(),
        purchaseDate,
        referenceNumber: referenceNumber.trim() || undefined,
        items,
        notes: `Restock order created on ${new Date().toLocaleDateString()}`
      });

      if (!createResult.success || !createResult.orderId) {
        throw new Error(createResult.error || 'Failed to create purchase order');
      }

      // Commit to inventory immediately
      const commitResult = await commitPurchaseOrderToInventory(createResult.orderId);

      if (!commitResult.success) {
        throw new Error(commitResult.error || 'Failed to commit to inventory');
      }

      toast({
        title: 'Restock Complete',
        description: `${commitResult.message || 'Successfully restocked inventory!'} (${items.length} items processed)`,
      });

      // Reset form
      setItems([]);
      setSelectedSupplier('');
      setSupplierName('');
      setReferenceNumber('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);

      // Reload parts data to show updated quantities
      await loadData();

    } catch (error) {
      console.error('Error committing to inventory:', error);
      toast({
        title: 'Restock Failed',
        description: `Failed to commit restock to inventory: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        variant: 'destructive',
      });
    } finally {
      setCommitting(false);
    }
  };

  const { totalItems, totalCost } = calculateOrderTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading restock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="h-8 w-8" />
          Restock Inventory
        </h1>
        <p className="text-muted-foreground mt-2">
          Record parts received from suppliers and update inventory with FIFO batch tracking
        </p>
      </div>

      {/* Purchase Record Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Purchase Record Details
          </CardTitle>
          <CardDescription>
            Enter the details about this shipment from your supplier
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Select value={selectedSupplier} onValueChange={handleSupplierChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              {!selectedSupplier && (
                <Input
                  placeholder="Or enter supplier name"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="flex-1"
                />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddSupplierModalOpen(true)}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="referenceNumber">Reference/Invoice # (Optional)</Label>
            <Input
              id="referenceNumber"
              placeholder="Supplier invoice number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>{totalItems} items</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>${totalCost.toFixed(2)} total</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Parts Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Add Parts to Restock Order
              </CardTitle>
              <CardDescription>
                Search for existing parts or create new ones to add to this restock order
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsAddPartModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Part
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parts by name, part number, brand, or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            
            {/* Search Results */}
            {searchTerm && (
              <div className="absolute top-full left-0 right-0 bg-white border border-border rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                {filteredParts.length > 0 ? (
                  filteredParts.map((part) => (
                    <button
                      key={part.id}
                      onClick={() => addPartToOrder(part)}
                      className="w-full p-3 text-left hover:bg-gray-50 border-b border-border last:border-0 focus:bg-gray-50 focus:outline-none"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{part.name}</div>
                          {part.partNumber && (
                            <div className="text-sm text-muted-foreground">PN: {part.partNumber}</div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            {part.brand && part.model ? `${part.brand} ${part.model}` : part.brand || part.model || 'No brand/model'}
                          </div>
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
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {part.totalQuantityInStock} in stock
                          </Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            Avg: ${part.avgCost.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-muted-foreground">
                    No parts found matching &quot;{searchTerm}&quot;
                    <Button 
                      variant="link" 
                      className="ml-2 p-0 h-auto"
                      onClick={() => setIsAddPartModalOpen(true)}
                    >
                      + Create New Part
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      {items.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Restock Items ({items.length})</CardTitle>
            <CardDescription>
              Review and adjust quantities and costs for each part
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.partId} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 cursor-default">{item.partName}</h4>
                    <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
                      {item.partNumber && (
                        <div>PN: {item.partNumber}</div>
                      )}
                      {(item.brand || item.model) && (
                        <div>{[item.brand, item.model].filter(Boolean).join(' ')}</div>
                      )}
                      {item.condition && (
                        <div>Condition: {item.condition}</div>
                      )}
                      {item.customFields && Object.keys(item.customFields).length > 0 && (
                        <div className="space-y-0.5">
                          {Object.entries(item.customFields).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="font-medium">{key}:</span> {value}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-24">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantityReceived}
                      onChange={(e) => updateItem(index, 'quantityReceived', parseInt(e.target.value) || 1)}
                      className="text-center"
                    />
                  </div>

                  <div className="w-28">
                    <Label className="text-xs">Cost Each</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.costPerItem}
                      onChange={(e) => updateItem(index, 'costPerItem', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="w-28">
                    <Label className="text-xs">Total</Label>
                    <div className="p-2 bg-gray-50 rounded text-center font-medium">
                      ${item.totalCost.toFixed(2)}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary & Commit */}
      {items.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Order Summary</h3>
                <p className="text-muted-foreground">
                  {totalItems} total items • ${totalCost.toFixed(2)} total cost
                </p>
              </div>
              <Button 
                size="lg"
                onClick={handleCommitToInventory}
                disabled={committing || items.length === 0}
                className="gap-2"
              >
                {committing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Committing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Commit Stock to Inventory
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <AddPartModal 
        open={isAddPartModalOpen}
        onOpenChange={setIsAddPartModalOpen}
        onPartCreated={handlePartCreated}
      />
      
      <AddSupplierModal 
        open={isAddSupplierModalOpen}
        onOpenChange={setIsAddSupplierModalOpen}
        onSupplierCreated={handleSupplierCreated}
      />
    </div>
  );
}