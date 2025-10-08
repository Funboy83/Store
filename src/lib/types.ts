














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
  condition: string;
  status: 'Available' | 'Sold' | 'Deleted';
  customFields?: Record<string, string>; // Flexible key-value pairs for unique attributes
  createdAt: string; 
  updatedAt: string;
};

export type ProductHistory = Product & {
  status: 'Sold' | 'Deleted' | 'Voided' | 'Returned';
  amount: number;
  movedAt: any;
  customerId?: string;
  customerName?: string;
  invoiceId?: string;
  creditNoteId?: string;
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
  status: 'active' | 'inactive';
  customerType?: 'wholesale' | 'retail';
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
  amountPaid: number;
  paymentIds: string[];
  relatedCreditNoteId?: string;
  relatedInvoiceId?: string;
};

export type InvoiceDetail = Omit<Invoice, 'customerId' | 'customerName'> & {
  customer: Customer;
  items: InvoiceItem[];
  payments?: Payment[];
  isEdited?: boolean;
};

export type TenderDetail = {
  method: 'Cash' | 'Check' | 'Card/Zelle/Wire' | 'StoreCredit';
  amount: number;
};

export type AppliedInvoice = {
  id: string;
  invoiceNumber: string;
};

export type Payment = {
    id: string;
    customerId: string;
    paymentDate: any;
    recordedBy: string;
    amountPaid: number;
    type: 'payment' | 'refund';
    appliedToInvoices: string[];
    tenderDetails: TenderDetail[];
    notes?: string;
    sourceCreditNoteId?: string;
};

export type PaymentDetail = Omit<Payment, 'appliedToInvoices'> & {
  customerName: string;
  appliedToInvoices: InvoiceDetail[];
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

export type EditHistoryEntry = {
  id: string;
  timestamp: any;
  user: string;
  changes: Record<string, { from: any; to: any }>;
};

export type CreditNote = {
  id: string;
  creditNoteNumber?: string;
  originalInvoiceId: string;
  customerId: string;
  issueDate: string;
  items: InvoiceItem[];
  totalCredit: number;
  remainingCredit: number;
  status: 'available' | 'partially_used' | 'fully_used' | 'refunded';
  newExchangeInvoiceId?: string;
  refundPaymentId?: string;
};

export type CreditNoteDetail = CreditNote & {
    customerName: string;
};

// Repair Shop Types
export type JobStatus = 
  | 'Waiting for Parts'
  | 'In Progress' 
  | 'Ready for Pickup'
  | 'Completed'
  | 'Paid';

export type DeviceCondition = 
  | 'Scratched Screen'
  | 'Cracked Screen'
  | 'Dented Corner'
  | 'Water Damage'
  | 'Battery Issues'
  | 'Charging Port Damage'
  | 'Button Not Working'
  | 'Speaker Issues'
  | 'Camera Issues'
  | 'Other';

export type RepairCustomer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
  totalJobs: number;
  notes?: string;
};

export type RepairPart = {
  id: string;
  name: string;
  partNumber?: string;
  cost: number;
  price: number; // Selling price
  quantity: number;
  supplier?: string;
  description?: string;
};

export type UsedPart = {
  partId: string;
  partName: string;
  quantity: number;
  cost: number;
  price: number;
  total: number;
};

// Service Types for standardized repair services
export type Service = {
  id: string;
  name: string;
  description: string;
  category: 'Labor' | 'Diagnostic' | 'Repair' | 'Installation' | 'Other';
  price: number;
  estimatedTime?: number; // in minutes
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UsedService = {
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
  price: number;
  quantity: number; // For services that can be applied multiple times
  total: number;
};

export type RepairJob = {
  id: string;
  jobId: string; // Display ID like #1001
  customerId: string;
  customerName: string;
  customerPhone: string;
  
  // Device Information
  deviceMake: string;
  deviceModel: string;
  imei?: string;
  serialNumber?: string;
  deviceConditions: DeviceCondition[];
  problemDescription: string;
  
  // Job Details
  estimatedCost: number;
  actualCost?: number;
  status: JobStatus;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  
  // Dates
  createdAt: string;
  updatedAt: string;
  estimatedCompletion?: string;
  completedAt?: string;
  pickedUpAt?: string;
  
  // Technical Details
  technicianNotes: string[];
  internalNotes: string[];
  usedParts: UsedPart[];
  usedServices: UsedService[];
  laborCost: number; // TODO: Remove this after migrating to service-based system
  
  // Invoice
  invoiceGenerated: boolean;
  invoiceId?: string;
  totalAmount?: number;
  isPaid: boolean;
  paidAt?: string;
  paymentMethod?: string;
};

export type RepairJobDetail = RepairJob & {
  customer: RepairCustomer;
  invoice?: RepairInvoice;
};

export type RepairInvoice = {
  id: string;
  jobId: string;
  jobDisplayId: string;
  customerId: string;
  customerName: string;
  
  // Invoice Details
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  
  // Costs
  laborCost: number;
  partsCost: number;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  
  // Items
  parts: UsedPart[];
  laborDescription: string;
  
  // Status
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  isPaid: boolean;
  paidAt?: string;
  paymentMethod?: string;
  
  createdAt: string;
  updatedAt: string;
};

export type JobStats = {
  total: number;
  inProgress: number;
  readyForPickup: number;
  completed: number;
  waitingForParts: number;
  paid: number;
};

export type DashboardStats = {
  jobs: JobStats;
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  recentJobs: RepairJob[];
  pendingPickups: RepairJob[];
};

// Parts Inventory Types
export type PartCategory = 
  | 'Screen'
  | 'Battery'
  | 'Camera'
  | 'Speaker'
  | 'Microphone'
  | 'Charging Port'
  | 'Home Button'
  | 'Volume Button'
  | 'Power Button'
  | 'Back Cover'
  | 'Frame'
  | 'Flex Cable'
  | 'IC Chip'
  | 'Antenna'
  | 'SIM Tray'
  | 'Adhesive'
  | 'Screw'
  | 'Tool'
  | 'Other';

export type PartCondition = 
  | 'New'
  | 'Refurbished'
  | 'Used - Excellent'
  | 'Used - Good'
  | 'Used - Fair';

// Batch tracking for FIFO inventory management
export type PartBatch = {
  batchId: string;
  purchaseDate: string;
  quantity: number;
  costPrice: number;
  supplier?: string;
  notes?: string;
  purchaseOrderId?: string; // Link to originating purchase order
  referenceNumber?: string; // Supplier's invoice/reference number
};

// Result type for FIFO batch consumption
export type BatchConsumptionResult = {
  success: boolean;
  costPrice?: number;
  batchId?: string;
  remainingQuantity?: number;
  error?: string;
};

// Purchase Order Types for Restock System
export type PurchaseOrderItem = {
  partId: string;
  partName: string;
  partNumber?: string;
  brand?: string;
  model?: string;
  condition?: string;
  customFields?: Record<string, string>;
  quantityReceived: number;
  costPerItem: number;
  totalCost: number;
};

export type PurchaseOrder = {
  id: string;
  supplierId?: string;
  supplierName?: string;
  purchaseDate: string;
  referenceNumber?: string; // Invoice number from supplier
  items: PurchaseOrderItem[];
  totalItems: number;
  totalCost: number;
  status: 'draft' | 'committed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

// Category Management Types
export type Category = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type SubCategory = {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type CategoryWithSubCategories = Category & {
  subCategories: SubCategory[];
};

export type Part = {
  id: string;
  name: string;
  partNumber?: string;
  category?: PartCategory;
  categoryId?: string; // New: Reference to Category
  subCategoryId?: string; // New: Reference to SubCategory
  brand?: string;
  model?: string;
  compatibility?: string[]; // Array of compatible phone models
  condition: PartCondition;
  batches: PartBatch[]; // FIFO batch tracking system
  totalQuantityInStock: number; // Calculated sum for easy display
  minQuantity: number; // For low stock alerts
  avgCost: number; // Average cost across all batches for reference
  price: number; // How much we sell for
  location?: string; // Where it's stored
  notes?: string;
  customFields?: Record<string, string>; // Flexible key-value pairs for unique attributes
  createdAt: string;
  updatedAt: string;
};

export type PartHistory = {
  id: string;
  partId: string;
  type: 'purchase' | 'sale' | 'use' | 'return' | 'adjustment';
  quantity: number;
  batchId?: string; // Which batch was affected
  costPrice?: number; // Actual cost from the specific batch
  sellPrice?: number;
  jobId?: string; // If used in a repair job
  customerId?: string;
  notes?: string;
  createdAt: string;
};

// Supplier Types
export type Supplier = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  website?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive';
  paymentTerms?: string;
  taxId?: string;
};

// Field Template Types for Pre-defined Custom Fields
export type FieldType = 'Text' | 'Number' | 'Yes/No' | 'Dropdown';

export type FieldTemplate = {
  id: string;
  fieldName: string;
  label: string;
  fieldType: FieldType;
  required?: boolean;
  options?: string[]; // Only used for Dropdown type
  createdAt: string;
  updatedAt: string;
};

// Custom field value that can be different types
export type CustomFieldValue = string | number | boolean;

// General Inventory Types - Separate from Parts inventory
export type GeneralItemCondition = 
  | 'New'
  | 'Refurbished'
  | 'Used - Excellent'
  | 'Used - Good'
  | 'Used - Fair'
  | 'Damaged';

// General inventory item using the same FIFO batch system as parts
export type GeneralItem = {
  id: string;
  name: string;
  sku?: string; // Stock Keeping Unit
  categoryId?: string; // Reference to Category from settings
  subCategoryId?: string; // Reference to SubCategory from settings
  brand?: string;
  model?: string;
  description?: string;
  condition: GeneralItemCondition;
  batches: PartBatch[]; // Reuse the same FIFO batch system as parts
  totalQuantityInStock: number; // Calculated sum for easy display
  minQuantity: number; // For low stock alerts
  avgCost: number; // Average cost across all batches for reference
  price: number; // How much we sell for
  location?: string; // Where it's stored
  notes?: string;
  customFields?: Record<string, string>; // Flexible key-value pairs for unique attributes
  createdAt: string;
  updatedAt: string;
};

export type GeneralItemHistory = {
  id: string;
  itemId: string;
  type: 'purchase' | 'sale' | 'use' | 'return' | 'adjustment';
  quantity: number;
  batchId?: string; // Which batch was affected
  costPrice?: number; // Actual cost from the specific batch
  sellPrice?: number;
  jobId?: string; // If used in a repair job
  customerId?: string;
  notes?: string;
  createdAt: string;
};
