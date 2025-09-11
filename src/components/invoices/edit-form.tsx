
"use client"

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, CalendarIcon, Loader2, UserPlus, ArrowLeft, History } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { InventoryPicker } from './inventory-picker';
import { Product, Customer, InvoiceItem, InvoiceDetail, Invoice } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { updateInvoice } from '@/lib/actions/invoice';
import { AddCustomerForm } from '../customers/add-customer-form';

interface EditInvoiceFormProps {
  invoice: InvoiceDetail;
  inventory: Product[];
  customers: Customer[];
}

const WALK_IN_CUSTOMER_ID = 'Aj0l1O2kJcvlF3J0uVMX';

export function EditInvoiceForm({ invoice, inventory, customers }: EditInvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isUpdating, startUpdateTransition] = useTransition();

  // Store the initial state of the invoice to compare against on save
  const [initialInvoice] = useState(invoice);

  const [items, setItems] = useState<InvoiceItem[]>(invoice.items);
  
  const [isWalkIn, setIsWalkIn] = useState(invoice.customer.id === WALK_IN_CUSTOMER_ID);
  const [walkInCustomerName, setWalkInCustomerName] = useState(
    invoice.customer.id === WALK_IN_CUSTOMER_ID ? invoice.customer.name.replace('Walk-In - ', '') : ''
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(invoice.customer);
  
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date(invoice.dueDate));
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [invoiceNumber] = useState<string>(invoice.invoiceNumber);
  const [taxRate, setTaxRate] = useState((invoice.tax / invoice.subtotal) * 100 || 0);
  const [discount, setDiscount] = useState((invoice.discount / invoice.subtotal) * 100 || 0);
  const [notes, setNotes] = useState(invoice.summary || '');

  const displayCustomers = useMemo(() => {
    return customers.filter(c => c.id !== WALK_IN_CUSTOMER_ID);
  }, [customers]);

  useEffect(() => {
    if (isWalkIn) {
      const walkInCustomer = customers.find(c => c.id === WALK_IN_CUSTOMER_ID);
      setSelectedCustomer(walkInCustomer);
    } else {
      if (selectedCustomer?.id === WALK_IN_CUSTOMER_ID) {
        setSelectedCustomer(displayCustomers[0]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWalkIn, customers, displayCustomers]);


  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomer(customers.find(c => c.id === customerId));
  };
  
  const handleAddItems = (selectedProducts: Product[]) => {
    const newItems: InvoiceItem[] = selectedProducts.map(product => ({
      id: product.id,
      productName: `${product.brand} ${product.model}`,
      description: `${product.imei} - ${product.storage} - ${product.color}`,
      quantity: 1,
      unitPrice: product.price,
      total: product.price,
      isCustom: false,
    }));
    setItems(prev => [...prev, ...newItems]);
    setIsPickerOpen(false);
    toast({ title: 'Items Added', description: `${newItems.length} new item(s) have been added.` });
  };

  const handleAddCustomItem = () => {
    const newItem: InvoiceItem = {
      id: `custom-${Date.now()}`,
      productName: 'Custom Item',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      isCustom: true,
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleItemChange = (itemId: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item };
        
        if (field === 'unitPrice' || field === 'quantity') {
            (updatedItem as any)[field] = Number(value) || 0;
        } else {
          (updatedItem as any)[field] = value;
        }

        updatedItem.total = updatedItem.unitPrice * updatedItem.quantity;
        return updatedItem;
      }
      return item;
    }));
  };

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.total, 0), [items]);
  const taxAmount = useMemo(() => subtotal * (taxRate / 100), [subtotal, taxRate]);
  const discountAmount = useMemo(() => subtotal * (discount / 100), [subtotal, discount]);
  const total = useMemo(() => subtotal + taxAmount - discountAmount, [subtotal, taxAmount, discountAmount]);

  const handleUpdateInvoice = () => {
    if (!selectedCustomer) {
      toast({ title: 'Error', description: 'A customer must be selected.', variant: 'destructive' });
      return;
    }

    startUpdateTransition(async () => {
      const finalCustomerName = isWalkIn && walkInCustomerName.trim() !== ''
        ? `Walk-In - ${walkInCustomerName.trim()}`
        : selectedCustomer.name;

      const updatedInvoiceData: Omit<Invoice, 'id' | 'createdAt' | 'status'> = {
        invoiceNumber,
        customerId: selectedCustomer.id,
        customerName: finalCustomerName,
        subtotal,
        tax: taxAmount,
        discount: discountAmount,
        total,
        issueDate: initialInvoice.issueDate,
        dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : '',
        summary: notes
      };

      const result = await updateInvoice({
        originalInvoice: initialInvoice,
        updatedInvoice: updatedInvoiceData,
        updatedItems: items,
      });

      if (result.success) {
        toast({
          title: 'Invoice Updated!',
          description: `Invoice ${invoiceNumber} has been successfully updated.`,
        });
        router.push(`/dashboard/invoices/${invoice.id}`);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update the invoice.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-4">
        </div>
        <div className="flex items-center gap-2">
           <Link href={`/dashboard/invoices/${invoice.id}/history`} passHref>
            <Button variant="outline">
                <History className="mr-2 h-4 w-4" />
                View History
            </Button>
          </Link>
          <Button onClick={handleUpdateInvoice} disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-auto p-1">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>Invoice details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                  <div className="flex items-center justify-between">
                      <Label>Bill to</Label>
                      <div className="flex items-center space-x-2">
                        <Switch id="walk-in-switch" checked={isWalkIn} onCheckedChange={setIsWalkIn} />
                        <Label htmlFor="walk-in-switch">Walk-in Customer</Label>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select onValueChange={handleSelectCustomer} value={selectedCustomer?.id} disabled={isWalkIn}>
                    <SelectTrigger className="h-14">
                        <SelectValue asChild>
                        {selectedCustomer && !isWalkIn ? (
                            <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarFallback>{selectedCustomer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{selectedCustomer.name}</p>
                                <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                            </div>
                            </div>
                        ) : (
                            <span>Select a customer</span>
                        )}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {displayCustomers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p>{customer.name}</p>
                                <p className="text-sm text-muted-foreground">{customer.email}</p>
                            </div>
                            </div>
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => setIsAddCustomerOpen(true)} disabled={isWalkIn}>
                        <UserPlus className="h-5 w-5" />
                        <span className="sr-only">Add New Customer</span>
                    </Button>
                  </div>
                  
                  {isWalkIn && (
                    <Input 
                      placeholder="Enter customer name for receipt (optional)"
                      value={walkInCustomerName}
                      onChange={(e) => setWalkInCustomerName(e.target.value)}
                      className="mt-2"
                    />
                  )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-number">Invoice number</Label>
                  <Input id="invoice-number" value={invoiceNumber} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="due-date"
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Invoice items</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div>
                  <Label>Items</Label>
                  <div className="space-y-2 mt-2">
                    {items.map(item => (
                      <div key={item.id} className="grid grid-cols-[1fr_80px_100px_100px_auto] gap-2 items-center">
                        <div className="flex flex-col">
                            <Input 
                                value={item.productName} 
                                readOnly={!item.isCustom}
                                onChange={e => handleItemChange(item.id, 'productName', e.target.value)}
                                className={cn("font-medium", !item.isCustom && "bg-gray-100 border-0")}
                                placeholder="Item name"
                            />
                            {item.description && (
                                <p className="text-xs text-muted-foreground px-3">{item.description}</p>
                            )}
                        </div>
                        <Input 
                            type="number"
                            value={item.quantity}
                            onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                            className="text-right"
                            placeholder="1"
                        />
                        <Input 
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={e => handleItemChange(item.id, 'unitPrice', e.target.value)}
                            className="text-right"
                            placeholder="0.00"
                        />
                        <Input value={item.total.toFixed(2)} readOnly className="bg-gray-100 text-right" />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleAddCustomItem}><Plus className="mr-2 h-4 w-4" /> Add custom item</Button>
                  <Button variant="outline" onClick={() => setIsPickerOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add from inventory</Button>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="tax">Tax (%)</Label>
                        <Input id="tax" type="number" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="discount">Discount (%)</Label>
                        <Input id="discount" type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} placeholder="0" />
                    </div>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea 
                  id="notes" 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add any relevant notes for the invoice..."
                  rows={4}
              />
            </CardContent>
          </Card>

        </div>
      </div>
      <InventoryPicker
        isOpen={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        inventory={inventory}
        onAddItems={handleAddItems}
      />
      <AddCustomerForm isOpen={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen} />
    </div>
  );
}
