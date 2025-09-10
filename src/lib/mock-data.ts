import type { Product, Invoice, Sale, RecentSale } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Galaxy S23 Ultra',
    brand: 'Samsung',
    model: 'SM-S918B',
    price: 1199.99,
    stock: 50,
    imageUrl: 'https://picsum.photos/seed/phone1/400/400',
  },
  {
    id: 'prod_2',
    name: 'iPhone 14 Pro',
    brand: 'Apple',
    model: 'A2890',
    price: 999.0,
    stock: 75,
    imageUrl: 'https://picsum.photos/seed/phone2/400/400',
  },
  {
    id: 'prod_3',
    name: 'Pixel 7 Pro',
    brand: 'Google',
    model: 'GP4BC',
    price: 899.0,
    stock: 60,
    imageUrl: 'https://picsum.photos/seed/phone3/400/400',
  },
  {
    id: 'prod_4',
    name: 'OnePlus 11',
    brand: 'OnePlus',
    model: 'CPH2451',
    price: 699.0,
    stock: 40,
    imageUrl: 'https://picsum.photos/seed/phone4/400/400',
  },
  {
    id: 'prod_5',
    name: 'Xperia 1 IV',
    brand: 'Sony',
    model: 'XQ-CT72',
    price: 1399.99,
    stock: 25,
    imageUrl: 'https://picsum.photos/seed/phone5/400/400',
  },
  {
    id: 'prod_6',
    name: 'iPhone 14',
    brand: 'Apple',
    model: 'A2882',
    price: 799.0,
    stock: 100,
    imageUrl: 'https://picsum.photos/seed/phone6/400/400',
  },
  {
    id: 'prod_7',
    name: 'Galaxy Z Fold 4',
    brand: 'Samsung',
    model: 'SM-F936U1',
    price: 1799.99,
    stock: 30,
    imageUrl: 'https://picsum.photos/seed/phone7/400/400',
  },
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv_1',
    invoiceNumber: 'INV-001',
    customer: {
      id: 'cust_1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      address: '123 Main St, Anytown, USA',
    },
    items: [
      { productId: 'prod_2', productName: 'iPhone 14 Pro', quantity: 1, unitPrice: 999.0, total: 999.0 },
    ],
    subtotal: 999.0,
    tax: 79.92,
    total: 1078.92,
    issueDate: '2023-10-01',
    dueDate: '2023-10-31',
    status: 'Paid',
  },
  {
    id: 'inv_2',
    invoiceNumber: 'INV-002',
    customer: {
      id: 'cust_2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      address: '456 Oak Ave, Anytown, USA',
    },
    items: [
      { productId: 'prod_1', productName: 'Galaxy S23 Ultra', quantity: 1, unitPrice: 1199.99, total: 1199.99 },
      { productId: 'prod_4', productName: 'OnePlus 11', quantity: 1, unitPrice: 699.0, total: 699.0 },
    ],
    subtotal: 1898.99,
    tax: 151.92,
    total: 2050.91,
    issueDate: '2023-10-15',
    dueDate: '2023-11-14',
    status: 'Pending',
  },
];

export const MOCK_SALES_DATA: Sale[] = [
    { month: 'Jan', revenue: 4000 },
    { month: 'Feb', revenue: 3000 },
    { month: 'Mar', revenue: 5000 },
    { month: 'Apr', revenue: 4500 },
    { month: 'May', revenue: 6000 },
    { month: 'Jun', revenue: 5500 },
    { month: 'Jul', revenue: 7000 },
    { month: 'Aug', revenue: 6500 },
    { month: 'Sep', revenue: 7500 },
    { month: 'Oct', revenue: 8000 },
    { month: 'Nov', revenue: 9500 },
    { month: 'Dec', revenue: 11000 },
];

export const MOCK_RECENT_SALES: RecentSale[] = [
    { id: '1', customerName: 'Olivia Martin', customerEmail: 'olivia.martin@email.com', amount: 1999.00 },
    { id: '2', customerName: 'Jackson Lee', customerEmail: 'jackson.lee@email.com', amount: 39.00 },
    { id: '3', customerName: 'Isabella Nguyen', customerEmail: 'isabella.nguyen@email.com', amount: 299.00 },
    { id: '4', customerName: 'William Kim', customerEmail: 'will@email.com', amount: 99.00 },
    { id: '5', customerName: 'Sofia Davis', customerEmail: 'sofia.davis@email.com', amount: 899.00 },
];
