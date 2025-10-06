'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { InvoiceDetail } from '@/lib/types';
import { generatePuppeteerPrintTemplate } from '@/lib/print-templates';

interface PdfDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceDetail;
}

export function PdfDownloadModal({ isOpen, onClose, invoice }: PdfDownloadModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    
    try {
      // Generate the HTML template
      const htmlContent = generatePuppeteerPrintTemplate(invoice);
      
      // Call our API to generate PDF
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceData: invoice,
          htmlContent: htmlContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      onClose();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = () => {
    // Generate preview HTML in a new window
    const htmlContent = generatePuppeteerPrintTemplate(invoice);
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Invoice PDF</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Generate a high-quality PDF of invoice #{invoice.invoiceNumber} for {invoice.customer.name}.
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handlePreview}
              variant="outline"
              className="w-full"
            >
              Preview Invoice
            </Button>
            
            <Button 
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            PDF will be generated using Puppeteer for high-quality output.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}