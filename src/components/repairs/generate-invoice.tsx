'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { generateRepairInvoice } from '@/lib/actions/repair-jobs';
import { printRepairInvoice, InvoicePrintData } from '@/lib/print-templates';
import { Receipt, CreditCard, DollarSign, Smartphone, Printer } from 'lucide-react';
import { RepairJob } from '@/lib/types';

interface GenerateInvoiceDialogProps {
  job: RepairJob;
  onInvoiceGenerated?: () => void;
}

export function GenerateInvoiceDialog({ job, onInvoiceGenerated }: GenerateInvoiceDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'zelle' | 'venmo'>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const { toast } = useToast();

  // Calculate costs
  const partsCost = job.usedParts?.reduce((total, part) => total + (part.price * part.quantity), 0) || 0;
  const laborCost = job.laborCost || 0;
  const totalAmount = partsCost + laborCost;
  const profit = totalAmount - partsCost; // Labor is profit

  // Check if job is ready for invoice
  const canGenerateInvoice = job.status === 'Ready for Pickup';

  const handleGenerateInvoice = async () => {
    setIsGenerating(true);

    try {
      let paymentData: {
        paymentMethod: 'cash' | 'credit_card' | 'zelle' | 'venmo';
        cashAmount?: number;
        cardAmount?: number;
      } = { paymentMethod };

      // Validate and set payment amounts based on method
      if (paymentMethod === 'cash') {
        const cash = parseFloat(cashAmount) || 0;
        if (cash < totalAmount) {
          toast({
            title: 'Invalid Payment',
            description: `Cash amount must be at least $${totalAmount.toFixed(2)}`,
            variant: 'destructive',
          });
          return;
        }
        paymentData.cashAmount = cash;
      } else if (paymentMethod === 'credit_card') {
        const card = parseFloat(cardAmount) || 0;
        if (card < totalAmount) {
          toast({
            title: 'Invalid Payment',
            description: `Card amount must be at least $${totalAmount.toFixed(2)}`,
            variant: 'destructive',
          });
          return;
        }
        paymentData.cardAmount = card;
      } else {
        // For Zelle/Venmo, assume full amount is paid
        paymentData.cashAmount = totalAmount;
      }

      const result = await generateRepairInvoice(job.id, paymentData);

      if (result.success) {
        // Print the invoice
        const printData: InvoicePrintData = {
          jobId: job.jobId,
          invoiceNumber: result.invoiceId || 'N/A',
          customerName: job.customerName,
          customerPhone: job.customerPhone,
          deviceInfo: `${job.deviceMake} ${job.deviceModel}`,
          problemDescription: job.problemDescription,
          laborCost: laborCost,
          partsCost: partsCost,
          totalAmount: totalAmount,
          paymentMethod: paymentMethod,
          paidAmount: (paymentData.cashAmount || 0) + (paymentData.cardAmount || 0),
          profit: profit,
          createdAt: new Date().toISOString(),
          usedParts: job.usedParts?.map(part => ({
            partName: part.partName,
            quantity: part.quantity,
            cost: part.price,
            total: part.price * part.quantity,
          })) || []
        };
        
        printRepairInvoice(printData);
        
        toast({
          title: 'Invoice Generated!',
          description: `Invoice created successfully. Job marked as completed.`,
        });
        setIsOpen(false);
        onInvoiceGenerated?.();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to generate invoice',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="sm"
          disabled={!canGenerateInvoice}
          className="bg-green-600 hover:bg-green-700"
        >
          <Receipt className="h-4 w-4 mr-2" />
          Generate Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Generate Invoice - {job.jobId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Job Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  <p className="text-sm">{job.customerName}</p>
                  <p className="text-xs text-muted-foreground">{job.customerPhone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Device</Label>
                  <p className="text-sm">{job.deviceMake} {job.deviceModel}</p>
                  <Badge variant="outline" className="mt-1">{job.status}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Problem</Label>
                <p className="text-sm text-muted-foreground">{job.problemDescription}</p>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Labor Cost</span>
                <span className="font-mono">${laborCost.toFixed(2)}</span>
              </div>
              
              {job.usedParts && job.usedParts.length > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Parts Price</span>
                    <span className="font-mono">${partsCost.toFixed(2)}</span>
                  </div>
                  <div className="ml-4 space-y-1 text-sm text-muted-foreground">
                    {job.usedParts.map((part, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{part.partName} (x{part.quantity})</span>
                        <span>${(part.price * part.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount Due</span>
                <span className="font-mono">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Estimated Profit</span>
                <span className="font-mono">${profit.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cash
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit_card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Credit Card
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="zelle" id="zelle" />
                  <Label htmlFor="zelle" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Zelle
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="venmo" id="venmo" />
                  <Label htmlFor="venmo" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Venmo
                  </Label>
                </div>
              </RadioGroup>

              {/* Payment Amount Inputs */}
              {paymentMethod === 'cash' && (
                <div>
                  <Label htmlFor="cashAmount">Cash Amount</Label>
                  <Input
                    id="cashAmount"
                    type="number"
                    step="0.01"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder={`Minimum: $${totalAmount.toFixed(2)}`}
                  />
                </div>
              )}

              {paymentMethod === 'credit_card' && (
                <div>
                  <Label htmlFor="cardAmount">Card Amount</Label>
                  <Input
                    id="cardAmount"
                    type="number"
                    step="0.01"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    placeholder={`Amount: $${totalAmount.toFixed(2)}`}
                  />
                </div>
              )}

              {(paymentMethod === 'zelle' || paymentMethod === 'venmo') && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Payment of ${totalAmount.toFixed(2)} will be recorded as received via {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateInvoice}
              disabled={isGenerating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                'Generating...'
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  Generate & Print Invoice
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface InvoiceButtonProps {
  job: RepairJob;
  onInvoiceGenerated?: () => void;
}

export function InvoiceButton({ job, onInvoiceGenerated }: InvoiceButtonProps) {
  const canGenerateInvoice = job.status === 'Ready for Pickup';

  if (!canGenerateInvoice) {
    return null;
  }

  return (
    <GenerateInvoiceDialog job={job} onInvoiceGenerated={onInvoiceGenerated} />
  );
}