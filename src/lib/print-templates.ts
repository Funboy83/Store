// Print template utilities for repair invoices and estimates
import type { InvoiceDetail } from './types';

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