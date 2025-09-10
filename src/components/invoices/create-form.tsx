"use client"

import React, { useState, useMemo, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, Plus, CalendarIcon, ChevronDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { InvoicePreview } from './preview';
import { InventoryPicker } from './inventory-picker';
import { Product, Customer, InvoiceItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '../logo';

interface CreateInvoiceFormProps {
  inventory: Product[];
  customers: Customer[];
}

export function CreateInvoiceForm({ inventory, customers }: CreateInvoiceFormProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(customers[0]);
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const { toast } = useToast();

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomer(customers.find(c => c.id === customerId));
  };
  
  const handleAddItems = (selectedProducts: Product[]) => {
    const newItems: InvoiceItem[] = selectedProducts.map(product => ({
      productId: product.id,
      productName: `${product.brand} ${product.model}`,
      quantity: 1,
      unitPrice: product.price,
      total: product.price,
    }));

    // Avoid adding duplicates
    const uniqueNewItems = newItems.filter(newItem => !items.some(existingItem => existingItem.productId === newItem.productId));

    setItems(prev => [...prev, ...uniqueNewItems]);
    setIsPickerOpen(false);
    if(uniqueNewItems.length > 0) {
      toast({
        title: 'Items Added',
        description: `${uniqueNewItems.length} new item(s) have been added to the invoice.`,
      });
    } else {
       toast({
        title: 'Items Already Exist',
        description: 'The selected items are already in the invoice.',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    const newQuantity = Math.max(0, quantity);
    setItems(prev => prev.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity, total: item.unitPrice * newQuantity }
        : item
    ));
  };

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.total, 0), [items]);
  const taxRate = 0; // As per image
  const discount = 0; // As per image
  const tax = subtotal * taxRate;
  const total = subtotal + tax - discount;
  
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
          <div className="flex items-center space-x-2">
            <Switch id="show-preview" checked={showPreview} onCheckedChange={setShowPreview} />
            <Label htmlFor="show-preview">Show Preview</Label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Save as Draft</Button>
          <Button className="bg-green-500 hover:bg-green-600 text-white">Send Invoice</Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader><CardTitle>Invoice details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Bill to</Label>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-number">Invoice number</Label>
                  <Input id="invoice-number" defaultValue="UXERFLOW-INV001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
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

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" defaultValue={selectedCustomer?.address} />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader><CardTitle>Invoice items</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select defaultValue="usd">
                        <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="usd">
                                <div className="flex items-center gap-2">
                                    <span>🇺🇸</span> US Dollar
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                  <Label>Items</Label>
                  <div className="space-y-2 mt-2">
                    {items.map(item => (
                      <div key={item.productId} className="grid grid-cols-[1fr_80px_120px_120px_auto] gap-2 items-center">
                        <Input value={item.productName} readOnly className="bg-gray-100" />
                        <Input 
                            type="number" 
                            value={item.quantity}
                            onChange={e => handleQuantityChange(item.productId, parseInt(e.target.value))}
                            className="text-center"
                        />
                        <Input value={item.unitPrice.toFixed(2)} readOnly className="bg-gray-100 text-right" />
                        <Input value={item.total.toFixed(2)} readOnly className="bg-gray-100 text-right" />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.productId)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost"><Plus className="mr-2" /> Add from inventory</Button>
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className={cn("flex-col gap-6", showPreview ? "flex" : "hidden")}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Preview</h2>
          </div>
          <Card className="p-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Invoice</h1>
                  <p className="text-muted-foreground">UXERFLOW-INV001</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Logo isCollapsed={false} />
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 col-span-2">
                  <h3 className="font-semibold">Billed to</h3>
                  <p className="text-sm">{selectedCustomer?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer?.email}</p>
                </div>
                <div className="space-y-1 text-right">
                  <h3 className="font-semibold">Due date</h3>
                  <p className="text-sm">{dueDate ? format(dueDate, "dd MMMM yyyy") : 'N/A'}</p>
                </div>
              </div>
               <div className="grid grid-cols-1 gap-4">
                 <div className="space-y-1">
                   <h3 className="font-semibold">Address</h3>
                   <p className="text-sm text-muted-foreground">{selectedCustomer?.address}</p>
                 </div>
               </div>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-center">QTY</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.productName}</TableCell>
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
            </CardContent>
            <CardFooter className="flex justify-end">
                <div className="w-1/2 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount</span>
                        <span>${discount.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                     <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>
            </CardFooter>
          </Card>
        </div>
      </div>
      <InventoryPicker
        isOpen={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        inventory={inventory}
        onAddItems={handleAddItems}
       />
    </>
  );
}
