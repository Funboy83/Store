

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
  status: 'Sold' | 'Deleted';
  amount: number;
  movedAt: any;
  customerId?: string;
  customerName?: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: string;
};

export type InvoiceItem = {
  id: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isCustom?: boolean;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft';
  summary?: string;
  createdAt: any;
};

export type InvoiceDetail = Omit<Invoice, 'customerId'> & {
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
