'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { printRepairEstimate, EstimatePrintData } from '@/lib/print-templates';
import { Printer, Receipt, FileText, Clock } from 'lucide-react';
import { RepairJob } from '@/lib/types';

interface PrintEstimateDialogProps {
  job: RepairJob;
  onEstimatePrinted?: () => void;
}

export function PrintEstimateDialog({ job, onEstimatePrinted }: PrintEstimateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const { toast } = useToast();

  const handlePrintEstimate = async () => {
    setIsPrinting(true);

    try {
      // Calculate estimated completion time (assuming 3-5 business days)
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + 4); // 4 business days
      const estimatedCompletion = estimatedDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      const printData: EstimatePrintData = {
        jobId: job.jobId,
        customerName: job.customerName,
        customerPhone: job.customerPhone,
        deviceMake: job.deviceMake,
        deviceModel: job.deviceModel,
        imei: job.imei || undefined,
        serialNumber: job.serialNumber || undefined,
        problemDescription: job.problemDescription,
        deviceConditions: job.deviceConditions,
        estimatedCost: job.estimatedCost,
        priority: job.priority || 'Medium',
        createdAt: job.createdAt,
        estimatedCompletion: estimatedCompletion,
      };
      
      printRepairEstimate(printData);
      
      toast({
        title: 'Estimate Printed!',
        description: `Repair estimate for Job ${job.jobId} has been sent to printer.`,
      });
      setIsOpen(false);
      onEstimatePrinted?.();
    } catch (error) {
      console.error('Error printing estimate:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while printing',
        variant: 'destructive',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
          <Receipt className="h-4 w-4 mr-2" />
          Print Estimate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Print Repair Estimate - {job.jobId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Summary Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Estimate Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer</label>
                  <p className="text-sm font-medium">{job.customerName}</p>
                  <p className="text-xs text-muted-foreground">{job.customerPhone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Device</label>
                  <p className="text-sm font-medium">{job.deviceMake} {job.deviceModel}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={
                      job.priority === 'Urgent' ? 'destructive' : 
                      job.priority === 'High' ? 'default' : 
                      'secondary'
                    }>
                      {job.priority || 'Medium'}
                    </Badge>
                    <Badge variant="outline">{job.status}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Problem Description</label>
                <p className="text-sm mt-1">{job.problemDescription}</p>
              </div>

              {job.deviceConditions && job.deviceConditions.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Device Conditions</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.deviceConditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Estimated Cost:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${job.estimatedCost.toFixed(2)}
                </span>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Final cost may vary based on parts availability and additional issues</p>
                <p>• Estimate includes diagnostic fee which is applied to final repair cost</p>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="h-3 w-3" />
                  <span>Estimated completion: 3-5 business days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions Preview */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-amber-800">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-700 space-y-1">
              <p>• Estimate valid for 30 days from issue date</p>
              <p>• 50% deposit required to commence repair work</p>
              <p>• Final price may vary ±20% from initial estimate</p>
              <p>• Parts warranty: 90 days | Labor warranty: 30 days</p>
              <p>• Device must be collected within 10 days or storage fees apply</p>
              <p>• We are not responsible for data loss during repair</p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePrintEstimate}
              disabled={isPrinting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPrinting ? (
                'Printing...'
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Estimate for Customer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface EstimateButtonProps {
  job: RepairJob;
  onEstimatePrinted?: () => void;
}

export function EstimateButton({ job, onEstimatePrinted }: EstimateButtonProps) {
  return (
    <PrintEstimateDialog job={job} onEstimatePrinted={onEstimatePrinted} />
  );
}