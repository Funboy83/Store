"use client"

import React, { useState, useTransition, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, PlusCircle, BrainCircuit } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { getInvoiceSummary } from '@/lib/actions/invoice';
import { getInventory } from '@/lib/actions/inventory';
import { useToast } from '@/hooks/use-toast';
import type { Product, InvoiceItem } from '@/lib/types';
import { InvoicePreview } from './preview';
import { Skeleton } from '../ui/skeleton';

export function CreateInvoiceForm() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [customerName, setCustomerName] = useState('John Doe');
  const [customerEmail, setCustomerEmail] = useState('john.doe@email.com');
  const [showPreview, setShowPreview] = useState(false);
  const [summary, setSummary] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProducts() {
      setIsLoadingProducts(true);
      const inventory = await getInventory();
      setProducts(inventory);
      setIsLoadingProducts(false);
    }
    fetchProducts();
  }, []);

  const productOptions: ComboboxOption[] = useMemo(() => 
    products.map(p => ({ value: p.id, label: `${p.brand} ${p.model} - $${p.price.toFixed(2)}` })),
    [products]
  );
  
  const handleAddProduct = (productId: string) => {
    if (!productId) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = items.find(item => item.productId === productId);
    if (existingItem) {
      handleQuantityChange(productId, existingItem.quantity + 1);
    } else {
      setItems(prev => [...prev, {
        productId: product.id,
        productName: `${product.brand} ${product.model}`,
        quantity: 1,
        unitPrice: product.price,
        total: product.price,
      }]);
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
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  
  const handleGenerateSummary = () => {
    if (items.length === 0) {
      toast({
        title: "No items",
        description: "Please add items to the invoice before generating a summary.",
        variant: 'destructive',
      });
      return;
    }
    startTransition(async () => {
      const result = await getInvoiceSummary(items);
      if (result.summary) {
        setSummary(result.summary);
        toast({
          title: "Summary Generated!",
          description: "The AI-powered summary has been created.",
        });
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: 'destructive',
        });
      }
    });
  };

  if (showPreview) {
    return (
      <InvoicePreview 
        invoice={{
          id: 'temp-inv',
          invoiceNumber: 'INV-00X',
          customer: { id: 'temp-cust', name: customerName, email: customerEmail, address: '123 Test St' },
          items,
          subtotal, tax, total,
          issueDate: new Date().toLocaleDateString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'Pending',
          summary,
        }}
        onBack={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input id="customerEmail" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-[120px]">Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.productId}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={e => handleQuantityChange(item.productId, parseInt(e.target.value))}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.productId)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {isLoadingProducts ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Combobox
                  options={productOptions}
                  onChange={handleAddProduct}
                  placeholder="Add a product..."
                  searchPlaceholder="Search products..."
                  emptyPlaceholder="No products found."
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => setShowPreview(true)} disabled={items.length === 0}>
                Generate Invoice
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
                placeholder="AI-generated summary will appear here..."
                value={summary}
                onChange={e => setSummary(e.target.value)}
                rows={5}
            />
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGenerateSummary}
              disabled={isPending || items.length === 0}
            >
              <BrainCircuit className="mr-2 h-4 w-4" />
              {isPending ? 'Generating...' : 'Generate Summary'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
