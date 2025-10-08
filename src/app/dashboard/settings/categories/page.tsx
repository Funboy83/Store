'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderOpen, Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  getCategoriesWithSubCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from '@/lib/actions/categories';
// @ts-ignore
import { CategoryDialog } from '@/components/categories/category-dialog';
// @ts-ignore
import { SubCategoryDialog } from '@/components/categories/subcategory-dialog';
// @ts-ignore
import { DeleteDialog } from '@/components/categories/delete-dialog';
import type { CategoryWithSubCategories, Category, SubCategory } from '@/lib/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithSubCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean;
    category?: Category;
  }>({ open: false });
  const [subCategoryDialog, setSubCategoryDialog] = useState<{
    open: boolean;
    categoryId?: string;
    subCategory?: SubCategory;
  }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type?: 'category' | 'subcategory';
    item?: Category | SubCategory;
  }>({ open: false });
  
  const { toast } = useToast();

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategoriesWithSubCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCreateCategory = async (name: string, description?: string) => {
    const result = await createCategory({ name, description });
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Category created successfully',
      });
      setCategoryDialog({ open: false });
      loadCategories();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateCategory = async (id: string, name: string, description?: string) => {
    const result = await updateCategory(id, { name, description });
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Category updated successfully',
      });
      setCategoryDialog({ open: false });
      loadCategories();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const result = await deleteCategory(id);
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
      setDeleteDialog({ open: false });
      loadCategories();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleCreateSubCategory = async (categoryId: string, name: string, description?: string) => {
    const result = await createSubCategory({ categoryId, name, description });
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Sub-category created successfully',
      });
      setSubCategoryDialog({ open: false });
      loadCategories();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSubCategory = async (id: string, categoryId: string, name: string, description?: string) => {
    const result = await updateSubCategory(id, { categoryId, name, description });
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Sub-category updated successfully',
      });
      setSubCategoryDialog({ open: false });
      loadCategories();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSubCategory = async (id: string) => {
    const result = await deleteSubCategory(id);
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Sub-category deleted successfully',
      });
      setDeleteDialog({ open: false });
      loadCategories();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Categories</h1>
          <p className="text-muted-foreground mt-2">
            Organize your inventory with categories and sub-categories
          </p>
        </div>
        <Button 
          onClick={() => setCategoryDialog({ open: true })}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Category Tree
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">
                Start organizing your inventory by creating your first category
              </p>
              <Button 
                onClick={() => setCategoryDialog({ open: true })}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create First Category
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="border rounded-lg">
                  <div className="flex items-center justify-between p-4 hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(category.id)}
                        className="h-6 w-6 p-0"
                      >
                        {expandedCategories.has(category.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <Folder className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {category.subCategories.length} sub-categories
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSubCategoryDialog({ open: true, categoryId: category.id })}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Sub-Category
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCategoryDialog({ open: true, category })}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, type: 'category', item: category })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {expandedCategories.has(category.id) && category.subCategories.length > 0 && (
                    <div className="pl-12 pr-4 pb-4 space-y-2">
                      {category.subCategories.map((subCategory) => (
                        <div key={subCategory.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center gap-3">
                            <div className="w-6" /> {/* Spacer for alignment */}
                            <div className="h-4 w-4 rounded-sm bg-muted-foreground/20" />
                            <div>
                              <h4 className="font-medium text-sm">{subCategory.name}</h4>
                              {subCategory.description && (
                                <p className="text-xs text-muted-foreground">{subCategory.description}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSubCategoryDialog({ 
                                open: true, 
                                categoryId: category.id,
                                subCategory 
                              })}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteDialog({ 
                                open: true, 
                                type: 'subcategory', 
                                item: subCategory 
                              })}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <CategoryDialog
        open={categoryDialog.open}
        onOpenChange={(open: boolean) => setCategoryDialog({ open })}
        category={categoryDialog.category}
        onSave={categoryDialog.category ? 
          (name: string, description?: string) => handleUpdateCategory(categoryDialog.category!.id, name, description) :
          handleCreateCategory
        }
      />

      {/* Sub-Category Dialog */}
      <SubCategoryDialog
        open={subCategoryDialog.open}
        onOpenChange={(open: boolean) => setSubCategoryDialog({ open })}
        categories={categories}
        categoryId={subCategoryDialog.categoryId}
        subCategory={subCategoryDialog.subCategory}
        onSave={subCategoryDialog.subCategory ?
          (categoryId: string, name: string, description?: string) => handleUpdateSubCategory(subCategoryDialog.subCategory!.id, categoryId, name, description) :
          handleCreateSubCategory
        }
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open: boolean) => setDeleteDialog({ open })}
        type={deleteDialog.type}
        item={deleteDialog.item}
        onConfirm={deleteDialog.type === 'category' ?
          () => handleDeleteCategory(deleteDialog.item!.id) :
          () => handleDeleteSubCategory(deleteDialog.item!.id)
        }
      />
    </div>
  );
}