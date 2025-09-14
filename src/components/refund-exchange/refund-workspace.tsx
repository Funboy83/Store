
'use client';

import { useState, useMemo, useTransition } from 'react';
import type { InvoiceDetail, Customer, InvoiceItem, Product } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { ItemTable } from './item-table';
import { InventoryPicker } from '../invoices/inventory-picker';
import { useToast } from '@/hooks/use-toast';
import { processRefundExchange } from '@/lib/actions/refund';
import { useRouter } from 'next/navigation';

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

    const handleReturnToggle = (item: InvoiceItem, isReturning: boolean) => {
        setReturnedItems(prev => 
            isReturning ? [...prev, item] : prev.filter(i => i.id !== item.id)
        );
    };

    const handleAddExchangeItems = (selectedProducts: Product[]) => {
        const newItems: InvoiceItem[] = selectedProducts.map(product => ({
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
        setIsPickerOpen(false);
    };

    const handleRemoveExchangeItem = (itemId: string) => {
        setExchangeItems(prev => prev.filter(i => i.id !== itemId));
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
            // For now, we assume any positive balance is paid in cash.
            const paymentMade = finalBalance > 0 ? finalBalance : 0;
            
            const result = await processRefundExchange({
                originalInvoice,
                returnedItems,
                exchangeItems,
                customer,
                paymentMade,
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Select Items to Return</CardTitle>
                        <CardDescription>Select the items from the original invoice that are being returned.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {originalInvoice.items.map(item => (
                                <div key={item.id} className="flex items-center gap-4 p-3 border rounded-md">
                                    <Checkbox 
                                        id={`return-${item.id}`}
                                        onCheckedChange={(checked) => handleReturnToggle(item, !!checked)}
                                    />
                                    <label htmlFor={`return-${item.id}`} className="flex-1 grid grid-cols-3 items-center">
                                        <div>
                                            <p className="font-medium">{item.productName}</p>
                                            <p className="text-sm text-muted-foreground">{item.description}</p>
                                        </div>
                                        <p className="text-sm text-center">Qty: {item.quantity}</p>
                                        <p className="text-sm font-semibold text-right">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.total)}</p>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>2. Add New Items for Exchange (Optional)</CardTitle>
                        <CardDescription>If this is an exchange, add the new items the customer is receiving.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ItemTable items={exchangeItems} onRemove={handleRemoveExchangeItem} />
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" onClick={() => setIsPickerOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Add Items from Inventory
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <div className="lg:col-span-1">
                <Card className="sticky top-6">
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between text-lg">
                            <span className="text-muted-foreground">Total Credit from Returns</span>
                            <span className="font-semibold text-destructive">
                                -{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalCredit)}
                            </span>
                        </div>
                        <div className="flex justify-between text-lg">
                            <span className="text-muted-foreground">New Items Total</span>
                            <span className="font-semibold">
                                +{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(exchangeTotal)}
                            </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-2xl font-bold">
                            <span>Final Balance</span>
                            <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(finalBalance)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                            {finalBalance > 0 ? "Amount owed by customer." : "Amount to be refunded to customer."}
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" size="lg" onClick={handleFinalize} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Finalize & Create Documents
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <InventoryPicker 
                isOpen={isPickerOpen}
                onOpenChange={setIsPickerOpen}
                inventory={inventory.filter(p => p.status === 'Available')}
                onAddItems={handleAddExchangeItems}
            />
        </div>
    );
}

