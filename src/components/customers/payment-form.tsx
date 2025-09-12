
'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Customer, Invoice } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { applyPayment } from '@/lib/actions/payment';
import { Loader2, StickyNote } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '../ui/textarea';


interface PaymentFormProps {
    customer: Customer;
    invoices: Invoice[];
}

export function PaymentForm({ customer, invoices }: PaymentFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSaving, startSavingTransition] = useTransition();

    const [cashAmount, setCashAmount] = useState(0);
    const [checkAmount, setCheckAmount] = useState(0);
    const [cardAmount, setCardAmount] = useState(0);
    const [notes, setNotes] = useState('');
    const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);


    const totalPaid = useMemo(() => cashAmount + checkAmount + cardAmount, [cashAmount, checkAmount, cardAmount]);
    const remainingDebt = useMemo(() => Math.max(0, customer.debt - totalPaid), [customer.debt, totalPaid]);

    const handleAmountChange = (setter: (value: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(Number(e.target.value) || 0);
    };

    const paymentAllocations = useMemo(() => {
        let paymentRemaining = totalPaid;
        const allocations = new Map<string, { applied: number, status: 'Paid' | 'Partial' | 'Unpaid' }>();

        for (const invoice of invoices) {
            const amountDueOnInvoice = invoice.total - (invoice.amountPaid || 0);
            if (paymentRemaining > 0 && amountDueOnInvoice > 0) {
                const amountToApply = Math.min(paymentRemaining, amountDueOnInvoice);
                const newTotalPaidOnInvoice = (invoice.amountPaid || 0) + amountToApply;
                
                let status: 'Paid' | 'Partial' | 'Unpaid' = invoice.status;
                if (newTotalPaidOnInvoice >= invoice.total) {
                    status = 'Paid';
                } else if (newTotalPaidOnInvoice > 0) {
                    status = 'Partial';
                }

                allocations.set(invoice.id, { applied: amountToApply, status });
                paymentRemaining -= amountToApply;
            } else {
                 allocations.set(invoice.id, { applied: 0, status: invoice.status as 'Paid' | 'Partial' | 'Unpaid' });
            }
        }
        return allocations;
    }, [totalPaid, invoices]);
    
    const handleSavePayment = () => {
        if (totalPaid <= 0) {
            toast({
                title: 'No Payment Entered',
                description: 'Please enter a payment amount.',
                variant: 'destructive',
            });
            return;
        }

        startSavingTransition(async () => {
            const result = await applyPayment({
                customerId: customer.id,
                cashAmount,
                checkAmount,
                cardAmount,
                notes,
            });

            if (result.success) {
                toast({
                    title: 'Payment Applied!',
                    description: `Successfully applied ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalPaid)}.`,
                });
                router.push(`/dashboard/customers/${customer.id}`);
            } else {
                toast({
                    title: 'Error Applying Payment',
                    description: result.error || 'An unknown error occurred.',
                    variant: 'destructive',
                });
            }
        });
    }

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Allocate Payments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Issue Date</TableHead>
                                        <TableHead>Invoice #</TableHead>
                                        <TableHead>Amount Due</TableHead>
                                        <TableHead>Payment Applied</TableHead>
                                        <TableHead>New Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">
                                                No outstanding invoices.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        invoices.map(invoice => {
                                            const allocation = paymentAllocations.get(invoice.id) || { applied: 0, status: invoice.status };
                                            const amountDue = invoice.total - (invoice.amountPaid || 0);

                                            const isFullyPaid = allocation.status === 'Paid';
                                            
                                            return (
                                                <TableRow key={invoice.id} className={cn(isFullyPaid && 'bg-green-100/50')}>
                                                    <TableCell>{invoice.issueDate}</TableCell>
                                                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                                    <TableCell>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountDue)}</TableCell>
                                                    <TableCell className={cn(allocation.applied > 0 && "font-bold text-primary")}>
                                                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(allocation.applied)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={allocation.status === 'Paid' ? 'default' : allocation.status === 'Partial' ? 'secondary' : 'destructive'}>
                                                            {allocation.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{customer.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">Outstanding Debt</p>
                                <p className="text-4xl font-bold text-destructive">
                                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(customer.debt)}
                                </p>
                            </div>
                            <Separator />
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">Remaining Debt After Payment</p>
                                <p className="text-4xl font-bold text-green-600">
                                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(remainingDebt)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Enter Payment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 items-center gap-4">
                                <Label htmlFor="cash-amount">Cash Amount</Label>
                                <Input id="cash-amount" type="number" placeholder="0.00" value={cashAmount || ''} onChange={handleAmountChange(setCashAmount)} />
                            </div>
                            <div className="grid grid-cols-2 items-center gap-4">
                                <Label htmlFor="check-amount">Check Amount</Label>
                                <Input id="check-amount" type="number" placeholder="0.00" value={checkAmount || ''} onChange={handleAmountChange(setCheckAmount)} />
                            </div>
                            <div className="grid grid-cols-2 items-center gap-4">
                                <Label htmlFor="card-amount">Card/Zelle/Wire</Label>
                                <Input id="card-amount" type="number" placeholder="0.00" value={cardAmount || ''} onChange={handleAmountChange(setCardAmount)} />
                            </div>
                             <Button variant="outline" className="w-full" onClick={() => setIsNoteDialogOpen(true)}>
                                <StickyNote className="mr-2 h-4 w-4" />
                                {notes ? 'Edit Note' : 'Add Note'}
                            </Button>
                            {notes && <p className="text-sm text-muted-foreground p-2 bg-muted rounded-md truncate">Note: {notes}</p>}
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total Amount Paid</span>
                                <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalPaid)}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" disabled={isSaving || totalPaid <= 0} onClick={handleSavePayment}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving ? 'Saving...' : 'Save Payment'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
             <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add a Note</DialogTitle>
                        <DialogDescription>
                            Add any relevant notes for this payment transaction.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Customer paid in cash, mentioned they will pay the rest next week."
                        rows={5}
                    />
                    <DialogFooter>
                        <Button onClick={() => setIsNoteDialogOpen(false)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
