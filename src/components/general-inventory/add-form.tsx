'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createGeneralItem } from '@/lib/actions/general-inventory';
import { getCategories, getCategoriesWithSubCategories } from '@/lib/actions/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { GeneralItemCondition, Category, CategoryWithSubCategories } from '@/lib/types';
import { GeneralInventoryCustomFieldsEditor } from './custom-fields-editor';
import { SupplierDropdown } from './supplier-dropdown';

const conditionOptions: GeneralItemCondition[] = [
  'New',
  'Refurbished',
  'Used - Excellent',
  'Used - Good',
  'Used - Fair',
  'Damaged'
];

export function AddGeneralItemForm() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryWithSubCategories[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [availableSubCategories, setAvailableSubCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    subCategoryId: '',
    brand: '',
    model: '',
    description: '',
    condition: 'New' as GeneralItemCondition,
    initialQuantity: 1,
    initialCost: 0,
    price: 0,
    minQuantity: 0,
    location: '',
    notes: '',
    supplier: ''
  });

  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  // Fetch categories on component mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const categoriesData = await getCategoriesWithSubCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: 'Error',
          description: 'Failed to load categories',
          variant: 'destructive',
        });
      }
    }

    fetchCategories();
  }, [toast]);

  // Update available subcategories when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
      setAvailableSubCategories(selectedCategory?.subCategories || []);
      // Reset subcategory selection when category changes
      setFormData(prev => ({ ...prev, subCategoryId: '' }));
    } else {
      setAvailableSubCategories([]);
    }
  }, [selectedCategoryId, categories]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'categoryId') {
      setSelectedCategoryId(value as string);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Item name is required',
        variant: 'destructive',
      });
      return;
    }

    if (formData.initialQuantity <= 0) {
      toast({
        title: 'Error',
        description: 'Initial quantity must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create data object with only defined values
      const itemData: any = {
        name: formData.name,
        condition: formData.condition,
        minQuantity: formData.minQuantity,
        price: formData.price,
        customFields: customFields,
        initialQuantity: formData.initialQuantity,
        initialCost: formData.initialCost,
      };

      // Only include optional fields if they have values
      if (formData.sku && formData.sku.trim()) itemData.sku = formData.sku.trim();
      if (formData.categoryId && formData.categoryId.trim()) itemData.categoryId = formData.categoryId.trim();
      if (formData.subCategoryId && formData.subCategoryId.trim()) itemData.subCategoryId = formData.subCategoryId.trim();
      if (formData.brand && formData.brand.trim()) itemData.brand = formData.brand.trim();
      if (formData.model && formData.model.trim()) itemData.model = formData.model.trim();
      if (formData.description && formData.description.trim()) itemData.description = formData.description.trim();
      if (formData.location && formData.location.trim()) itemData.location = formData.location.trim();
      if (formData.notes && formData.notes.trim()) itemData.notes = formData.notes.trim();
      if (formData.supplier && formData.supplier.trim()) itemData.supplier = formData.supplier.trim();

      const result = await createGeneralItem(itemData);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'General item added successfully',
        });
        router.push('/dashboard/general-inventory');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to add general item',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating general item:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add General Inventory Item</CardTitle>
        <CardDescription>
          Add a new item to your general inventory with FIFO tracking
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter item name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="Stock keeping unit"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.categoryId || "no-category"}
                onValueChange={(value) => handleInputChange('categoryId', value === "no-category" ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-category">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select
                value={formData.subCategoryId || "no-subcategory"}
                onValueChange={(value) => handleInputChange('subCategoryId', value === "no-subcategory" ? '' : value)}
                disabled={!selectedCategoryId || availableSubCategories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-subcategory">No Subcategory</SelectItem>
                  {availableSubCategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="Brand name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="Model number/name"
              />
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select
              value={formData.condition}
              onValueChange={(value) => handleInputChange('condition', value as GeneralItemCondition)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditionOptions.map((condition) => (
                  <SelectItem key={condition} value={condition}>
                    {condition}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Inventory Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initialQuantity">Initial Quantity *</Label>
              <Input
                id="initialQuantity"
                type="number"
                min="1"
                value={formData.initialQuantity}
                onChange={(e) => handleInputChange('initialQuantity', parseInt(e.target.value) || 0)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="initialCost">Cost Per Unit</Label>
              <Input
                id="initialCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.initialCost}
                onChange={(e) => handleInputChange('initialCost', parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Selling Price</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minQuantity">Minimum Stock Alert</Label>
              <Input
                id="minQuantity"
                type="number"
                min="0"
                value={formData.minQuantity}
                onChange={(e) => handleInputChange('minQuantity', parseInt(e.target.value) || 0)}
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

          <SupplierDropdown
            value={formData.supplier}
            onValueChange={(value) => handleInputChange('supplier', value)}
            placeholder="Select supplier or add new..."
          />

          {/* Description and Notes */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Item description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes"
              rows={2}
            />
          </div>

          {/* Custom Fields */}
          <GeneralInventoryCustomFieldsEditor
            customFields={customFields}
            onChange={setCustomFields}
          />
        </CardContent>
        
        <CardFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Item'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}