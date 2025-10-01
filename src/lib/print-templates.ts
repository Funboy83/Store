// Print template utilities for repair invoices and estimates
import type { InvoiceDetail } from './types';

export interface InvoicePrintData {
  jobId: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  deviceInfo: string;
  problemDescription: string;
  laborCost: number;
  partsCost: number;
  totalAmount: number;
  paymentMethod: string;
  paidAmount: number;
  profit: number;
  createdAt: string;
  usedParts?: Array<{
    partName: string;
    quantity: number;
    cost: number;
    total: number;
  }>;
}

export interface EstimatePrintData {
  jobId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deviceMake: string;
  deviceModel: string;
  imei?: string;
  serialNumber?: string;
  problemDescription: string;
  deviceConditions: string[];
  estimatedCost: number;
  priority: string;
  createdAt: string;
  estimatedCompletion?: string;
}

export function generatePrintTemplate(data: InvoicePrintData): string {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Repair Invoice - ${data.jobId}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            max-width: 300px;
            margin: 0 auto;
            padding: 10px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .invoice-title {
            font-size: 14px;
            font-weight: bold;
            margin: 10px 0;
        }
        .section {
            margin: 15px 0;
        }
        .line-item {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
        }
        .total-line {
            border-top: 1px solid #000;
            border-bottom: 2px solid #000;
            font-weight: bold;
            padding: 5px 0;
            margin: 10px 0;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            border-top: 1px solid #000;
            padding-top: 10px;
            font-size: 10px;
        }
        .dashed-line {
            border-top: 1px dashed #000;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">CELLSMART REPAIR</div>
        <div>Phone Repair & Services</div>
        <div>📞 (123) 456-7890</div>
    </div>

    <div class="invoice-title">REPAIR INVOICE</div>
    
    <div class="section">
        <div><strong>Job ID:</strong> ${data.jobId}</div>
        <div><strong>Invoice #:</strong> ${data.invoiceNumber}</div>
        <div><strong>Date:</strong> ${currentDate} ${currentTime}</div>
    </div>

    <div class="dashed-line"></div>

    <div class="section">
        <div><strong>CUSTOMER INFORMATION</strong></div>
        <div>Name: ${data.customerName}</div>
        <div>Phone: ${data.customerPhone}</div>
    </div>

    <div class="dashed-line"></div>

    <div class="section">
        <div><strong>DEVICE INFORMATION</strong></div>
        <div>Device: ${data.deviceInfo}</div>
        <div>Issue: ${data.problemDescription}</div>
    </div>

    <div class="dashed-line"></div>

    <div class="section">
        <div><strong>SERVICES & PARTS</strong></div>
        
        <div class="line-item">
            <span>Labor/Service</span>
            <span>$${data.laborCost.toFixed(2)}</span>
        </div>

        ${data.usedParts && data.usedParts.length > 0 ? `
            ${data.usedParts.map(part => `
                <div class="line-item">
                    <span>${part.partName} (${part.quantity}x)</span>
                    <span>$${part.total.toFixed(2)}</span>
                </div>
            `).join('')}
        ` : ''}

        <div class="dashed-line"></div>
        
        <div class="line-item">
            <span>Subtotal:</span>
            <span>$${data.totalAmount.toFixed(2)}</span>
        </div>
        
        <div class="line-item">
            <span>Tax:</span>
            <span>$0.00</span>
        </div>
        
        <div class="line-item total-line">
            <span>TOTAL:</span>
            <span>$${data.totalAmount.toFixed(2)}</span>
        </div>
    </div>

    <div class="section">
        <div><strong>PAYMENT INFORMATION</strong></div>
        <div class="line-item">
            <span>Payment Method:</span>
            <span>${data.paymentMethod.toUpperCase().replace('_', ' ')}</span>
        </div>
        <div class="line-item">
            <span>Amount Paid:</span>
            <span>$${data.paidAmount.toFixed(2)}</span>
        </div>
        ${data.paidAmount > data.totalAmount ? `
            <div class="line-item">
                <span>Change Due:</span>
                <span>$${(data.paidAmount - data.totalAmount).toFixed(2)}</span>
            </div>
        ` : ''}
    </div>

    <div class="footer">
        <div>Thank you for choosing CellSmart!</div>
        <div>Repair completed on ${currentDate}</div>
        <div class="dashed-line"></div>
        <div>⭐ Please leave us a review! ⭐</div>
    </div>

    <script>
        // Auto print when page loads
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>
  `;
}

export function printRepairInvoice(data: InvoicePrintData) {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (printWindow) {
    printWindow.document.write(generatePrintTemplate(data));
    printWindow.document.close();
    printWindow.focus();
  }
}

export function generateEstimateTemplate(data: EstimatePrintData): string {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Repair Estimate - ${data.jobId}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            max-width: 300px;
            margin: 0 auto;
            padding: 10px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .estimate-title {
            font-size: 14px;
            font-weight: bold;
            margin: 10px 0;
        }
        .section {
            margin: 15px 0;
        }
        .line-item {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
        }
        .estimate-line {
            border-top: 1px solid #000;
            border-bottom: 2px solid #000;
            font-weight: bold;
            padding: 5px 0;
            margin: 10px 0;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            border-top: 1px solid #000;
            padding-top: 10px;
            font-size: 10px;
        }
        .dashed-line {
            border-top: 1px dashed #000;
            margin: 10px 0;
        }
        .terms {
            font-size: 10px;
            margin-top: 15px;
            padding: 5px;
            border: 1px solid #000;
        }
        .priority-badge {
            display: inline-block;
            padding: 2px 6px;
            border: 1px solid #000;
            font-size: 10px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">CELLSMART REPAIR</div>
        <div>Phone Repair & Services</div>
        <div>📞 (123) 456-7890</div>
        <div>📧 info@cellsmartrepair.com</div>
    </div>

    <div class="estimate-title">REPAIR ESTIMATE</div>
    
    <div class="section">
        <div><strong>Job ID:</strong> ${data.jobId}</div>
        <div><strong>Date:</strong> ${currentDate} ${currentTime}</div>
        <div><strong>Priority:</strong> <span class="priority-badge">${data.priority.toUpperCase()}</span></div>
    </div>

    <div class="dashed-line"></div>

    <div class="section">
        <div><strong>CUSTOMER INFORMATION</strong></div>
        <div>Name: ${data.customerName}</div>
        <div>Phone: ${data.customerPhone}</div>
        ${data.customerEmail ? `<div>Email: ${data.customerEmail}</div>` : ''}
    </div>

    <div class="dashed-line"></div>

    <div class="section">
        <div><strong>DEVICE INFORMATION</strong></div>
        <div>Make: ${data.deviceMake}</div>
        <div>Model: ${data.deviceModel}</div>
        ${data.imei ? `<div>IMEI: ${data.imei}</div>` : ''}
        ${data.serialNumber ? `<div>Serial: ${data.serialNumber}</div>` : ''}
    </div>

    <div class="dashed-line"></div>

    <div class="section">
        <div><strong>DEVICE CONDITIONS</strong></div>
        ${data.deviceConditions.map(condition => `<div>• ${condition}</div>`).join('')}
    </div>

    <div class="dashed-line"></div>

    <div class="section">
        <div><strong>PROBLEM DESCRIPTION</strong></div>
        <div>${data.problemDescription}</div>
    </div>

    <div class="dashed-line"></div>

    <div class="section">
        <div><strong>REPAIR ESTIMATE</strong></div>
        <div class="line-item estimate-line">
            <span>Estimated Total:</span>
            <span>$${data.estimatedCost.toFixed(2)}</span>
        </div>
        <div style="font-size: 10px; font-style: italic; margin-top: 5px;">
            *Final cost may vary based on parts availability and additional issues discovered during repair
        </div>
    </div>

    ${data.estimatedCompletion ? `
        <div class="section">
            <div><strong>ESTIMATED COMPLETION</strong></div>
            <div>${data.estimatedCompletion}</div>
        </div>
    ` : ''}

    <div class="terms">
        <div><strong>TERMS & CONDITIONS</strong></div>
        <div>• Estimate valid for 30 days</div>
        <div>• 50% deposit required to start repair</div>
        <div>• Final price may vary ±20% from estimate</div>
        <div>• Parts warranty: 90 days</div>
        <div>• Labor warranty: 30 days</div>
        <div>• Device pickup within 10 days or storage fees apply</div>
        <div>• We are not responsible for data loss</div>
    </div>

    <div class="footer">
        <div>Thank you for choosing CellSmart!</div>
        <div>Keep this estimate for your records</div>
        <div class="dashed-line"></div>
        <div>📞 Call us for status updates!</div>
    </div>

    <script>
        // Auto print when page loads
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>
  `;
}

export function printRepairEstimate(data: EstimatePrintData) {
  const printWindow = window.open('', '_blank', 'width=400,height=700');
  if (printWindow) {
    printWindow.document.write(generateEstimateTemplate(data));
    printWindow.document.close();
    printWindow.focus();
  }
}

// Interactive print template for invoice system
export function generateInteractivePrintTemplate(invoice: InvoiceDetail): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Invoice - ${invoice.invoiceNumber}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        @media print {
            body {
                margin: 0;
                padding: 0;
                background-color: #fff;
            }
            body * {
                visibility: hidden;
            }
            #invoice-container, #invoice-container * {
                visibility: visible;
            }
            #invoice-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                /*
                  We scale the content down to fit the page width and also reduce
                  vertical margins and padding to prevent it from flowing onto a second page.
                  Use transform-origin center to keep content centered when scaling
                */
                transform: scale(0.8);
                transform-origin: top center;
                padding: 2rem !important; /* Reduced padding for print */
            }

            /* Reduce spacing for a more compact print layout */
            #invoice-container header.mb-12,
            #invoice-container section.mb-12 {
                margin-bottom: 1.5rem !important;
            }

            #invoice-container footer.mt-24 {
                margin-top: 1.5rem !important; /* Further reduced footer margin */
            }
            .no-print {
                display: none;
            }
            [contenteditable] {
                border-color: transparent !important;
                box-shadow: none !important;
            }
            /* Hide placeholders when printing */
            [contenteditable][data-placeholder]:empty::before {
                display: none;
            }
        }
        /* Add a visual cue for editable areas */
        [contenteditable] {
            cursor: pointer;
            border-radius: 0.375rem; /* rounded-md */
            transition: box-shadow 0.2s ease-in-out;
        }
        [contenteditable]:hover {
            box-shadow: 0 0 0 2px #dbeafe; /* light blue ring */
        }
        [contenteditable]:focus {
            outline: 2px solid #3b82f6; /* blue-500 */
            background-color: #f9fafb; /* gray-50 */
            box-shadow: none;
        }
        /* Placeholder styles */
        [contenteditable][data-placeholder]:empty::before {
            content: attr(data-placeholder);
            color: #9ca3af; /* gray-400 */
            font-style: italic;
        }
    </style>
</head>
<body class="bg-gray-100 p-4 sm:p-8">

    <!-- Action Buttons -->
    <div id="actions" class="no-print max-w-4xl mx-auto mb-6 text-right">
         <p class="text-sm text-gray-500 mb-2 italic">Tip: Click on the editable sections (highlighted in blue on hover) to customize them before printing.</p>
        <button id="print-btn" class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300">
            Print Invoice
        </button>
    </div>

    <!-- Invoice Template -->
    <div id="invoice-container" class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 sm:p-12">
        <div id="invoice-content">
            <header class="flex justify-between items-start mb-12">
                <div id="company-details" class="p-2 w-1/2">
                    <h1 contenteditable="true" data-placeholder="Your Company Name" class="text-3xl font-bold text-gray-800 mb-2">Studio Repair Services</h1>
                    <div 
                        contenteditable="true" 
                        data-placeholder="Street Address&#10;City, State, ZIP Code&#10;Phone Number"
                        class="text-gray-600 p-2 border border-transparent hover:border-gray-200 focus:border-gray-200 rounded-lg min-h-[70px] w-full"
                    >8900 Westminster Ave<br>Westminster, CA 92683<br>Phone: (714) 588-3332</div>
                </div>
                <h2 class="text-4xl font-bold text-gray-700 uppercase">Invoice</h2>
            </header>

            <section class="flex justify-between mb-12">
                <div id="bill-to-details" class="w-1/2">
                    <h3 class="font-bold text-gray-700 mb-2">Bill To</h3>
                    <div id="bill-to-content" class="p-2 text-gray-600 text-sm">
                        <p class="font-medium text-base mb-1">${invoice.customer.name}</p>
                        ${invoice.customer.email ? `<p>${invoice.customer.email}</p>` : ''}
                        ${invoice.customer.phone ? `<p>Phone: ${invoice.customer.phone}</p>` : ''}
                        ${invoice.customer.address ? `<p>${invoice.customer.address}</p>` : ''}
                    </div>
                </div>
                <div id="ship-to-details" class="w-1/2">
                    <h3 class="font-bold text-gray-700 mb-2">Ship To</h3>
                    <div id="ship-to-content" class="p-2">
                        <p contenteditable="true" class="text-gray-600 font-medium mb-2">${invoice.customer.name}</p>
                         <div 
                            contenteditable="true" 
                            class="text-gray-600 text-sm p-2 border border-transparent hover:border-gray-200 focus:border-gray-200 rounded-lg min-h-[70px] w-full"
                        >${invoice.customer.address || 'Click to add shipping address'}<br>${invoice.customer.phone ? `Phone: ${invoice.customer.phone}` : ''}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                        <span class="font-bold text-gray-700">Invoice #</span>
                        <span class="text-gray-600">${invoice.invoiceNumber}</span>
                        <span class="font-bold text-gray-700">Invoice Date</span>
                        <span class="text-gray-600">${new Date(invoice.issueDate).toLocaleDateString()}</span>
                        <span class="font-bold text-gray-700">P.O.#</span>
                        <span contenteditable="true" class="text-gray-600" data-placeholder="Enter P.O. number">Click to add P.O. number</span>
                        <span class="font-bold text-gray-700">Due Date</span>
                        <span class="text-gray-600">${new Date(invoice.dueDate).toLocaleDateString()}</span>
                    </div>
                </div>
            </section>

            <section>
                <table class="w-full text-left">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="p-3 text-sm font-bold text-gray-700 uppercase">Description</th>
                            <th class="p-3 text-sm font-bold text-gray-700 uppercase">Qty</th>
                            <th class="p-3 text-sm font-bold text-gray-700 uppercase text-right">Unit Price</th>
                            <th class="p-3 text-sm font-bold text-gray-700 uppercase text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                        <tr class="border-b border-gray-200">
                            <td class="p-3 text-gray-600">
                                <div class="font-medium">${item.productName}</div>
                                ${item.description ? `<div class="text-xs text-gray-500">${item.description}</div>` : ''}
                            </td>
                            <td class="p-3 text-gray-600">${item.quantity}</td>
                            <td class="p-3 text-gray-600 text-right">$${item.unitPrice.toFixed(2)}</td>
                            <td class="p-3 text-gray-600 text-right">$${item.total.toFixed(2)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>

            <section class="flex justify-end mt-8">
                <div class="w-full sm:w-1/2 md:w-1/3">
                    <div class="flex justify-between border-b py-2">
                        <span class="font-medium text-gray-700">Subtotal</span>
                        <span class="text-gray-800">$${invoice.subtotal.toFixed(2)}</span>
                    </div>
                    ${invoice.discount && invoice.discount > 0 ? `
                    <div class="flex justify-between border-b py-2">
                        <span class="font-medium text-gray-700">Discount</span>
                        <span class="text-gray-800">-$${invoice.discount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div class="flex justify-between border-b py-2">
                        <span class="font-medium text-gray-700">Tax</span>
                        <span class="text-gray-800">$${invoice.tax.toFixed(2)}</span>
                    </div>
                    ${invoice.amountPaid && invoice.amountPaid > 0 ? `
                    <div class="flex justify-between border-b py-2">
                        <span class="font-medium text-gray-700">Amount Paid</span>
                        <span class="text-green-600">-$${invoice.amountPaid.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div class="flex justify-between bg-gray-100 rounded-b-lg py-3 px-4">
                        <span class="font-bold text-gray-800 text-lg">TOTAL DUE</span>
                        <span class="font-bold text-gray-800 text-lg">$${(invoice.total - (invoice.amountPaid || 0)).toFixed(2)}</span>
                    </div>
                </div>
            </section>
            
            <footer class="mt-24">
                <h4 class="font-bold text-gray-700 mb-2">Terms & Conditions</h4>
                <div 
                    contenteditable="true" 
                    data-placeholder="Enter your terms and conditions here. For example: Payment is due within 15 days. Please make checks payable to..."
                    class="text-gray-600 text-sm p-3 border border-gray-200 rounded-lg min-h-[80px] w-full"
                >${invoice.summary || 'Payment is due within 15 days. Please make checks payable to Studio Repair Services. Thank you for your business!'}</div>
            </footer>
        </div>
    </div>

    <script>
        const printBtn = document.getElementById('print-btn');

        // Direct print button
        printBtn.addEventListener('click', () => {
            window.print();
        });

        // Auto-focus on contenteditable elements when clicked
        document.querySelectorAll('[contenteditable]').forEach(element => {
            element.addEventListener('click', function() {
                this.focus();
            });
        });
    </script>

</body>
</html>
`;
}