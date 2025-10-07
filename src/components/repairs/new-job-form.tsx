'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeviceCondition, RepairJob, Customer, UsedPart, UsedService, Service } from '@/lib/types';
import { Save, Phone, Mail, Search, Plus, AlertCircle, Wrench, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AddableCombobox } from '@/components/inventory/addable-combobox';
import { getBrandOptions, addBrandOption } from '@/lib/actions/options';
import { addCustomer } from '@/lib/actions/customers';
import { createRepairJob } from '@/lib/actions/repair-jobs';

import { 
  getCustomerSuggestions, 
  getCustomerByPhone,
  formatCustomerForDisplay 
} from '@/lib/repair-customer-integration';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const deviceConditions: DeviceCondition[] = [
  'Scratched Screen',
  'Cracked Screen',
  'Dented Corner',
  'Water Damage',
  'Battery Issues',
  'Charging Port Damage',
  'Button Not Working',
  'Speaker Issues',
  'Camera Issues',
  'Other',
];

export function NewJobForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Dialog state for adding new customer
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deviceMake, setDeviceMake] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [imei, setImei] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<DeviceCondition[]>([]);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');

  // Parts and Services state
  const [usedParts, setUsedParts] = useState<UsedPart[]>([]);
  const [usedServices, setUsedServices] = useState<UsedService[]>([]);

  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  const handleConditionChange = (condition: DeviceCondition, checked: boolean) => {
    if (checked) {
      setSelectedConditions([...selectedConditions, condition]);
    } else {
      setSelectedConditions(selectedConditions.filter(c => c !== condition));
    }
  };



  // Handle IMEI input
  const handleImeiChange = (newImei: string) => {
    setImei(newImei);
  };



  // Handle customer search with debouncing
  const handleCustomerSearch = async (name: string) => {
    setCustomerName(name);
    
    // If user is typing a different name, clear the selected customer
    if (selectedCustomer && name !== selectedCustomer.name) {
      setSelectedCustomer(null);
    }
    
    // Hide suggestions when field is empty
    if (name.length === 0) {
      setShowCustomerSuggestions(false);
      setCustomerSuggestions([]);
      return;
    }
    
    if (name.length >= 2) {
      try {
        const suggestions = await getCustomerSuggestions(name);
        setCustomerSuggestions(suggestions);
        setShowCustomerSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error('Error searching customers:', error);
        setCustomerSuggestions([]);
        setShowCustomerSuggestions(false);
      }
    } else {
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
    }
  };

  // Handle customer selection from suggestions
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerEmail(customer.email || '');
    setShowCustomerSuggestions(false);
    setCustomerSuggestions([]);
  };

  // Handle email changes
  const handleEmailChange = (email: string) => {
    setCustomerEmail(email);
    
    // If user is changing email and it doesn't match selected customer, clear selection
    if (selectedCustomer && email !== selectedCustomer.email) {
      setSelectedCustomer(null);
    }
  };

  // Clear customer selection
  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setShowCustomerSuggestions(false);
    setCustomerSuggestions([]);
  };



  // Handle phone number changes
  const handlePhoneChange = async (phone: string) => {
    setCustomerPhone(phone);
    
    // If user is changing phone and it doesn't match selected customer, clear selection
    if (selectedCustomer && phone !== selectedCustomer.phone) {
      setSelectedCustomer(null);
    }
    
    // Only auto-lookup if no customer name is entered and phone is complete
    if (phone.replace(/\D/g, '').length >= 10 && !selectedCustomer && !customerName) {
      try {
        const existingCustomer = await getCustomerByPhone(phone);
        if (existingCustomer) {
          setSelectedCustomer(existingCustomer);
          setCustomerName(existingCustomer.name);
          setCustomerEmail(existingCustomer.email || '');
        }
      } catch (error) {
        console.error('Error looking up customer by phone:', error);
      }
    }
  };

  // Handle opening new customer dialog
  const handleAddNewCustomer = () => {
    setNewCustomerName(customerName);
    setNewCustomerPhone(customerPhone);
    setNewCustomerEmail(customerEmail);
    setIsNewCustomerDialogOpen(true);
  };

  // Handle creating new customer
  const handleCreateNewCustomer = () => {
    if (!newCustomerName || !newCustomerPhone) {
      toast({
        title: 'Error',
        description: 'Name and phone number are required.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      try {
        // Create FormData to match the addCustomer function signature
        const formData = new FormData();
        formData.append('name', newCustomerName);
        formData.append('phone', newCustomerPhone);
        formData.append('email', newCustomerEmail || '');
        formData.append('notes', '');

        // Add customer to database
        const result = await addCustomer({}, formData);
        
        if (result.success) {
          // Create customer object for form state
          const newCustomer: Customer = {
            id: `new_${Date.now()}`, // Temporary ID - will be updated when form submits
            name: newCustomerName,
            phone: newCustomerPhone,
            email: newCustomerEmail || '',
            address: '',
            notes: '',
            createdAt: new Date().toISOString(),
            totalInvoices: 0,
            totalSpent: 0,
            debt: 0,
            status: 'active',
          };

          setSelectedCustomer(newCustomer);
          setCustomerName(newCustomer.name);
          setCustomerPhone(newCustomer.phone);
          setCustomerEmail(newCustomer.email || '');
          setIsNewCustomerDialogOpen(false);
          setNewCustomerName('');
          setNewCustomerPhone('');
          setNewCustomerEmail('');
          setShowCustomerSuggestions(false);

          toast({
            title: 'Customer Created',
            description: 'New customer added to database successfully.',
          });
        } else {
          // Handle validation errors
          let errorMessage = 'Please check your input.';
          if (result.errors) {
            const errors = Object.values(result.errors).flat();
            errorMessage = errors.join('. ');
          }
          
          toast({
            title: 'Validation Error',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error creating customer:', error);
        toast({
          title: 'Error',
          description: 'Failed to create customer. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for validation errors
    const validationErrors = getValidationErrors();
    if (validationErrors.length > 0) {
      toast({
        title: 'Missing Required Fields',
        description: `Please complete: ${validationErrors.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the repair job
      const result = await createRepairJob({
        customerName,
        customerPhone,
        customerEmail,
        deviceMake,
        deviceModel,
        imei,
        serialNumber,
        problemDescription,
        estimatedCost: parseFloat(estimatedCost),
        deviceConditions: selectedConditions,
        priority,
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `Repair job ${result.jobId} created successfully!`,
        });

        // Navigate back to repairs dashboard
        router.push('/dashboard/repairs');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create repair job.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: 'Error',
        description: 'Failed to create repair job. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return customerName.trim() && 
           customerPhone.trim() && 
           deviceMake.trim() && 
           deviceModel.trim() && 
           problemDescription.trim() && 
           estimatedCost && 
           !isNaN(parseFloat(estimatedCost));
  };

  const getValidationErrors = () => {
    const errors = [];
    
    if (!customerName.trim()) errors.push('Customer Name');
    if (!customerPhone.trim()) errors.push('Phone Number');
    if (!deviceMake.trim()) errors.push('Device Make');
    if (!deviceModel.trim()) errors.push('Device Model');
    if (!problemDescription.trim()) errors.push('Problem Description');
    if (!estimatedCost) errors.push('Estimated Cost');
    else if (isNaN(parseFloat(estimatedCost))) errors.push('Valid Estimated Cost (numbers only)');
    return errors;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Job</h1>
          <p className="text-muted-foreground">Fill out the repair job details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Customer Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Label htmlFor="customerName">Customer Name *</Label>
                <div className="relative">
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                    placeholder="Search existing customer or enter new name"
                    required
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                
                {/* Customer Suggestions Dropdown */}
                {showCustomerSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    {customerSuggestions.map((customer) => (
                      <div
                        key={customer.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                        {customer.email && (
                          <div className="text-sm text-gray-400">{customer.email}</div>
                        )}
                      </div>
                    ))}
                    <div
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-t bg-blue-25 text-blue-600 flex items-center space-x-2"
                      onClick={handleAddNewCustomer}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="font-medium">Add New Customer...</span>
                    </div>
                  </div>
                )}
                
                {/* Add New Customer Button when no suggestions */}
                {!showCustomerSuggestions && customerName && customerName.length >= 2 && !selectedCustomer && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddNewCustomer}
                    className="w-full mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add "{customerName}" as New Customer
                  </Button>
                )}
                
                {/* Quick Add New Customer Button */}
                {!customerName && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewCustomerName('');
                      setNewCustomerPhone('');
                      setNewCustomerEmail('');
                      setIsNewCustomerDialogOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Customer
                  </Button>
                )}
                
                {selectedCustomer && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-green-600 flex items-center space-x-1">
                      <span>✓</span>
                      <span>Existing customer selected</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearCustomer}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
                {selectedCustomer && (
                  <div className="text-sm text-blue-600">
                    Customer found in database
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email Address (Optional)</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="john@email.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Device Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <AddableCombobox
                  formControlName="deviceMake"
                  label="Device Make"
                  fetchOptions={getBrandOptions}
                  addOption={addBrandOption}
                  onChange={(value) => setDeviceMake(value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deviceModel">Device Model *</Label>
                <Input
                  id="deviceModel"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  placeholder="Enter device model (e.g., iPhone 15 Pro, Galaxy S24 Ultra)"
                  required
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imei">IMEI (Optional)</Label>
                <Input
                  id="imei"
                  value={imei}
                  onChange={(e) => handleImeiChange(e.target.value)}
                  placeholder="123456789012345 (Optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number (Optional)</Label>
                <Input
                  id="serialNumber"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="ABCD123456"
                />
              </div>
            </div>

            {/* Device Conditions */}
            <div className="space-y-3">
              <Label>Device Condition (Check all that apply)</Label>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {deviceConditions.map((condition) => (
                  <div key={condition} className="flex items-center space-x-2">
                    <Checkbox
                      id={condition}
                      checked={selectedConditions.includes(condition)}
                      onCheckedChange={(checked) => 
                        handleConditionChange(condition, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={condition} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {condition}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Problem Description & Cost */}
        <Card>
          <CardHeader>
            <CardTitle>Problem Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="problemDescription">Problem Description *</Label>
              <Textarea
                id="problemDescription"
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Describe the issue with the device in detail..."
                rows={4}
                required
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost *</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="150.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Validation Summary */}
        {!isFormValid() && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <div className="text-orange-600 mt-1">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-orange-800 mb-2">Required Fields Missing:</h3>
                  <ul className="space-y-1 text-sm text-orange-700">
                    {getValidationErrors().map((error, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className={!isFormValid() && !isSubmitting ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Creating Job...' : !isFormValid() ? 'Complete Required Fields' : 'Create Job'}
          </Button>
        </div>
      </form>

      {/* New Customer Dialog */}
      <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Enter the details for the new customer to add them to your database.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-customer-name" className="text-right">
                Name *
              </Label>
              <Input
                id="new-customer-name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="col-span-3"
                placeholder="Customer name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-customer-phone" className="text-right">
                Phone *
              </Label>
              <Input
                id="new-customer-phone"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                className="col-span-3"
                placeholder="Phone number"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-customer-email" className="text-right">
                Email
              </Label>
              <Input
                id="new-customer-email"
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                className="col-span-3"
                placeholder="Email address (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateNewCustomer} disabled={isPending}>
              {isPending ? 'Adding...' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}