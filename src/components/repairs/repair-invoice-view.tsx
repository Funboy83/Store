'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RepairJob, RepairInvoice } from '@/lib/types';
import { format } from 'date-fns';
import { Printer, Download, Mail, CheckCircle } from 'lucide-react';

interface RepairInvoiceViewProps {
  job: RepairJob;
  invoice?: RepairInvoice;
}

export function RepairInvoiceView({ job, invoice }: RepairInvoiceViewProps) {
  // Calculate totals
  const partsCost = job.usedParts.reduce((sum, part) => sum + part.total, 0);
  const laborCost = job.laborCost;
  const subtotal = partsCost + laborCost;
  const taxRate = 0.08; // 8% tax
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const handlePrint = () => {
    window.print();
  };

  const handleMarkAsPaid = () => {
    // TODO: Implement payment marking
    console.log('Marking job as paid:', job.id);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Invoice - {job.jobId}</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Email to Customer
          </Button>
          {!job.isPaid && (
            <Button onClick={handleMarkAsPaid}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Card */}
      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-8">
          {/* Company Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Phone Repair Studio</h1>
            <p className="text-muted-foreground">Professional Device Repair Services</p>
            <p className="text-sm text-muted-foreground">
              123 Main Street • City, State 12345 • (555) 000-0000
            </p>
          </div>

          <Separator className="my-6" />

          {/* Invoice Header */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">Bill To:</h3>
              <div className="space-y-1">
                <p className="font-medium">{job.customerName}</p>
                <p className="text-muted-foreground">{job.customerPhone}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground">Invoice #: </span>
                  <span className="font-medium">{job.jobId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date: </span>
                  <span>{format(new Date(), 'MMM dd, yyyy')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  <Badge variant={job.isPaid ? 'secondary' : 'destructive'}>
                    {job.isPaid ? 'PAID' : 'UNPAID'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Device Information */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4">Device Information</h3>
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <span className="text-muted-foreground">Device: </span>
                <span className="font-medium">{job.deviceMake} {job.deviceModel}</span>
              </div>
              {job.imei && (
                <div>
                  <span className="text-muted-foreground">IMEI: </span>
                  <span className="font-mono text-sm">{job.imei}</span>
                </div>
              )}
              <div className="md:col-span-2">
                <span className="text-muted-foreground">Problem: </span>
                <span>{job.problemDescription}</span>
              </div>
            </div>
          </div>

          {/* Services & Parts */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4">Services & Parts</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Description</th>
                    <th className="text-center py-3 px-2">Qty</th>
                    <th className="text-right py-3 px-2">Unit Price</th>
                    <th className="text-right py-3 px-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Labor */}
                  <tr className="border-b">
                    <td className="py-3 px-2">
                      <div>
                        <div className="font-medium">Repair Labor</div>
                        <div className="text-sm text-muted-foreground">
                          Professional device repair service
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">1</td>
                    <td className="text-right py-3 px-2">${laborCost.toFixed(2)}</td>
                    <td className="text-right py-3 px-2">${laborCost.toFixed(2)}</td>
                  </tr>

                  {/* Parts */}
                  {job.usedParts.map((part, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-2">
                        <div className="font-medium">{part.partName}</div>
                      </td>
                      <td className="text-center py-3 px-2">{part.quantity}</td>
                      <td className="text-right py-3 px-2">${part.price.toFixed(2)}</td>
                      <td className="text-right py-3 px-2">${part.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (8%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          {job.isPaid ? (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center text-green-800">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Payment Received</span>
              </div>
              {job.paidAt && (
                <p className="text-sm text-green-700 mt-1">
                  Paid on {format(new Date(job.paidAt), 'MMM dd, yyyy')}
                  {job.paymentMethod && ` via ${job.paymentMethod}`}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Payment Terms:</strong> Payment is due upon pickup of device.
                We accept cash, check, and card payments.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>Thank you for choosing Phone Repair Studio!</p>
            <p className="mt-1">
              Questions about this invoice? Contact us at (555) 000-0000 or info@phonerepair.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}