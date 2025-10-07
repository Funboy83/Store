// Print template utilities for repair invoices and estimates
import type { InvoiceDetail } from './types';

// Type for repair job invoice printing
export interface InvoicePrintData {
  jobId: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  deviceInfo: string;
  problemDescription: string;
  laborCost: number; // This will be servicesCost
  partsCost: number;
  totalAmount: number;
  paymentMethod: string;
  paidAmount: number;
  profit: number;
  createdAt: string;
  usedParts: Array<{
    partName: string;
    quantity: number;
    cost: number;
    total: number;
  }>;
  usedServices?: Array<{
    serviceName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

// Type for repair job estimate printing
export interface EstimatePrintData {
  jobId: string;
  customerName: string;
  customerPhone: string;
  deviceMake: string;
  deviceModel: string;
  imei?: string;
  serialNumber?: string;
  problemDescription: string;
  deviceConditions?: string[];
  estimatedCost: number;
  priority: string;
  createdAt: string;
  estimatedCompletion: string;
}

// Puppeteer-optimized print template
export function generatePuppeteerPrintTemplate(data: InvoiceDetail): string {
  const currentDate = new Date().toLocaleDateString();
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${data.invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
        }
        
        .company-info h1 {
            color: #2563eb;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .company-info p {
            color: #666;
            font-size: 12px;
            line-height: 1.5;
        }
        
        .invoice-info {
            text-align: right;
        }
        
        .invoice-info h2 {
            color: #333;
            font-size: 18px;
            margin-bottom: 10px;
        }
        
        .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .section {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #2563eb;
        }
        
        .section h3 {
            color: #2563eb;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        
        .section p {
            margin-bottom: 4px;
            font-size: 12px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: white;
            border: 1px solid #e2e8f0;
        }
        
        .items-table th,
        .items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
        }
        
        .items-table th {
            background: #f1f5f9;
            font-weight: 600;
            color: #475569;
        }
        
        .items-table .text-right {
            text-align: right;
        }
        
        .total-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }
        
        .total-table {
            width: 300px;
        }
        
        .total-table tr td {
            padding: 8px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
        }
        
        .total-table tr:last-child td {
            font-weight: bold;
            font-size: 14px;
            background: #f1f5f9;
            border-bottom: 2px solid #2563eb;
        }
        
        .payment-info {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        
        .payment-info h3 {
            color: #2563eb;
            margin-bottom: 10px;
            font-size: 14px;
        }
        
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #666;
            font-size: 11px;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .invoice-container {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <header class="header">
            <div class="company-info">
                <h1>CellSmart</h1>
                <p>Phone Repair & Sales<br>
                123 Main Street<br>
                City, State 12345<br>
                Phone: (555) 123-4567<br>
                Email: info@cellsmart.com</p>
            </div>
            <div class="invoice-info">
                <h2>INVOICE</h2>
                <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
                <p><strong>Date:</strong> ${currentDate}</p>
                <p><strong>Invoice ID:</strong> ${data.id || 'N/A'}</p>
            </div>
        </header>

        <div class="invoice-details">
            <div class="section">
                <h3>Bill To:</h3>
                <p><strong>${data.customer.name}</strong></p>
                <p>${data.customer.phone}</p>
                ${data.customer.email ? `<p>${data.customer.email}</p>` : ''}
                ${data.customer.address ? `<p>${data.customer.address}</p>` : ''}
            </div>
            
            <div class="section">
                <h3>Invoice Details:</h3>
                <p><strong>Total Amount:</strong> ${formatCurrency(data.total)}</p>
                <p><strong>Subtotal:</strong> ${formatCurrency(data.subtotal)}</p>
                <p><strong>Tax:</strong> ${formatCurrency(data.tax)}</p>
                ${data.discount ? `<p><strong>Discount:</strong> ${formatCurrency(data.discount)}</p>` : ''}
                <p><strong>Status:</strong> ${data.status}</p>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.map(item => `
                    <tr>
                        <td>
                            <strong>${item.productName}</strong>
                            ${item.description ? `<br><small>${item.description}</small>` : ''}
                        </td>
                        <td>${item.quantity}</td>
                        <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                        <td class="text-right">${formatCurrency(item.total)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="total-section">
            <table class="total-table">
                <tr>
                    <td>Subtotal:</td>
                    <td class="text-right">${formatCurrency(data.subtotal)}</td>
                </tr>
                ${data.discount ? `
                <tr>
                    <td>Discount:</td>
                    <td class="text-right">-${formatCurrency(data.discount)}</td>
                </tr>
                ` : ''}
                <tr>
                    <td>Tax:</td>
                    <td class="text-right">${formatCurrency(data.tax)}</td>
                </tr>
                <tr>
                    <td><strong>Total Amount:</strong></td>
                    <td class="text-right"><strong>${formatCurrency(data.total)}</strong></td>
                </tr>
            </table>
        </div>

        <div class="payment-info">
            <h3>Payment Information</h3>
            <p><strong>Amount Paid:</strong> ${formatCurrency(data.amountPaid)}</p>
            <p><strong>Status:</strong> ${data.status}</p>
            ${data.amountPaid < data.total ? 
                `<p><strong>Balance Due:</strong> ${formatCurrency(data.total - data.amountPaid)}</p>` 
                : '<p><strong>Status:</strong> Paid in Full</p>'
            }
            ${data.payments && data.payments.length > 0 ? `
                <div class="mt-3">
                    <strong>Payment History:</strong>
                    ${data.payments.map(payment => `
                        <p class="text-sm">Payment on ${new Date(payment.paymentDate).toLocaleDateString()}: ${formatCurrency(payment.amountPaid)}</p>
                    `).join('')}
                </div>
            ` : ''}
        </div>

        <footer class="footer">
            <p>Thank you for choosing CellSmart!</p>
            <p>This invoice was generated on ${currentDate}</p>
        </footer>
    </div>
</body>
</html>
  `;
}

// Function to print repair job invoice
export function printRepairInvoice(data: InvoicePrintData): void {
  const currentDate = new Date().toLocaleDateString();
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const printContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Repair Invoice - Job ${data.jobId}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
        }
        
        .header h1 {
            color: #2563eb;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .header h2 {
            color: #666;
            font-size: 18px;
            font-weight: normal;
        }
        
        .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .customer-info, .job-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }
        
        .customer-info h3, .job-info h3 {
            color: #2563eb;
            margin-bottom: 15px;
            font-size: 16px;
        }
        
        .info-row {
            margin-bottom: 8px;
        }
        
        .info-label {
            font-weight: bold;
            display: inline-block;
            width: 120px;
        }
        
        .services-section {
            margin-bottom: 30px;
        }
        
        .services-section h3 {
            color: #2563eb;
            margin-bottom: 15px;
            font-size: 18px;
        }
        
        .services-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .services-table th, .services-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        .services-table th {
            background-color: #2563eb;
            color: white;
            font-weight: bold;
        }
        
        .services-table .text-right {
            text-align: right;
        }
        
        .total-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .total-row.final {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #2563eb;
            padding-top: 10px;
            margin-top: 10px;
        }
        
        .payment-info {
            background: #e7f3ff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .payment-info h3 {
            color: #2563eb;
            margin-bottom: 15px;
        }
        
        .footer {
            text-align: center;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        
        @media print {
            body {
                font-size: 12px;
            }
            .invoice-container {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <h1>CellSmart Repair Invoice</h1>
            <h2>Invoice #${data.invoiceNumber}</h2>
        </div>

        <div class="invoice-details">
            <div class="customer-info">
                <h3>Customer Information</h3>
                <div class="info-row">
                    <span class="info-label">Name:</span>
                    <span>${data.customerName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span>${data.customerPhone}</span>
                </div>
            </div>
            
            <div class="job-info">
                <h3>Job Information</h3>
                <div class="info-row">
                    <span class="info-label">Job ID:</span>
                    <span>${data.jobId}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Device:</span>
                    <span>${data.deviceInfo}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Date:</span>
                    <span>${currentDate}</span>
                </div>
            </div>
        </div>

        <div class="services-section">
            <h3>Problem Description</h3>
            <p style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                ${data.problemDescription}
            </p>
        </div>

        <div class="services-section">
            <h3>Services & Parts</h3>
            <table class="services-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.usedServices && data.usedServices.length > 0 ? 
                        data.usedServices.map(service => `
                            <tr>
                                <td><strong>${service.serviceName}</strong></td>
                                <td>${service.quantity}</td>
                                <td class="text-right">${formatCurrency(service.price)}</td>
                                <td class="text-right">${formatCurrency(service.total)}</td>
                            </tr>
                        `).join('') : 
                        (data.laborCost > 0 ? `
                            <tr>
                                <td><strong>Labor & Service</strong></td>
                                <td>1</td>
                                <td class="text-right">${formatCurrency(data.laborCost)}</td>
                                <td class="text-right">${formatCurrency(data.laborCost)}</td>
                            </tr>
                        ` : '')
                    }
                    ${data.usedParts.map(part => `
                        <tr>
                            <td>${part.partName}</td>
                            <td>${part.quantity}</td>
                            <td class="text-right">${formatCurrency(part.cost)}</td>
                            <td class="text-right">${formatCurrency(part.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="total-section">
            <div class="total-row">
                <span>Services Cost:</span>
                <span>${formatCurrency(data.laborCost)}</span>
            </div>
            <div class="total-row">
                <span>Parts Cost:</span>
                <span>${formatCurrency(data.partsCost)}</span>
            </div>
            <div class="total-row final">
                <span>Total Amount:</span>
                <span>${formatCurrency(data.totalAmount)}</span>
            </div>
        </div>

        <div class="payment-info">
            <h3>Payment Information</h3>
            <div class="info-row">
                <span class="info-label">Payment Method:</span>
                <span>${data.paymentMethod.charAt(0).toUpperCase() + data.paymentMethod.slice(1).replace('_', ' ')}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Amount Paid:</span>
                <span>${formatCurrency(data.paidAmount)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status:</span>
                <span><strong>PAID IN FULL</strong></span>
            </div>
        </div>

        <div class="footer">
            <p>Thank you for choosing CellSmart!</p>
            <p>Generated on ${currentDate}</p>
        </div>
    </div>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  // Open the print dialog
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    // Keep window open for now - user can close it manually
  };
}

// Print function for repair job estimates
export function printRepairEstimate(data: EstimatePrintData): void {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const formatCurrency = (amount: number) => amount.toFixed(2);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Repair Estimate - ${data.jobId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            font-size: 12px; 
            line-height: 1.4; 
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        .logo { 
            font-size: 24px; 
            font-weight: bold; 
            color: #4f46e5;
            margin-bottom: 5px;
        }
        .company-info { 
            font-size: 11px; 
            color: #666; 
        }
        .estimate-title {
            font-size: 18px;
            font-weight: bold;
            margin: 15px 0;
            text-align: center;
            background: #f8f9fa;
            padding: 10px;
            border: 1px solid #ddd;
        }
        .section { 
            margin-bottom: 20px; 
        }
        .section-title { 
            font-size: 14px; 
            font-weight: bold; 
            margin-bottom: 8px; 
            color: #4f46e5;
            border-bottom: 1px solid #ddd;
            padding-bottom: 3px;
        }
        .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
            margin-bottom: 15px;
        }
        .info-item {
            padding: 8px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
        }
        .info-label { 
            font-weight: bold; 
            display: block;
            margin-bottom: 3px;
            color: #666;
        }
        .cost-section {
            background: #e8f5e8;
            padding: 15px;
            border: 2px solid #28a745;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .cost-amount {
            font-size: 24px;
            font-weight: bold;
            color: #28a745;
            margin: 10px 0;
        }
        .conditions {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-top: 5px;
        }
        .condition-badge {
            background: #e9ecef;
            border: 1px solid #ced4da;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
        }
        .priority-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
        }
        .priority-urgent { background: #dc3545; color: white; }
        .priority-high { background: #fd7e14; color: white; }
        .priority-medium { background: #6c757d; color: white; }
        .priority-low { background: #28a745; color: white; }
        .terms {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .terms-title {
            font-weight: bold;
            color: #856404;
            margin-bottom: 10px;
        }
        .terms-list {
            list-style: disc;
            margin-left: 20px;
        }
        .terms-list li {
            margin-bottom: 3px;
            color: #856404;
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 15px; 
            border-top: 1px solid #ddd; 
            font-size: 10px; 
            color: #666; 
        }
        @media print {
            body { font-size: 11px; }
            .footer { margin-top: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📱 CellSmart</div>
            <div class="company-info">
                Professional Mobile Device Repair Services<br>
                Phone: (555) 123-4567 | Email: info@cellsmart.com
            </div>
        </div>

        <div class="estimate-title">REPAIR ESTIMATE</div>

        <div class="section">
            <div class="section-title">Job Information</div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Job ID:</span>
                    <strong>${data.jobId}</strong>
                </div>
                <div class="info-item">
                    <span class="info-label">Date Created:</span>
                    ${new Date(data.createdAt).toLocaleDateString()}
                </div>
                <div class="info-item">
                    <span class="info-label">Priority:</span>
                    <span class="priority-badge priority-${data.priority.toLowerCase()}">${data.priority}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Est. Completion:</span>
                    ${data.estimatedCompletion}
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Name:</span>
                    ${data.customerName}
                </div>
                <div class="info-item">
                    <span class="info-label">Phone:</span>
                    ${data.customerPhone}
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Device Information</div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Device:</span>
                    ${data.deviceMake} ${data.deviceModel}
                </div>
                ${data.imei ? `
                <div class="info-item">
                    <span class="info-label">IMEI:</span>
                    ${data.imei}
                </div>
                ` : ''}
                ${data.serialNumber ? `
                <div class="info-item">
                    <span class="info-label">Serial Number:</span>
                    ${data.serialNumber}
                </div>
                ` : ''}
            </div>
            
            <div class="info-item" style="margin-top: 10px;">
                <span class="info-label">Problem Description:</span>
                ${data.problemDescription}
            </div>

            ${data.deviceConditions && data.deviceConditions.length > 0 ? `
            <div class="info-item" style="margin-top: 10px;">
                <span class="info-label">Device Conditions:</span>
                <div class="conditions">
                    ${data.deviceConditions.map(condition => `
                        <span class="condition-badge">${condition}</span>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>

        <div class="cost-section">
            <div class="section-title" style="color: #28a745; border: none; margin-bottom: 5px;">Estimated Repair Cost</div>
            <div class="cost-amount">$${formatCurrency(data.estimatedCost)}</div>
            <div style="font-size: 11px; color: #666; font-style: italic;">
                *Final cost may vary ±20% based on parts availability and additional issues discovered during repair
            </div>
        </div>

        <div class="terms">
            <div class="terms-title">Terms & Conditions</div>
            <ul class="terms-list">
                <li>This estimate is valid for 30 days from the issue date</li>
                <li>50% deposit required to commence repair work</li>
                <li>Final price may vary ±20% from initial estimate</li>
                <li>Parts warranty: 90 days | Labor warranty: 30 days</li>
                <li>Device must be collected within 10 days of completion or storage fees apply</li>
                <li>We are not responsible for data loss during repair process</li>
                <li>Diagnostic fee applies and will be deducted from final repair cost</li>
            </ul>
        </div>

        <div class="footer">
            <p><strong>Thank you for choosing CellSmart!</strong></p>
            <p>Estimate generated on ${currentDate}</p>
            <p>Please bring this estimate when dropping off your device</p>
        </div>
    </div>
</body>
</html>
  `;

  // Create a new window for printing
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print();
    // Keep window open for now - user can close it manually
  };
}

// Thermal/compact printer template for repair invoices (58mm/80mm thermal printers)
export function printRepairInvoiceThermal(data: InvoicePrintData): void {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatCurrency = (amount: number) => amount.toFixed(2);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Receipt - ${data.jobId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Courier New', monospace; 
            font-size: 11px; 
            line-height: 1.3; 
            color: #000;
            width: 300px;
            margin: 0 auto;
            padding: 10px;
        }
        .center { text-align: center; }
        .left { text-align: left; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .large { font-size: 14px; }
        .medium { font-size: 12px; }
        .small { font-size: 9px; }
        .line { 
            border-top: 1px dashed #000; 
            margin: 8px 0; 
        }
        .double-line { 
            border-top: 2px solid #000; 
            margin: 8px 0; 
        }
        .row { 
            display: flex; 
            justify-content: space-between;
            margin-bottom: 2px;
        }
        .section { margin-bottom: 8px; }
        .header { margin-bottom: 10px; }
        .footer { margin-top: 10px; }
        @media print {
            body { width: 58mm; font-size: 10px; }
            .large { font-size: 12px; }
            .medium { font-size: 11px; }
        }
    </style>
</head>
<body>
    <div class="header center">
        <div class="large bold">📱 CELLSMART</div>
        <div class="small">Professional Repair Service</div>
        <div class="small">Tel: (555) 123-4567</div>
    </div>

    <div class="line"></div>

    <div class="section center">
        <div class="medium bold">REPAIR INVOICE</div>
        <div class="small">${currentDate} ${currentTime}</div>
    </div>

    <div class="line"></div>

    <div class="section">
        <div class="row">
            <span class="bold">Job #:</span>
            <span>${data.jobId}</span>
        </div>
        <div class="row">
            <span class="bold">Invoice:</span>
            <span>${data.invoiceNumber}</span>
        </div>
    </div>

    <div class="line"></div>

    <div class="section">
        <div class="bold">CUSTOMER:</div>
        <div>${data.customerName}</div>
        <div>${data.customerPhone}</div>
    </div>

    <div class="line"></div>

    <div class="section">
        <div class="bold">DEVICE:</div>
        <div>${data.deviceInfo}</div>
        <div class="small">${data.problemDescription}</div>
    </div>

    <div class="line"></div>

    <div class="section">
        <div class="bold">SERVICES:</div>
        ${data.usedServices && data.usedServices.length > 0 ? 
          data.usedServices.map(service => `
            <div class="row">
                <span>${service.quantity}x ${service.serviceName}</span>
                <span>$${formatCurrency(service.total)}</span>
            </div>
          `).join('') :
          `<div class="row">
               <span>Repair Service</span>
               <span>$${formatCurrency(data.laborCost)}</span>
           </div>`
        }
    </div>

    ${data.usedParts && data.usedParts.length > 0 ? `
    <div class="section">
        <div class="bold">PARTS:</div>
        ${data.usedParts.map(part => `
            <div class="row">
                <span>${part.quantity}x ${part.partName}</span>
                <span>$${formatCurrency(part.total)}</span>
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="double-line"></div>

    <div class="section">
        ${data.laborCost > 0 ? `
        <div class="row">
            <span>Labor:</span>
            <span>$${formatCurrency(data.laborCost)}</span>
        </div>
        ` : ''}
        ${data.partsCost > 0 ? `
        <div class="row">
            <span>Parts:</span>
            <span>$${formatCurrency(data.partsCost)}</span>
        </div>
        ` : ''}
        <div class="row bold large">
            <span>TOTAL:</span>
            <span>$${formatCurrency(data.totalAmount)}</span>
        </div>
    </div>

    <div class="line"></div>

    <div class="section">
        <div class="row">
            <span class="bold">Payment:</span>
            <span>${data.paymentMethod.toUpperCase()}</span>
        </div>
        <div class="row">
            <span class="bold">Amount Paid:</span>
            <span>$${formatCurrency(data.paidAmount)}</span>
        </div>
        <div class="row bold">
            <span>STATUS:</span>
            <span>PAID IN FULL</span>
        </div>
    </div>

    <div class="line"></div>

    <div class="footer center small">
        <div>WARRANTY:</div>
        <div>Parts: 90 Days | Labor: 30 Days</div>
        <div class="section">Thank you for choosing CellSmart!</div>
        <div>Please keep this receipt</div>
        <div>${currentDate}</div>
    </div>
</body>
</html>
  `;

  // Create a new window for printing
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print();
    // Keep window open for now - user can close it manually
  };
}