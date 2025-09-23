'use server';

import { db, isConfigured } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, orderBy, limit, Timestamp } from 'firebase/firestore';

const DATA_PATH = 'cellphone-inventory-system/data';
const INVOICES_COLLECTION = 'invoices';
const CUSTOMERS_COLLECTION = 'customers';
const INVENTORY_COLLECTION = 'inventory';

export interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  totalCustomers: number;
  totalInventory: number;
  revenueGrowth?: number;
  salesGrowth?: number;
  customersGrowth?: number;
  inventoryGrowth?: number;
}

export interface RecentSale {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  date: string;
}

export async function getRecentSales(limitCount: number = 5): Promise<RecentSale[]> {
  if (!isConfigured) {
    return [];
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const invoicesCollectionRef = collection(dataDocRef, INVOICES_COLLECTION);
    const customersCollectionRef = collection(dataDocRef, CUSTOMERS_COLLECTION);

    // Get all invoices and customers, then filter and sort client-side
    const [invoicesSnapshot, customersSnapshot] = await Promise.all([
      getDocs(invoicesCollectionRef),
      getDocs(customersCollectionRef)
    ]);

    // Build customer map
    const customerMap = new Map();
    customersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      customerMap.set(doc.id, {
        name: data.name,
        email: data.email || ''
      });
    });

    // Filter paid invoices and sort by date
    const paidInvoices = invoicesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }) as any)
      .filter((invoice: any) => invoice.status === 'Paid' || invoice.status === 'Partial')
      .sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limitCount);

    const recentSales: RecentSale[] = paidInvoices.map((invoice: any) => {
      const customer = customerMap.get(invoice.customerId);
      
      return {
        id: invoice.id,
        customerName: customer?.name || invoice.customerName || 'Unknown Customer',
        customerEmail: customer?.email || '',
        amount: invoice.amountPaid || invoice.total || 0,
        date: invoice.createdAt?.toDate ? invoice.createdAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    return recentSales;
  } catch (error) {
    console.error('Error fetching recent sales:', error);
    return [];
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!isConfigured) {
    return {
      totalRevenue: 0,
      totalSales: 0,
      totalCustomers: 0,
      totalInventory: 0,
    };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const invoicesCollectionRef = collection(dataDocRef, INVOICES_COLLECTION);
    const customersCollectionRef = collection(dataDocRef, CUSTOMERS_COLLECTION);
    const inventoryCollectionRef = collection(dataDocRef, INVENTORY_COLLECTION);

    // Fetch all data in parallel without complex queries to avoid index requirements
    const [
      allInvoicesSnapshot,
      customersSnapshot,
      inventorySnapshot
    ] = await Promise.all([
      // All invoices (we'll filter client-side to avoid complex queries)
      getDocs(invoicesCollectionRef),
      
      // All customers
      getDocs(customersCollectionRef),
      
      // All inventory
      getDocs(inventoryCollectionRef)
    ]);

    // Get current month dates for client-side filtering
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Filter and calculate metrics client-side
    let totalRevenue = 0;
    let totalSales = 0;
    let currentMonthRevenue = 0;
    let currentMonthSales = 0;
    let lastMonthRevenue = 0;
    let lastMonthSales = 0;

    allInvoicesSnapshot.docs.forEach(doc => {
      const invoice = doc.data();
      
      // Skip voided invoices
      if (invoice.status === 'Voided') return;

      const invoiceDate = invoice.createdAt?.toDate ? invoice.createdAt.toDate() : new Date();
      
      if (invoice.status === 'Paid' || invoice.status === 'Partial') {
        const amount = invoice.amountPaid || 0;
        totalRevenue += amount;
        totalSales += 1;

        // Check if it's current month
        if (invoiceDate >= currentMonthStart) {
          currentMonthRevenue += amount;
          currentMonthSales += 1;
        }

        // Check if it's last month
        if (invoiceDate >= lastMonthStart && invoiceDate <= lastMonthEnd) {
          lastMonthRevenue += amount;
          lastMonthSales += 1;
        }
      }
    });

    // Calculate customer metrics
    let currentMonthCustomers = 0;
    let lastMonthCustomers = 0;

    customersSnapshot.docs.forEach(doc => {
      const customer = doc.data();
      const customerDate = customer.createdAt?.toDate ? customer.createdAt.toDate() : new Date();

      if (customerDate >= currentMonthStart) {
        currentMonthCustomers += 1;
      }

      if (customerDate >= lastMonthStart && customerDate <= lastMonthEnd) {
        lastMonthCustomers += 1;
      }
    });

    // Calculate growth percentages
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : currentMonthRevenue > 0 ? 100 : 0;

    const salesGrowth = lastMonthSales > 0 
      ? ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100 
      : currentMonthSales > 0 ? 100 : 0;

    const customersGrowth = lastMonthCustomers > 0 
      ? ((currentMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100 
      : currentMonthCustomers > 0 ? 100 : 0;

    // Total customers and available inventory
    const totalCustomers = customersSnapshot.size;
    const totalInventory = inventorySnapshot.docs.filter(doc => {
      const item = doc.data();
      return item.status === 'Available';
    }).length;

    return {
      totalRevenue,
      totalSales,
      totalCustomers,
      totalInventory,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10, // Round to 1 decimal
      salesGrowth: Math.round(salesGrowth * 10) / 10,
      customersGrowth: Math.round(customersGrowth * 10) / 10,
      inventoryGrowth: 0 // We don't track inventory growth yet
    };

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalRevenue: 0,
      totalSales: 0,
      totalCustomers: 0,
      totalInventory: 0,
    };
  }
}