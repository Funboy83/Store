'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getSuppliers, createSupplier } from '@/lib/actions/suppliers';
import { Supplier } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SupplierDropdownProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}

export function SupplierDropdown({ value, onValueChange, placeholder = "Select supplier..." }: SupplierDropdownProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { toast } = useToast();

  // New supplier form state
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    website: '',
    notes: '',
    paymentTerms: '',
    taxId: ''
  });

  // Load suppliers on component mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const suppliersData = await getSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load suppliers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async () => {
    if (!newSupplier.name.trim()) {
      toast({
        title: 'Error',
        description: 'Supplier name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const result = await createSupplier({
        name: newSupplier.name,
        email: newSupplier.email || undefined,
        phone: newSupplier.phone || undefined,
        address: newSupplier.address || undefined,
        contactPerson: newSupplier.contactPerson || undefined,
        website: newSupplier.website || undefined,
        notes: newSupplier.notes || undefined,
        paymentTerms: newSupplier.paymentTerms || undefined,
        taxId: newSupplier.taxId || undefined,
      });

      if (result.success && result.supplierId) {
        toast({
          title: 'Success',
          description: 'Supplier created successfully',
        });

        // Reload suppliers and select the new one
        await loadSuppliers();
        onValueChange?.(newSupplier.name);
        
        // Reset form and close modal
        setNewSupplier({
          name: '',
          email: '',
          phone: '',
          address: '',
          contactPerson: '',
          website: '',
          notes: '',
          paymentTerms: '',
          taxId: ''
        });
        setAddModalOpen(false);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create supplier',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedSupplier = suppliers.find(s => s.name === value);

  return (
    <div className="space-y-2">
      <Label>Supplier</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
            >
              {selectedSupplier ? selectedSupplier.name : placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <Command>
              <CommandInput placeholder="Search suppliers..." />
              <CommandList>
                <CommandEmpty>
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">No suppliers found.</p>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value=""
                    onSelect={() => {
                      onValueChange?.("");
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === "" ? "opacity-100" : "opacity-0"
                        )}
                      />
                      No Supplier
                    </div>
                  </CommandItem>
                  {suppliers.map((supplier) => (
                    <CommandItem
                      key={supplier.id}
                      value={supplier.name}
                      onSelect={(currentValue) => {
                        onValueChange?.(currentValue === value ? "" : currentValue);
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center">
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === supplier.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="font-medium">{supplier.name}</span>
                        </div>
                        {supplier.contactPerson && (
                          <p className="text-xs text-muted-foreground ml-6">
                            Contact: {supplier.contactPerson}
                          </p>
                        )}
                        {supplier.phone && (
                          <p className="text-xs text-muted-foreground ml-6">
                            Phone: {supplier.phone}
                          </p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>
                Create a new supplier for your inventory management.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplier-name">Supplier Name *</Label>
                <Input
                  id="supplier-name"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter supplier name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-person">Contact Person</Label>
                <Input
                  id="contact-person"
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="Contact person name"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier-email">Email</Label>
                  <Input
                    id="supplier-email"
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplier-phone">Phone</Label>
                  <Input
                    id="supplier-phone"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier-address">Address</Label>
                <Textarea
                  id="supplier-address"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Supplier address"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier-website">Website</Label>
                  <Input
                    id="supplier-website"
                    value={newSupplier.website}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment-terms">Payment Terms</Label>
                  <Input
                    id="payment-terms"
                    value={newSupplier.paymentTerms}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    placeholder="e.g., Net 30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier-notes">Notes</Label>
                <Textarea
                  id="supplier-notes"
                  value={newSupplier.notes}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSupplier} disabled={loading}>
                {loading ? 'Creating...' : 'Create Supplier'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}