'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createPart } from '@/lib/actions/parts';
import { getSuppliers } from '@/lib/actions/suppliers';
import { getBrandOptions, addBrandOption } from '@/lib/actions/options';
import { PartCondition, Supplier } from '@/lib/types';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { AddSupplierForm } from '@/components/suppliers/add-supplier-form';
import { CustomFieldsEditor } from '@/components/inventory/custom-fields-editor';
import { AddableCombobox } from '@/components/inventory/addable-combobox';

const PART_CONDITIONS: PartCondition[] = [
  'New', 'Refurbished', 'Used - Excellent', 'Used - Good', 'Used - Fair'
];

export default function AddPartPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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

  // Load suppliers on component mount
  useEffect(() => {
    const loadSuppliers = async () => {
      const supplierList = await getSuppliers();
      setSuppliers(supplierList);
    };
    loadSuppliers();
  }, []);

  // Refresh suppliers when add supplier form closes
  useEffect(() => {
    if (!isAddSupplierOpen) {
      const loadSuppliers = async () => {
        const supplierList = await getSuppliers();
        setSuppliers(supplierList);
      };
      loadSuppliers();
    }
  }, [isAddSupplierOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.condition) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      await createPart({
        name: formData.name,
        partNumber: formData.partNumber || undefined,
        brand: formData.brand && formData.brand !== 'none' ? formData.brand : undefined,
        condition: formData.condition as PartCondition,
        quantity: formData.quantity,
        minQuantity: formData.minQuantity,
        cost: formData.cost,
        price: formData.price,
        supplier: formData.supplier && formData.supplier !== 'none' ? formData.supplier : undefined,
        location: formData.location || undefined,
        notes: formData.notes || undefined,
        customFields: Object.keys(formData.customFields).length > 0 ? formData.customFields : undefined
      });

      toast({
        title: "Success",
        description: "Part added to inventory successfully."
      });

      router.push('/dashboard/parts');
    } catch (error) {
      console.error('Error creating part:', error);
      toast({
        title: "Error",
        description: "Failed to add part to inventory.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/parts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New Part</h1>
          <p className="text-muted-foreground">Add a new part to your inventory</p>
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
                <AddableCombobox
                  formControlName="brand"
                  label="Brand"
                  fetchOptions={getBrandOptions}
                  addOption={addBrandOption}
                  onChange={(value) => handleInputChange('brand', value)}
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
                <div className="flex gap-2">
                  <Select
                    value={formData.supplier}
                    onValueChange={(value) => handleInputChange('supplier', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No supplier</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.name}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAddSupplierOpen(true)}
                    title="Add new supplier"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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

            <CustomFieldsEditor
              customFields={formData.customFields}
              onChange={(customFields) => handleInputChange('customFields', customFields)}
            />

            <div className="flex justify-end space-x-4 pt-4">
              <Button variant="outline" type="button" asChild>
                <Link href="/dashboard/parts">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Part'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AddSupplierForm
        open={isAddSupplierOpen}
        onOpenChange={setIsAddSupplierOpen}
      />
    </div>
  );
}