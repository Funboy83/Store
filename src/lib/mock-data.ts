
import type { Product, Invoice, Sale, RecentSale, Customer } from './types';

// This is now legacy mock data, the app will prefer Firebase.
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    imei: '111111111111111',
    brand: 'Samsung',
    model: 'Galaxy S23 Ultra',
    price: 1199.99,
    storage: '256GB',
    grade: 'A',
    color: 'Phantom Black',
    carrier: 'Unlocked',
    battery: 98,
    date: '2024-01-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_2',
    imei: '222222222222222',
    brand: 'Apple',
    model: 'iPhone 14 Pro',
    price: 999.0,
    storage: '128GB',
    grade: 'A',
    color: 'Deep Purple',
    carrier: 'Unlocked',
    battery: 100,
    date: '2024-01-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const MOCK_CUSTOMERS: Customer[] = [
    {
        id: 'cust_1',
        name: 'Acme Enterprise',
        email: 'cme@enterprise.com',
        address: '1901 Thornridge Cir. Shiloh, Hawaii, USA. 81063',
    },
    {
        id: 'cust_2',
        name: 'Innovate Corp',
        email: 'contact@innovatecorp.com',
        address: '456 Oak Ave, Metropolis, USA. 54321',
    },
    {
        id: 'cust_3',
        name: 'John Doe',
        email: 'john.doe@email.com',
        address: '123 Main St, Anytown, USA, 12345',
    }
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv_1',
    invoiceNumber: 'INV-001',
    customer: MOCK_CUSTOMERS[2],
    items: [
      { productId: 'prod_2', productName: 'iPhone 14 Pro', quantity: 1, unitPrice: 999.0, total: 999.0 },
    ],
    subtotal: 999.0,
    tax: 79.92,
    discount: 0,
    total: 1078.92,
    issueDate: '2023-10-01',
    dueDate: '2023-10-31',
    status: 'Paid',
  },
  {
    id: 'inv_2',
    invoiceNumber: 'INV-002',
    customer: MOCK_CUSTOMERS[0],
    items: [
      { productId: 'prod_1', productName: 'Galaxy S23 Ultra', quantity: 1, unitPrice: 1199.99, total: 1199.99 },
    ],
    subtotal: 1898.99,
    tax: 151.92,
    discount: 0,
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
