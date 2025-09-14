
'use client';

import { useState, useMemo, useTransition } from 'react';
import type { InvoiceDetail, Customer, InvoiceItem, Product } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2, Loader2, Banknote, CreditCard, Tag } from 'lucide-react';
import { ItemTable } from './item-table';
import { InventoryPicker } from '../invoices/inventory-picker';
import { useToast } from '@/hooks/use-toast';
import { processRefundExchange } from '@/lib/actions/refund';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';


const PaymentInput = ({ label, icon: Icon, value, onChange, disabled }: { label: string, icon: React.ElementType, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled?: boolean }) => (
    <div>
        <Label className="block text-sm font-medium text-muted-foreground">{label}</Label>
        <div className="relative mt-1">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                type="number"
                value={value || ''}
                onChange={onChange}
                placeholder="0.00"
                className="py-2 pl-10 pr-4 text-md font-semibold"
                disabled={disabled}
            />
        </div>
    </div>
);


interface RefundWorkspaceProps {
    originalInvoice: InvoiceDetail;
    customer: Customer;
    inventory: Product[];
}

export function RefundWorkspace({ originalInvoice, customer, inventory }: RefundWorkspaceProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSaving, startSaving] = useTransition();
    
    const [returnedItems, setReturnedItems] = useState<InvoiceItem[]>([]);
    const [exchangeItems, setExchangeItems] = useState<InvoiceItem[]>([]);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    
    const [payments, setPayments] = useState({ cash: 0, card: 0 });

    const handlePaymentChange = (method: 'cash' | 'card', value: string) => {
        setPayments(prev => ({...prev, [method]: parseFloat(value) || 0 }));
    };

    const handleReturnToggle = (item: InvoiceItem, isReturning: boolean) => {
        setReturnedItems(prev => 
            isReturning ? [...prev, item] : prev.filter(i => i.id !== item.id)
        );
    };

    const handleAddExchangeItems = (selectedProducts: Product[]) => {
        const existingExchangeIds = new Set(exchangeItems.map(item => item.inventoryId));
        const newProducts = selectedProducts.filter(p => !existingExchangeIds.has(p.id));

        if (newProducts.length > 0) {
            const newItems: InvoiceItem[] = newProducts.map(product => ({
                id: `exchange-${product.id}`,
                productName: `${product.brand} ${product.model}`,
                description: `${product.imei} - ${product.storage}`,
                quantity: 1,
                unitPrice: product.price,
                total: product.price,
                isCustom: false,
                inventoryId: product.id,
            }));
            setExchangeItems(prev => [...prev, ...newItems]);
        }
        setIsPickerOpen(false);
        if (newProducts.length < selectedProducts.length) {
            toast({ title: "Some items were already in the exchange list."});
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
        setExchangeItems(prev => [...prev, newItem]);
    };

    const handleItemChange = (itemId: string, field: keyof InvoiceItem, value: string | number) => {
        setExchangeItems(prev => prev.map(item => {
        if (item.id === itemId) {
            const updatedItem = { ...item };
            const numValue = Number(value) || 0;
            
            if (field === 'productName') {
                updatedItem.productName = String(value);
            } else if (field === 'total') {
                updatedItem.total = numValue;
                updatedItem.unitPrice = numValue; // Assume quantity is 1 for custom items in this context
            }
            return updatedItem;
        }
        return item;
        }));
    };

    const totalCredit = useMemo(() => returnedItems.reduce((acc, item) => acc + item.total, 0), [returnedItems]);
    const exchangeTotal = useMemo(() => exchangeItems.reduce((acc, item) => acc + item.total, 0), [exchangeItems]);
    const finalBalance = useMemo(() => exchangeTotal - totalCredit, [exchangeTotal, totalCredit]);

    const handleFinalize = async () => {
        if (returnedItems.length === 0 && exchangeItems.length === 0) {
            toast({ title: 'No action to perform', description: 'Please select items to return or add items for exchange.', variant: 'destructive'});
            return;
        }

        startSaving(async () => {
            const result = await processRefundExchange({
                originalInvoice,
                returnedItems,
                exchangeItems,
                customer,
                paymentMade: payments.cash + payments.card,
            });

            if (result.success) {
                toast({ title: 'Success!', description: 'Refund/Exchange processed successfully.'});
                router.push(`/dashboard/customers/${customer.id}`);
            } else {
                toast({ title: 'Error', description: result.error || 'An unknown error occurred.', variant: 'destructive'});
            }
        });
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* --- Left Side: Return & Exchange Items --- */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Select Items to Return</CardTitle>
                             <CardDescription>From invoice {originalInvoice.invoiceNumber}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {originalInvoice.items.map(item => (
                                <label key={item.id} className={cn('p-3 flex items-center gap-4 rounded-lg cursor-pointer transition-all border-2', 
                                    returnedItems.some(r => r.id === item.id) 
                                    ? 'bg-destructive/10 border-destructive' 
                                    : 'bg-muted/50 border-transparent hover:border-primary'
                                )}>
                                    <Checkbox 
                                        checked={returnedItems.some(r => r.id === item.id)} 
                                        onCheckedChange={(checked) => handleReturnToggle(item, !!checked)} 
                                        className="h-5 w-5"
                                    />
                                    <div className="flex-grow">
                                        <p className="font-semibold">{item.productName}</p>
                                        <p className="text-xs text-muted-foreground">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.total)}</p>
                                    </div>
                                </label>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>2. Add Items for Exchange</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ItemTable 
                                items={exchangeItems} 
                                onRemove={(id) => setExchangeItems(prev => prev.filter(i => i.id !== id))}
                                onItemChange={handleItemChange}
                             />
                        </CardContent>
                        <CardFooter className="gap-2">
                             <Button variant="outline" onClick={handleAddCustomItem}>
                                <PlusCircle className="mr-2 h-4 w-4"/>
                                Add Custom Item
                            </Button>
                            <Button variant="outline" onClick={() => setIsPickerOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4"/>
                                Add From Inventory
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* --- Right Side: Finalize --- */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>3. Finalize Transaction</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div>
                                <h3 className="font-semibold text-muted-foreground mb-2">New Transaction Summary</h3>
                                <div className="space-y-2 border rounded-lg p-3">
                                    {exchangeItems.length === 0 && returnedItems.length === 0 && (
                                        <p className="text-center text-muted-foreground py-4">No items selected</p>
                                    )}
                                    {exchangeItems.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-card-foreground">
                                            <span>{item.productName || 'New Item'}</span>
                                            <span className="font-medium">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.total)}</span>
                                        </div>
                                    ))}
                                    {totalCredit > 0 && (
                                        <div className="flex justify-between items-center text-green-600 border-t border-dashed pt-2">
                                            <span className="font-medium flex items-center gap-2"><Tag className="h-4 w-4"/>Credit from Return</span>
                                            <span className="font-semibold">-{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalCredit)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="text-right pt-4 border-t-2 border-primary">
                                <p className="text-lg font-bold">{finalBalance >= 0 ? 'Final Amount Owed' : 'Refund Due'}</p>
                                <p className="text-4xl font-bold text-primary">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(finalBalance))}</p>
                            </div>
                            
                            {finalBalance > 0 && (
                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="font-semibold text-foreground">Record Payment</h3>
                                    <PaymentInput label="Cash Amount" icon={Banknote} value={payments.cash} onChange={(e) => handlePaymentChange('cash', e.target.value)} />
                                    <PaymentInput label="Card / Zelle Amount" icon={CreditCard} value={payments.card} onChange={(e) => handlePaymentChange('card', e.target.value)} />
                                </div>
                            )}

                            {finalBalance < 0 && (
                                <div className="pt-4 border-t">
                                    <h3 className="font-semibold text-foreground mb-2">Confirm Refund</h3>
                                    <p className="text-sm text-muted-foreground">Finalizing will create a refund record for the amount due to the customer.</p>
                                </div>
                            )}
                        </CardContent>
                         <CardFooter>
                            <Button className="w-full" size="lg" onClick={handleFinalize} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Finalize & Create Documents
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            <InventoryPicker 
                isOpen={isPickerOpen}
                onOpenChange={setIsPickerOpen}
                inventory={inventory.filter(p => p.status === 'Available')}
                onAddItems={handleAddExchangeItems}
            />
        </>
    );
}
