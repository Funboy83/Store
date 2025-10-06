
'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ItemTable } from './item-table';
import { InventoryPicker } from '../invoices/inventory-picker';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Tag, Trash2 } from 'lucide-react';
import type { InvoiceDetail, InvoiceItem, Customer, Product } from '@/lib/types';
import { processRefundExchange } from '@/lib/actions/refund';

interface RefundWorkspaceProps {
  originalInvoice: InvoiceDetail;
  customer: Customer;
  inventory: Product[];
}

export function RefundWorkspace({ originalInvoice, customer, inventory }: RefundWorkspaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, startSavingTransition] = useTransition();
  
  const [returnedItems, setReturnedItems] = useState<InvoiceItem[]>([]);
  const [exchangeItems, setExchangeItems] = useState<InvoiceItem[]>([]);
  
  const [isInventoryPickerOpen, setIsInventoryPickerOpen] = useState(false);

  const [paymentMade, setPaymentMade] = useState({ cash: 0, card: 0 });
  const [refundMethod, setRefundMethod] = useState<'Cash' | 'Card' | 'StoreCredit'>('StoreCredit');

  const totalCredit = useMemo(() => returnedItems.reduce((acc, item) => acc + item.total, 0), [returnedItems]);
  const exchangeTotal = useMemo(() => exchangeItems.reduce((acc, item) => acc + item.total, 0), [exchangeItems]);
  const finalBalance = exchangeTotal - totalCredit;

  const handleReturnToggle = (item: InvoiceItem) => {
    setReturnedItems(prev => {
      const isAlreadyReturned = prev.some(returnedItem => returnedItem.id === item.id);
      if (isAlreadyReturned) {
        return prev.filter(returnedItem => returnedItem.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleAddExchangeItems = (selectedProducts: Product[]) => {
    const newItems: InvoiceItem[] = selectedProducts.map(p => ({
      id: p.id,
      productName: `${p.brand} ${p.model}`,
      description: p.imei,
      quantity: 1,
      unitPrice: p.price,
      total: p.price,
      isCustom: false,
      inventoryId: p.id,
    }));
    setExchangeItems(prev => [...prev, ...newItems]);
    setIsInventoryPickerOpen(false);
  };
  
  const handleAddCustomExchangeItem = () => {
    const newItem: InvoiceItem = {
      id: `custom-${Date.now()}`,
      productName: '',
      description: 'Custom item',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      isCustom: true,
    };
    setExchangeItems(prev => [...prev, newItem]);
  };

  const handleRemoveExchangeItem = (itemId: string) => {
    setExchangeItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  const handleExchangeItemChange = (itemId: string, field: keyof InvoiceItem, value: string | number) => {
    setExchangeItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleFinalize = () => {
    if (returnedItems.length === 0) {
      toast({ title: "No items returned", description: "Please select at least one item to return.", variant: "destructive" });
      return;
    }
    
    startSavingTransition(async () => {
      const result = await processRefundExchange({
        originalInvoice,
        returnedItems,
        exchangeItems,
        customer,
        paymentMade,
        refundMethod: finalBalance < 0 ? refundMethod : undefined,
      });

      if (result.success) {
        toast({ title: "Success!", description: "Refund/exchange has been processed." });
        router.push(`/dashboard/invoices/${originalInvoice.id}`);
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Select Items to Return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {originalInvoice.items.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <Checkbox
                      id={`return-${item.id}`}
                      checked={returnedItems.some(ri => ri.id === item.id)}
                      onCheckedChange={() => handleReturnToggle(item)}
                    />
                    <Label htmlFor={`return-${item.id}`} className="flex-1 cursor-pointer">
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </Label>
                    <p className="font-medium">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.total)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>2. Add New Items for Exchange</CardTitle>
            </CardHeader>
            <CardContent>
              <ItemTable 
                items={exchangeItems} 
                onRemove={handleRemoveExchangeItem} 
                onItemChange={handleExchangeItemChange} 
              />
            </CardContent>
            <CardFooter className="justify-start gap-2">
               <Button variant="outline" onClick={() => setIsInventoryPickerOpen(true)}>
                <Plus className="mr-2 h-4 w-4"/> Add from Inventory
              </Button>
              <Button variant="ghost" onClick={handleAddCustomExchangeItem}>
                <Plus className="mr-2 h-4 w-4"/> Add Custom Item
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>3. Finalize Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="space-y-2 rounded-lg p-4 border">
                {exchangeItems.length > 0 && (
                  <>
                    <div className="flex justify-between font-medium">
                      <span>New Items Total</span>
                      <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(exchangeTotal)}</span>
                    </div>
                    <Separator />
                  </>
                )}
                 <div className="flex justify-between font-medium text-green-600">
                    <span className="flex items-center gap-2"><Tag className="h-4 w-4"/>Credit from Return</span>
                    <span>-{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalCredit)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>{finalBalance >= 0 ? 'Amount Owed' : 'Refund Due'}</span>
                  <span className={finalBalance >= 0 ? 'text-destructive' : 'text-green-600'}>
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(finalBalance))}
                  </span>
                </div>
              </div>

              {/* Payment/Refund sections */}
              {finalBalance > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Record Additional Payment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="cash-payment">Cash Amount</Label>
                        <Input id="cash-payment" type="number" placeholder="0.00" value={paymentMade.cash || ''} onChange={(e) => setPaymentMade(p => ({...p, cash: Number(e.target.value)}))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="card-payment">Card Amount</Label>
                        <Input id="card-payment" type="number" placeholder="0.00" value={paymentMade.card || ''} onChange={(e) => setPaymentMade(p => ({...p, card: Number(e.target.value)}))} />
                    </div>
                  </div>
                </div>
              )}

              {finalBalance < 0 && (
                <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold">Confirm Refund</h3>
                    <div className="space-y-2">
                        <Label htmlFor="refund-method">Refund Method</Label>
                        <Select value={refundMethod} onValueChange={(value: 'Cash' | 'Card' | 'StoreCredit') => setRefundMethod(value)}>
                            <SelectTrigger id="refund-method">
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="StoreCredit">Store Credit</SelectItem>
                                <SelectItem value="Cash">Refund as Cash</SelectItem>
                                <SelectItem value="Card">Return to Card</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
              )}
              
              {/* Info about what will be created */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <h4 className="font-semibold text-blue-900 text-sm mb-1">What will happen:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Credit Note created (with sequential number: CN-2000+)</li>
                  <li>• Returned items status changed: Sold → Available</li>
                  {exchangeItems.length > 0 && <li>• New Invoice created for exchange items</li>}
                  {finalBalance < 0 && <li>• Refund payment record created</li>}
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleFinalize} disabled={isSaving || returnedItems.length === 0}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finalize & Create Documents
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      <InventoryPicker
        isOpen={isInventoryPickerOpen}
        onOpenChange={setIsInventoryPickerOpen}
        inventory={inventory.filter(p => p.status === 'Available')}
        onAddItems={handleAddExchangeItems}
      />
    </>
  );
}

    