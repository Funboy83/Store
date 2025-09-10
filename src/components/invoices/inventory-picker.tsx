
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/inventory/data-table';
import { columns } from '@/components/inventory/columns';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface InventoryPickerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  inventory: Product[];
  onAddItems: (selectedProducts: Product[]) => void;
}

export function InventoryPicker({
  isOpen,
  onOpenChange,
  inventory,
  onAddItems,
}: InventoryPickerProps) {
  const [rowSelection, setRowSelection] = useState({});
  const { toast } = useToast();

  const handleAdd = () => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    if (selectedIndices.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select at least one product to add.',
        variant: 'destructive',
      });
      return;
    }
    const selectedProducts = selectedIndices.map(index => inventory[index]);
    onAddItems(selectedProducts);
    setRowSelection({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Products from Inventory</DialogTitle>
          <DialogDescription>
            Select the products you want to add to the invoice.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
            <DataTable 
                columns={columns} 
                data={inventory}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
            />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd}>Add Selected Items</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
