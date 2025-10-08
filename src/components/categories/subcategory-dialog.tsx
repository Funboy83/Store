'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CategoryWithSubCategories, SubCategory } from '@/lib/types';

interface SubCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryWithSubCategories[];
  categoryId?: string;
  subCategory?: SubCategory;
  onSave: (categoryId: string, name: string, description?: string) => void;
}

export function SubCategoryDialog({ 
  open, 
  onOpenChange, 
  categories, 
  categoryId, 
  subCategory, 
  onSave 
}: SubCategoryDialogProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens/closes or data changes
  useEffect(() => {
    if (open) {
      setSelectedCategoryId(subCategory?.categoryId || categoryId || '');
      setName(subCategory?.name || '');
      setDescription(subCategory?.description || '');
    } else {
      setSelectedCategoryId('');
      setName('');
      setDescription('');
    }
  }, [open, categoryId, subCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedCategoryId) return;

    setLoading(true);
    try {
      await onSave(selectedCategoryId, name.trim(), description.trim() || undefined);
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!subCategory;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Sub-Category' : 'Create New Sub-Category'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the sub-category information below.'
              : 'Create a new sub-category within an existing category.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="parent-category">Parent Category *</Label>
            <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
              disabled={!!categoryId && !isEditing} // Lock category if provided and not editing
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subcategory-name">Sub-Category Name *</Label>
            <Input
              id="subcategory-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Screens, Batteries, Chargers"
              maxLength={50}
              required
            />
          </div>

          <div>
            <Label htmlFor="subcategory-description">Description (Optional)</Label>
            <Textarea
              id="subcategory-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this sub-category..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || !selectedCategoryId}>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                </div>
              ) : (
                isEditing ? 'Update Sub-Category' : 'Create Sub-Category'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}