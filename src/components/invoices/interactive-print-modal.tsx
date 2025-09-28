'use client';

import { useEffect, useState, useCallback } from 'react';
import type { InvoiceDetail } from '@/lib/types';
import { generateInteractivePrintTemplate } from '@/lib/print-templates';

interface InteractivePrintModalProps {
  invoice: InvoiceDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InteractivePrintModal({ invoice, isOpen, onClose }: InteractivePrintModalProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    if (isOpen && invoice) {
      // Generate the interactive HTML template
      const content = generateInteractivePrintTemplate(invoice);
      setHtmlContent(content);
    }
  }, [isOpen, invoice]);

  const openInteractivePrint = useCallback(() => {
    if (!invoice) return;
    
    const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
    }
    onClose();
  }, [invoice, htmlContent, onClose]);

  if (!invoice) return null;

  // Auto-open in new window when modal opens
  useEffect(() => {
    if (isOpen && htmlContent) {
      openInteractivePrint();
    }
  }, [isOpen, htmlContent, openInteractivePrint]);

  return null; // This component just triggers the window opening
}