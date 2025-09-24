import { getCustomers } from '@/lib/actions/customers';
import { Customer } from '@/lib/types';
import { mockRepairCustomers } from '@/lib/mock-repair-data';

/**
 * Get all customers for repair system - integrates with existing customer database
 */
export async function getRepairCustomers(): Promise<Customer[]> {
  try {
    // Try to get customers from Firebase first
    const firebaseCustomers = await getCustomers();
    
    if (firebaseCustomers && firebaseCustomers.length > 0) {
      return firebaseCustomers;
    }
    
    // Fallback to mock data if Firebase is not available
    return mockRepairCustomers;
  } catch (error) {
    console.error('Error fetching repair customers:', error);
    // Return mock data as fallback
    return mockRepairCustomers;
  }
}

/**
 * Search customers by name or phone for repair job creation
 */
export async function searchCustomersForRepair(query: string): Promise<Customer[]> {
  const customers = await getRepairCustomers();
  
  const lowerQuery = query.toLowerCase();
  return customers.filter(customer =>
    customer.name.toLowerCase().includes(lowerQuery) ||
    customer.phone.includes(query) ||
    (customer.email && customer.email.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get customer by ID for repair system
 */
export async function getRepairCustomerById(id: string): Promise<Customer | null> {
  const customers = await getRepairCustomers();
  return customers.find(customer => customer.id === id) || null;
}

/**
 * Get customer by phone number (useful for repair intake)
 */
export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  const customers = await getRepairCustomers();
  // Normalize phone number for comparison (remove formatting)
  const normalizedPhone = phone.replace(/\D/g, '');
  return customers.find(customer => 
    customer.phone.replace(/\D/g, '') === normalizedPhone
  ) || null;
}

/**
 * Check if customer exists by phone (for new job creation)
 */
export async function customerExistsByPhone(phone: string): Promise<boolean> {
  const customer = await getCustomerByPhone(phone);
  return customer !== null;
}

/**
 * Get customer suggestions for autocomplete
 */
export async function getCustomerSuggestions(query: string, limit: number = 5): Promise<Customer[]> {
  if (query.length < 2) return [];
  
  const results = await searchCustomersForRepair(query);
  return results.slice(0, limit);
}

/**
 * Get customer repair history count (simulated for now)
 */
export function getCustomerRepairCount(customerId: string): number {
  // In a real implementation, this would query repair jobs by customer ID
  // For now, return a simulated count
  const repairCounts: Record<string, number> = {
    'cust-001': 3,
    'cust-002': 1,
    'cust-003': 2,
  };
  
  return repairCounts[customerId] || 0;
}

/**
 * Format customer for display in repair forms
 */
export function formatCustomerForDisplay(customer: Customer): {
  id: string;
  displayName: string;
  phone: string;
  email?: string;
} {
  return {
    id: customer.id,
    displayName: `${customer.name} (${customer.phone})`,
    phone: customer.phone,
    email: customer.email,
  };
}