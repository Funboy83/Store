

"use client"

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, Plus, CalendarIcon, Loader2, UserPlus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { InventoryPicker } from './inventory-picker';
import { Product, Customer, InvoiceItem, Invoice } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '../logo';
import { getLatestInvoiceNumber, sendInvoice } from '@/lib/actions/invoice';
import { AddCustomerForm } from '../customers/add-customer-form';
import { Checkbox } from '../ui/checkbox';

interface CreateInvoiceFormProps {
  inventory: Product[];
  customers: Customer[];
}

export function CreateInvoiceForm({ inventory, customers }: CreateInvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSending, startSendTransition] = useTransition();

  const [showPreview, setShowPreview] = useState(true);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  
  const [isWalkInCustomer, setIsWalkInCustomer] = useState(false);
  const [walkInCustomerName, setWalkInCustomerName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(customers[0]);
  
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('...');
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  // POS Payment State
  const [isCashPayment, setIsCashPayment] = useState(false);
  const [isCardPayment, setIsCardPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);

  useEffect(() => {
    async function fetchInvoiceNumber() {
      const nextNumber = await getLatestInvoiceNumber();
      setInvoiceNumber(String(nextNumber));
    }
    fetchInvoiceNumber();
  }, []);

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomer(customers.find(c => c.id === customerId));
  };
  
  const handleAddItems = (selectedProducts: Product[]) => {
    const existingItemIds = new Set(items.map(item => item.id));
    const newProducts = selectedProducts.filter(p => !existingItemIds.has(p.id));
    const duplicateCount = selectedProducts.length - newProducts.length;

    if (newProducts.length > 0) {
      const newItems: InvoiceItem[] = newProducts.map(product => ({
        id: product.id,
        productName: `${product.brand} ${product.model}`,
        description: `${product.imei} - ${product.storage} - ${product.color}`,
        quantity: 1,
        unitPrice: product.price,
        total: product.price,
        isCustom: false,
      }));
      setItems(prev => [...prev, ...newItems]);
    }
    
    setIsPickerOpen(false);
    
    let toastDescription = '';
    if (newProducts.length > 0) {
      toastDescription += `${newProducts.length} new item(s) have been added.`;
    }
    if (duplicateCount > 0) {
      toastDescription += ` ${duplicateCount} item(s) were already in the invoice and were not added again.`
    }
    
    if (toastDescription) {
      toast({
        title: 'Items Processed',
        description: toastDescription,
      });
    }

    if (newProducts.length === 0 && selectedProducts.length > 0) {
      toast({
        title: 'Items Already in Invoice',
        description: `All ${selectedProducts.length} selected item(s) are already in the invoice.`,
      });
    }
  };

  const handleAddCustomItem = () => {
    const newItem: InvoiceItem = {
      id: `custom-${Date.now()}`,
      productName: '',
      description: 'Custom item',
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
            (updatedItem as any)[field] = Number(value);
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

  const totalPaid = useMemo(() => (isCashPayment ? cashAmount : 0) + (isCardPayment ? cardAmount : 0), [isCashPayment, cashAmount, isCardPayment, cardAmount]);
  const amountDue = useMemo(() => total - totalPaid, [total, totalPaid]);
  const change = useMemo(() => amountDue < 0 ? Math.abs(amountDue) : 0, [amountDue]);

  
  const handleSendInvoice = () => {
    const finalCustomer = isWalkInCustomer 
      ? { id: 'walk-in', name: walkInCustomerName || 'Walk-in Customer', email: '', phone: '' }
      : selectedCustomer;

    if (!finalCustomer || !finalCustomer.name) {
      toast({ title: 'Error', description: 'Please select or enter a customer.', variant: 'destructive' });
      return;
    }
    if (items.length === 0) {
      toast({ title: 'Error', description: 'Please add at least one item to the invoice.', variant: 'destructive' });
      return;
    }

    startSendTransition(async () => {
      const invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'status'> = {
        invoiceNumber,
        customerId: finalCustomer.id,
        subtotal,
        tax: taxAmount,
        discount: discountAmount,
        total,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : '',
        summary: notes,
      };
      
      const result = await sendInvoice({ invoiceData, items, customer: finalCustomer });

      if (result.success) {
        toast({
          title: 'Invoice Sent!',
          description: `Invoice ${invoiceNumber} has been created.`,
        });
        router.push('/dashboard/invoices');
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    });
  };

  const displayedCustomer = isWalkInCustomer
    ? { name: walkInCustomerName || 'Walk-in Customer', email: '', address: '' }
    : selectedCustomer;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
          <div className="flex items-center space-x-2">
            <Switch id="show-preview" checked={showPreview} onCheckedChange={setShowPreview} />
            <Label htmlFor="show-preview">Show Preview</Label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast({ title: 'Coming soon!'})}>Save as Draft</Button>
          <Button onClick={handleSendInvoice} disabled={isSending}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSending ? 'Sending...' : 'Send Invoice'}
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-auto">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader><CardTitle>Invoice details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                  <div className="flex items-center justify-between">
                      <Label>Bill to</Label>
                      <div className="flex items-center space-x-2">
                          <Switch id="walk-in-switch" checked={isWalkInCustomer} onCheckedChange={setIsWalkInCustomer} />
                          <Label htmlFor="walk-in-switch">Walk-in Customer</Label>
                      </div>
                  </div>
                  {isWalkInCustomer ? (
                      <Input 
                          placeholder="Enter customer name" 
                          value={walkInCustomerName} 
                          onChange={(e) => setWalkInCustomerName(e.target.value)} 
                      />
                  ) : (
                      <div className="flex items-center gap-2">
                          <Select onValueChange={handleSelectCustomer} defaultValue={selectedCustomer?.id}>
                          <SelectTrigger className="h-14">
                              <SelectValue asChild>
                              {selectedCustomer ? (
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
                              {customers.map(customer => (
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
                          <Button variant="outline" size="icon" onClick={() => setIsAddCustomerOpen(true)}>
                              <UserPlus className="h-5 w-5" />
                              <span className="sr-only">Add New Customer</span>
                          </Button>
                      </div>
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

          {/* Invoice Items */}
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
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost"><Plus className="mr-2 h-4 w-4" /> Add from inventory</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => setIsPickerOpen(true)}>
                              Phone Inventory
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => toast({ title: 'Coming Soon!', description: 'Managing accessories will be available in a future update.'})}>
                              Accessories
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
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
           
          {/* Payment Section */}
          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Checkbox id="cash-payment" checked={isCashPayment} onCheckedChange={(checked) => setIsCashPayment(!!checked)} />
                    <Label htmlFor="cash-payment" className="flex-1">Cash</Label>
                    <Input 
                        type="number"
                        placeholder="0.00"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                        disabled={!isCashPayment}
                        className="max-w-[120px]"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <Checkbox id="card-payment" checked={isCardPayment} onCheckedChange={(checked) => setIsCardPayment(!!checked)} />
                    <Label htmlFor="card-payment" className="flex-1">Credit Card</Label>
                    <Input 
                        type="number"
                        placeholder="0.00"
                        value={cardAmount}
                        onChange={(e) => setCardAmount(parseFloat(e.target.value) || 0)}
                        disabled={!isCardPayment}
                        className="max-w-[120px]"
                    />
                </div>
                <Separator />
                <div className="space-y-2">
                    <div className="flex justify-between font-medium">
                        <Label>Total Paid</Label>
                        <span>${totalPaid.toFixed(2)}</span>
                    </div>
                    <div className={cn("flex justify-between font-bold text-lg", amountDue > 0 ? "text-destructive" : "text-green-600")}>
                        <Label>{amountDue >= 0 ? 'Amount Due' : 'Change'}</Label>
                        <span>${Math.abs(amountDue).toFixed(2)}</span>
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

        {/* Right Column */}
        <div className={cn("flex-col gap-6", showPreview ? "flex" : "hidden")}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Preview</h2>
          </div>
          <Card className="p-8">
            <div className="flex items-center justify-between">
              <Logo isCollapsed={false} />
              <div className="text-right">
                <h1 className="text-2xl font-bold">Invoice</h1>
                <p className="text-muted-foreground">{invoiceNumber}</p>
              </div>
            </div>
            <Separator className="my-6" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold">Billed to</h3>
                <address className="not-italic text-sm text-muted-foreground">
                  {displayedCustomer?.name}<br />
                  {displayedCustomer?.address}<br />
                  {displayedCustomer?.email}
                </address>
              </div>
              <div className="space-y-1 text-right">
                <h3 className="font-semibold">Due date</h3>
                <p className="text-sm">{dueDate ? format(dueDate, "dd MMMM yyyy") : 'N/A'}</p>
              </div>
            </div>
            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">{item.productName}</p>
                        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      </TableCell>
                       <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">No items added</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-6 flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount ({discount}%)</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                        <span>+${taxAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            {notes && (
              <div className="mt-6">
                <h3 className="font-semibold">Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
              </div>
            )}
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
