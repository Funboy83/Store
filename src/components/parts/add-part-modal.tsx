'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createPart } from '@/lib/actions/parts';
import { PartCondition, Part } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const PART_CONDITIONS: PartCondition[] = [
  'New', 'Refurbished', 'Used - Excellent', 'Used - Good', 'Used - Fair'
];

interface AddPartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPartCreated: (part: Part) => void;
}

export function AddPartModal({ open, onOpenChange, onPartCreated }: AddPartModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    partNumber: '',
    brand: '',
    model: '',
    condition: '' as PartCondition | '',
    minQuantity: 5,
    price: 0,
    location: '',
    notes: '',
    customFields: {} as Record<string, string>,
  });
  
  const [newCustomField, setNewCustomField] = useState({ key: '', value: '' });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addCustomField = () => {
    if (newCustomField.key && newCustomField.value) {
      setFormData(prev => ({
        ...prev,
        customFields: {
          ...prev.customFields,
          [newCustomField.key]: newCustomField.value
        }
      }));
      setNewCustomField({ key: '', value: '' });
    }
  };

  const removeCustomField = (key: string) => {
    setFormData(prev => {
      const newCustomFields = { ...prev.customFields };
      delete newCustomFields[key];
      return {
        ...prev,
        customFields: newCustomFields
      };
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      partNumber: '',
      brand: '',
      model: '',
      condition: '' as PartCondition | '',
      minQuantity: 5,
      price: 0,
      location: '',
      notes: '',
      customFields: {},
    });
    setNewCustomField({ key: '', value: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.condition) {
      toast({
        title: "Validation Error",
        description: "Please fill in part name and condition.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await createPart({
        name: formData.name,
        partNumber: formData.partNumber || undefined,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        condition: formData.condition as PartCondition,
        minQuantity: formData.minQuantity,
        price: formData.price,
        initialQuantity: 0, // New parts start with 0 stock
        initialCost: 0, // No cost until first restock
        location: formData.location || undefined,
        notes: formData.notes || undefined,
        customFields: Object.keys(formData.customFields).length > 0 ? formData.customFields : undefined,
      });

      if (result.success && result.partId) {
        // Create a Part object to pass back
        const newPart: Part = {
          id: result.partId,
          name: formData.name,
          partNumber: formData.partNumber || undefined,
          brand: formData.brand || undefined,
          model: formData.model || undefined,
          compatibility: [],
          condition: formData.condition as PartCondition,
          batches: [],
          totalQuantityInStock: 0,
          minQuantity: formData.minQuantity,
          avgCost: 0,
          price: formData.price,
          location: formData.location || undefined,
          notes: formData.notes || undefined,
          customFields: Object.keys(formData.customFields).length > 0 ? formData.customFields : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        onPartCreated(newPart);
        resetForm();
        onOpenChange(false);

        toast({
          title: "Part Created",
          description: `${formData.name} has been created and added to your restock order.`,
        });
      } else {
        throw new Error(result.error || 'Failed to create part');
      }
    } catch (error) {
      console.error('Error creating part:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create part.',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Part</DialogTitle>
          <DialogDescription>
            Add a new part to your inventory. Stock will be added through the restock process.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Part Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., iPhone 14 LCD Screen"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partNumber">Part Number</Label>
              <Input
                id="partNumber"
                value={formData.partNumber}
                onChange={(e) => handleInputChange('partNumber', e.target.value)}
                placeholder="e.g., IP14-LCD-BLK"
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
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="e.g., iPhone 14, Galaxy S23"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition *</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => handleInputChange('condition', value as PartCondition)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {PART_CONDITIONS.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Shelf A1, Drawer 3"
              />
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="space-y-3">
            <Label>Custom Fields</Label>
            
            {/* Existing Custom Fields */}
            {Object.entries(formData.customFields).length > 0 && (
              <div className="space-y-2">
                {Object.entries(formData.customFields).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="font-medium text-sm">{key}:</span>
                    <span className="text-sm flex-1">{value}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomField(key)}
                      disabled={loading}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add New Custom Field */}
            <div className="flex gap-2">
              <Input
                placeholder="Field name"
                value={newCustomField.key}
                onChange={(e) => setNewCustomField(prev => ({ ...prev, key: e.target.value }))}
                disabled={loading}
                className="flex-1"
              />
              <Input
                placeholder="Field value"
                value={newCustomField.value}
                onChange={(e) => setNewCustomField(prev => ({ ...prev, value: e.target.value }))}
                disabled={loading}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomField}
                disabled={loading || !newCustomField.key || !newCustomField.value}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this part..."
              rows={3}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> This part will be created with zero stock. Use the restock form below to add initial inventory and cost.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.name || !formData.condition}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Part'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}