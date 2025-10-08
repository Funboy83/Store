'use client';

import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Category, SubCategory } from '@/lib/types';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: 'category' | 'subcategory';
  item?: Category | SubCategory;
  onConfirm: () => void;
}

export function DeleteDialog({ open, onOpenChange, type, item, onConfirm }: DeleteDialogProps) {
  if (!type || !item) return null;

  const isCategory = type === 'category';
  const itemName = item.name;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {isCategory ? 'Category' : 'Sub-Category'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete the {isCategory ? 'category' : 'sub-category'}{' '}
              <span className="font-semibold">&quot;{itemName}&quot;</span>?
            </p>
            
            {isCategory && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium text-muted-foreground">
                  <strong>Note:</strong> You can only delete categories that have no sub-categories. 
                  Please delete all sub-categories first before removing this category.
                </p>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. Any inventory items using this{' '}
              {isCategory ? 'category' : 'sub-category'} will need to be reassigned manually.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            Delete {isCategory ? 'Category' : 'Sub-Category'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}