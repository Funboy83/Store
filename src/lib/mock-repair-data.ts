import { RepairJob, Customer, JobStats, DashboardStats } from '@/lib/types';

// Mock data generation functions for repair shop

// Use existing customers from the main customer database
export const mockRepairCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'John Smith',
    phone: '(555) 123-4567',
    email: 'john.smith@email.com',
    address: '123 Main St, City, State 12345',
    createdAt: '2024-01-15T10:30:00Z',
    totalInvoices: 2, // Regular invoices
    totalSpent: 450.00,
    debt: 0,
    status: 'active',
    notes: 'Regular repair customer',
  },
  {
    id: 'cust-002',
    name: 'Sarah Johnson',
    phone: '(555) 234-5678',
    email: 'sarah.j@email.com',
    address: '456 Oak Ave, City, State 67890',
    createdAt: '2024-02-01T14:20:00Z',
    totalInvoices: 1,
    totalSpent: 180.00,
    debt: 0,
    status: 'active',
    notes: 'Prefers email notifications',
  },
  {
    id: 'cust-003',
    name: 'Mike Wilson',
    phone: '(555) 345-6789',
    email: 'mike.wilson@email.com',
    address: '789 Pine St, City, State 54321',
    createdAt: '2024-02-10T09:15:00Z',
    totalInvoices: 1,
    totalSpent: 95.00,
    debt: 0,
    status: 'active',
    notes: 'Business customer - frequent traveler',
  },
];

export const mockRepairJobs: RepairJob[] = [
  {
    id: 'job-001',
    jobId: '#1001',
    customerId: 'cust-001',
    customerName: 'John Smith',
    customerPhone: '(555) 123-4567',
    deviceMake: 'Apple',
    deviceModel: 'iPhone 13 Pro',
    imei: '123456789012345',
    deviceConditions: ['Cracked Screen'],
    problemDescription: 'Screen cracked after dropping, touch still works but glass is shattered',
    estimatedCost: 280,
    actualCost: 275,
    status: 'Ready for Pickup',
    createdAt: '2024-09-15T10:30:00Z',
    updatedAt: '2024-09-20T16:45:00Z',
    technicianNotes: ['Replaced screen assembly', 'All functions tested - OK'],
    internalNotes: ['Customer very satisfied with previous repair'],
    usedParts: [
      {
        partId: 'part-001',
        partName: 'iPhone 13 Pro Screen Assembly',
        quantity: 1,
        cost: 180,
        price: 220,
        total: 220,
      }
    ],
    laborCost: 55,
    invoiceGenerated: true,
    totalAmount: 275,
    isPaid: false,
  },
  {
    id: 'job-002',
    jobId: '#1002',
    customerId: 'cust-002',
    customerName: 'Sarah Johnson',
    customerPhone: '(555) 234-5678',
    deviceMake: 'Samsung',
    deviceModel: 'Galaxy S22',
    deviceConditions: ['Battery Issues'],
    problemDescription: 'Battery drains very quickly, phone gets hot during charging',
    estimatedCost: 120,
    status: 'In Progress',
    createdAt: '2024-09-18T14:20:00Z',
    updatedAt: '2024-09-22T11:30:00Z',
    technicianNotes: ['Battery swelling detected', 'Ordering replacement battery'],
    internalNotes: [],
    usedParts: [],
    laborCost: 40,
    invoiceGenerated: false,
    isPaid: false,
  },
  {
    id: 'job-003',
    jobId: '#1003',
    customerId: 'cust-003',
    customerName: 'Mike Wilson',
    customerPhone: '(555) 345-6789',
    deviceMake: 'Google',
    deviceModel: 'Pixel 7',
    deviceConditions: ['Charging Port Damage'],
    problemDescription: 'Charging port loose, cable keeps disconnecting',
    estimatedCost: 95,
    status: 'Waiting for Parts',
    createdAt: '2024-09-20T09:15:00Z',
    updatedAt: '2024-09-21T10:00:00Z',
    technicianNotes: ['Port assembly damaged', 'Need to order replacement'],
    internalNotes: ['Rush order - customer travels frequently'],
    usedParts: [],
    laborCost: 35,
    invoiceGenerated: false,
    isPaid: false,
  },
  {
    id: 'job-004',
    jobId: '#1004',
    customerId: 'cust-001',
    customerName: 'John Smith',
    customerPhone: '(555) 123-4567',
    deviceMake: 'Apple',
    deviceModel: 'iPad Air',
    deviceConditions: ['Cracked Screen', 'Dented Corner'],
    problemDescription: 'Dropped iPad, screen cracked and corner is dented',
    estimatedCost: 200,
    actualCost: 195,
    status: 'Completed',
    createdAt: '2024-09-10T11:00:00Z',
    updatedAt: '2024-09-16T15:30:00Z',
    completedAt: '2024-09-16T15:30:00Z',
    pickedUpAt: '2024-09-17T10:20:00Z',
    technicianNotes: ['Screen replaced successfully', 'Dent repaired with frame straightening'],
    internalNotes: ['Customer prefers to pay cash'],
    usedParts: [
      {
        partId: 'part-002',
        partName: 'iPad Air Screen Assembly',
        quantity: 1,
        cost: 120,
        price: 150,
        total: 150,
      }
    ],
    laborCost: 45,
    invoiceGenerated: true,
    totalAmount: 195,
    isPaid: true,
    paidAt: '2024-09-17T10:20:00Z',
    paymentMethod: 'Cash',
  },
  {
    id: 'job-005',
    jobId: '#1005',
    customerId: 'cust-002',
    customerName: 'Sarah Johnson',
    customerPhone: '(555) 234-5678',
    deviceMake: 'Apple',
    deviceModel: 'iPhone 12',
    deviceConditions: ['Water Damage'],
    problemDescription: 'Phone dropped in water, no longer turns on',
    estimatedCost: 180,
    status: 'In Progress',
    createdAt: '2024-09-21T16:45:00Z',
    updatedAt: '2024-09-22T09:30:00Z',
    technicianNotes: ['Disassembled for cleaning', 'Corrosion found on logic board'],
    internalNotes: ['Customer understands data may not be recoverable'],
    usedParts: [],
    laborCost: 80,
    invoiceGenerated: false,
    isPaid: false,
  },
];

export const getJobStats = (): JobStats => {
  const jobs = mockRepairJobs;
  
  return {
    total: jobs.length,
    inProgress: jobs.filter(job => job.status === 'In Progress').length,
    readyForPickup: jobs.filter(job => job.status === 'Ready for Pickup').length,
    completed: jobs.filter(job => job.status === 'Completed' || job.status === 'Paid').length,
    waitingForParts: jobs.filter(job => job.status === 'Waiting for Parts').length,
  };
};

export const getRecentJobs = (limit: number = 10): RepairJob[] => {
  return mockRepairJobs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
};

export const getPendingPickups = (): RepairJob[] => {
  return mockRepairJobs.filter(job => job.status === 'Ready for Pickup');
};

export const getDashboardStats = (): DashboardStats => {
  const jobs = mockRepairJobs;
  const completedJobs = jobs.filter(job => job.isPaid);
  
  // Calculate revenue
  const today = new Date();
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const todayRevenue = completedJobs
    .filter(job => job.paidAt && new Date(job.paidAt) >= new Date(today.setHours(0, 0, 0, 0)))
    .reduce((sum, job) => sum + (job.actualCost || job.estimatedCost), 0);
    
  const weekRevenue = completedJobs
    .filter(job => job.paidAt && new Date(job.paidAt) >= thisWeek)
    .reduce((sum, job) => sum + (job.actualCost || job.estimatedCost), 0);
    
  const monthRevenue = completedJobs
    .filter(job => job.paidAt && new Date(job.paidAt) >= thisMonth)
    .reduce((sum, job) => sum + (job.actualCost || job.estimatedCost), 0);
  
  return {
    jobs: getJobStats(),
    revenue: {
      today: todayRevenue,
      thisWeek: weekRevenue,
      thisMonth: monthRevenue,
    },
    recentJobs: getRecentJobs(5),
    pendingPickups: getPendingPickups(),
  };
};

export const getJobById = (id: string): RepairJob | undefined => {
  return mockRepairJobs.find(job => job.id === id);
};

export const getCustomerById = (id: string): Customer | undefined => {
  return mockRepairCustomers.find(customer => customer.id === id);
};

export const getJobsByCustomer = (customerId: string): RepairJob[] => {
  return mockRepairJobs.filter(job => job.customerId === customerId);
};