
'use client';

import { useState, useTransition, useMemo } from 'react';
import { useAsyncEffect } from '@/hooks/use-async-effect';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

interface AddableComboboxProps {
  formControlName: string;
  label: string;
  fetchOptions: () => Promise<string[]>;
  addOption: (value: string) => Promise<{ success: boolean; error?: string }>;
  error?: string[];
  onChange?: (value: string) => void;
}

const ADD_NEW_VALUE = '__add_new__';

export function AddableCombobox({
  formControlName,
  label,
  fetchOptions,
  addOption,
  error,
  onChange,
}: AddableComboboxProps) {
  const { toast } = useToast();
  const [options, setOptions] = useState<string[]>([]);
  const [selectedValue, setSelectedValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItemValue, setNewItemValue] = useState('');
  const [isPending, startTransition] = useTransition();

  const refetchOptions = async () => {
    setIsLoading(true);
    const fetchedOptions = await fetchOptions();
    setOptions(fetchedOptions);
    setIsLoading(false);
  };

  useAsyncEffect(async () => {
    await refetchOptions();
  }, []);

  const comboboxOptions = useMemo(() => {
    const uniqueOptions = [...new Set(options)]; // Ensure options are unique
    const opts = uniqueOptions.map(opt => ({ value: opt, label: opt }));
    opts.push({ value: ADD_NEW_VALUE, label: `+ Add New ${label}...` });
    return opts;
  }, [options, label]);

  const handleValueChange = (value: string) => {
    if (value === ADD_NEW_VALUE) {
      setIsDialogOpen(true);
    } else {
      setSelectedValue(value);
      if (onChange) {
        onChange(value);
      }
    }
  };

  const handleAddNewItem = () => {
    if (!newItemValue) return;
    startTransition(async () => {
      const result = await addOption(newItemValue);
      if (result.success) {
        await refetchOptions();
        setSelectedValue(newItemValue);
        setIsDialogOpen(false);
        setNewItemValue('');
        if (onChange) {
          onChange(newItemValue);
        }
        toast({ title: 'Success', description: `New ${label.toLowerCase()} added.` });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to add new item.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={formControlName}>{label}</Label>
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <Combobox
          options={comboboxOptions}
          value={selectedValue}
          onChange={handleValueChange}
          placeholder={`Select a ${label.toLowerCase()}...`}
          searchPlaceholder={`Search ${label.toLowerCase()}s...`}
          emptyPlaceholder="No options found."
        />
      )}
      <input type="hidden" name={formControlName} value={selectedValue} />
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new {label}</DialogTitle>
            <DialogDescription>
              Enter the name for the new {label.toLowerCase()} you want to add.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-item" className="text-right">
                Name
              </Label>
              <Input
                id="new-item"
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                className="col-span-3"
                placeholder={`e.g. A new ${label.toLowerCase()}`}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddNewItem} disabled={isPending}>
              {isPending ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
