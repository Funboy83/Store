







export type Product = {
  id: string;
  imei: string;
  brand: string;
  model: string;
  price: number;
  storage: string;
  grade: string;
  color: string;
  carrier: string;
  battery: number;
  date: string;
  createdAt: string; 
  updatedAt: string;
};

export type ProductHistory = Product & {
  status: 'Sold' | 'Deleted' | 'Voided';
  amount: number;
  movedAt: any;
  customerId?: string;
  customerName?: string;
  invoiceId?: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: string;
  totalInvoices: number;
  totalSpent: number;
  debt: number;
};

export type InvoiceItem = {
  id: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isCustom?: boolean;
  inventoryId?: string; // Link back to the original inventory item
};

export type Invoice = {
  id:string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string; // For walk-in customers
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Voided' | 'Draft' | 'Overdue';
  summary?: string;
  createdAt: any;
};

export type InvoiceDetail = Omit<Invoice, 'customerId' | 'customerName'> & {
  customer: Customer;
  items: InvoiceItem[];
};

export type InvoiceHistory = Omit<Invoice, 'status' | 'createdAt'> & {
    status: 'Voided';
    archivedAt: any;
}

export type InvoiceHistoryDetail = Omit<InvoiceHistory, 'customerId' | 'customerName'> & {
    customer: Customer;
    items: InvoiceItem[];
};


export type Sale = {
  month: string;
  revenue: number;
};

export type RecentSale = {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
};


