

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
  createdAt: any; 
  updatedAt: any;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  address: string;
};

export type InvoiceItem = {
  id: string;
  productName: string;
  description?: string;
  unitPrice: number;
  total: number;
  isCustom?: boolean;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  summary?: string;
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
