'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Package, Minus } from 'lucide-react';
import { Part, UsedPart } from '@/lib/types';
import { getParts } from '@/lib/actions/parts';
import { useToast } from '@/hooks/use-toast';

interface PartsSelectorProps {
  selectedParts: UsedPart[];
  onPartsChange: (parts: UsedPart[]) => void;
}

export function PartsSelector({ selectedParts, onPartsChange }: PartsSelectorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadParts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = parts.filter(part =>
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (part.partNumber && part.partNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (part.brand && part.brand.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredParts(filtered);
    } else {
      setFilteredParts(parts);
    }
  }, [searchTerm, parts]);

  const loadParts = async () => {
    setLoading(true);
    try {
      const partsData = await getParts();
      // Filter to only show parts with available stock
      const availableParts = partsData.filter(part => part.totalQuantityInStock > 0);
      setParts(availableParts);
      setFilteredParts(availableParts);
    } catch (error) {
      console.error('Error loading parts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load parts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPart = (part: Part) => {
    // Check if part is already selected
    const existingPart = selectedParts.find(p => p.partId === part.id);
    
    if (existingPart) {
      // Increase quantity
      const updatedParts = selectedParts.map(p => 
        p.partId === part.id 
          ? { ...p, quantity: p.quantity + 1, total: (p.quantity + 1) * p.price }
          : p
      );
      onPartsChange(updatedParts);
    } else {
      // Add new part
      const newUsedPart: UsedPart = {
        partId: part.id,
        partName: part.name,
        quantity: 1,
        cost: part.avgCost,
        price: part.avgCost * 1.3, // 30% markup as default
        total: part.avgCost * 1.3,
      };
      onPartsChange([...selectedParts, newUsedPart]);
    }

    toast({
      title: 'Part Added',
      description: `${part.name} added to job`,
    });
  };

  const handleRemovePart = (partId: string) => {
    const updatedParts = selectedParts.filter(p => p.partId !== partId);
    onPartsChange(updatedParts);
  };

  const handleQuantityChange = (partId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemovePart(partId);
      return;
    }

    const updatedParts = selectedParts.map(p => 
      p.partId === partId 
        ? { ...p, quantity, total: quantity * p.price }
        : p
    );
    onPartsChange(updatedParts);
  };

  const handlePriceChange = (partId: string, price: number) => {
    const updatedParts = selectedParts.map(p => 
      p.partId === partId 
        ? { ...p, price, total: p.quantity * price }
        : p
    );
    onPartsChange(updatedParts);
  };

  return (
    <div className="space-y-4">
      {/* Selected Parts Display */}
      {selectedParts.length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Selected Parts ({selectedParts.length})</h4>
          <div className="space-y-2">
            {selectedParts.map((part) => (
              <div key={part.partId} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                <div className="flex-1">
                  <div className="font-medium">{part.partName}</div>
                  <div className="text-sm text-muted-foreground">
                    Cost: ${part.cost.toFixed(2)} | Price: ${part.price.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Qty:</Label>
                  <Input
                    type="number"
                    min="1"
                    value={part.quantity}
                    onChange={(e) => handleQuantityChange(part.partId, parseInt(e.target.value) || 1)}
                    className="w-16"
                  />
                  <Label className="text-xs">Price:</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={part.price}
                    onChange={(e) => handlePriceChange(part.partId, parseFloat(e.target.value) || 0)}
                    className="w-20"
                  />
                  <div className="font-medium min-w-16 text-right">
                    ${part.total.toFixed(2)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePart(part.partId)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="text-right font-bold">
              Total Parts: ${selectedParts.reduce((sum, part) => sum + part.total, 0).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Add Parts Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Package className="mr-2 h-4 w-4" />
            Add Parts from Inventory
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Select Parts
            </DialogTitle>
            <DialogDescription>
              Choose parts from inventory to add to this job
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parts by name, part number, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Parts Table */}
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading parts...</p>
                  </div>
                </div>
              ) : filteredParts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? `No parts found matching "${searchTerm}"` : 'No parts available'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Avg Cost</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{part.name}</div>
                            {part.partNumber && (
                              <div className="text-sm text-muted-foreground">PN: {part.partNumber}</div>
                            )}
                            {(part.brand || part.model) && (
                              <div className="text-sm text-muted-foreground">
                                {[part.brand, part.model].filter(Boolean).join(' ')}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {part.totalQuantityInStock} available
                          </Badge>
                        </TableCell>
                        <TableCell>
                          ${part.avgCost.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleAddPart(part)}
                            disabled={selectedParts.some(p => p.partId === part.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            {selectedParts.some(p => p.partId === part.id) ? 'Added' : 'Add'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}