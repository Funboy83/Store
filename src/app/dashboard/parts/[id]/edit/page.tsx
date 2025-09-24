'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { getPart, updatePart } from '@/lib/actions/parts';
import { getSuppliers } from '@/lib/actions/suppliers';
import { PartCondition, Part, Supplier } from '@/lib/types';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { CustomFieldsEditor } from '@/components/inventory/custom-fields-editor';
import { AddSupplierForm } from '@/components/suppliers/add-supplier-form';

const PART_CONDITIONS: PartCondition[] = [
  'New', 'Refurbished', 'Used - Excellent', 'Used - Good', 'Used - Fair'
];

interface EditPartPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPartPage({ params }: EditPartPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [part, setPart] = useState<Part | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    partNumber: '',
    brand: '',
    condition: '' as PartCondition | '',
    quantity: 0,
    minQuantity: 5,
    cost: 0,
    price: 0,
    supplier: '',
    location: '',
    notes: '',
    customFields: {} as Record<string, string>
  });

  useEffect(() => {
    const loadPart = async () => {
      const { id } = await params;
      const result = await getPart(id);
      
      if (!result.success || !result.part) {
        notFound();
        return;
      }

      const partData = result.part;
      setPart(partData);
      setFormData({
        name: partData.name,
        partNumber: partData.partNumber || '',
        brand: partData.brand || '',
        condition: partData.condition,
        quantity: partData.quantity,
        minQuantity: partData.minQuantity,
        cost: partData.cost,
        price: partData.price,
        supplier: partData.supplier || '',
        location: partData.location || '',
        notes: partData.notes || '',
        customFields: partData.customFields || {}
      });
      setInitialLoading(false);
    };

    loadPart();
  }, [params]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Removed compatibility functions since compatibility field was removed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!part || !formData.name || !formData.condition) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await updatePart(part.id, {
        name: formData.name,
        partNumber: formData.partNumber || undefined,
        brand: formData.brand || undefined,
        condition: formData.condition as PartCondition,
        quantity: formData.quantity,
        minQuantity: formData.minQuantity,
        cost: formData.cost,
        price: formData.price,
        supplier: formData.supplier || undefined,
        location: formData.location || undefined,
        notes: formData.notes || undefined
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Part updated successfully."
        });
        router.push(`/dashboard/parts/${part.id}`);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update part.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating part:', error);
      toast({
        title: "Error",
        description: "Failed to update part.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/parts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Loading...</h1>
            <p className="text-muted-foreground">Loading part information</p>
          </div>
        </div>
      </div>
    );
  }

  if (!part) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/dashboard/parts/${part.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Part</h1>
          <p className="text-muted-foreground">Edit {part.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Part Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Part Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., LCD Screen Assembly"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partNumber">Part Number</Label>
                <Input
                  id="partNumber"
                  value={formData.partNumber}
                  onChange={(e) => handleInputChange('partNumber', e.target.value)}
                  placeholder="Manufacturer part number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="e.g., Apple, Samsung"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => handleInputChange('condition', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {PART_CONDITIONS.map(condition => (
                      <SelectItem key={condition} value={condition}>
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity in Stock</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minQuantity">Minimum Stock Level</Label>
                <Input
                  id="minQuantity"
                  type="number"
                  min="0"
                  value={formData.minQuantity}
                  onChange={(e) => handleInputChange('minQuantity', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Unit Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Selling Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  placeholder="Supplier name or company"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Storage Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Shelf, bin, or location code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Description</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes or specifications"
                rows={3}
              />
            </div>

            {/* Custom Fields Editor */}
            <CustomFieldsEditor
              customFields={formData.customFields}
              onChange={(customFields) => handleInputChange('customFields', customFields)}
            />

            <div className="flex justify-end space-x-4 pt-4">
              <Button variant="outline" type="button" asChild>
                <Link href={`/dashboard/parts/${part.id}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Part'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}