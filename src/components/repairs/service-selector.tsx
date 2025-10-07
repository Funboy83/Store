'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Wrench, Minus, DollarSign, Clock } from 'lucide-react';
import { Service, UsedService } from '@/lib/types';
import { getActiveServices, getServices, createService } from '@/lib/actions/services';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServiceSelectorProps {
  selectedServices: UsedService[];
  onServicesChange: (services: UsedService[]) => void;
}

const categoryColors = {
  'Labor': 'bg-blue-100 text-blue-800',
  'Diagnostic': 'bg-purple-100 text-purple-800',
  'Repair': 'bg-green-100 text-green-800', 
  'Installation': 'bg-orange-100 text-orange-800',
  'Other': 'bg-gray-100 text-gray-800',
};

export function ServiceSelector({ selectedServices, onServicesChange }: ServiceSelectorProps) {
  const { toast } = useToast();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // New service form
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    category: 'Labor' as Service['category'],
    price: 0,
    estimatedTime: 60,
  });

  useEffect(() => {
    if (isPickerOpen) {
      loadServices();
    }
  }, [isPickerOpen]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices(services);
    }
  }, [searchTerm, services]);

  const loadServices = async () => {
    setLoading(true);
    try {
      console.log('Loading services...');
      const servicesData = await getActiveServices();
      console.log('Services loaded:', servicesData.length, 'services');
      setServices(servicesData);
      setFilteredServices(servicesData);
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        title: 'Error',
        description: 'Failed to load services',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = (service: Service) => {
    // Check if service is already selected
    const existingService = selectedServices.find(s => s.serviceId === service.id);
    
    if (existingService) {
      // Increase quantity
      const updatedServices = selectedServices.map(s => 
        s.serviceId === service.id 
          ? { ...s, quantity: s.quantity + 1, total: (s.quantity + 1) * s.price }
          : s
      );
      onServicesChange(updatedServices);
    } else {
      // Add new service
      const newUsedService: UsedService = {
        serviceId: service.id,
        serviceName: service.name,
        serviceDescription: service.description,
        price: service.price,
        quantity: 1,
        total: service.price,
      };
      onServicesChange([...selectedServices, newUsedService]);
    }

    toast({
      title: 'Service Added',
      description: `${service.name} added to job`,
    });
  };

  const handleRemoveService = (serviceId: string) => {
    const updatedServices = selectedServices.filter(s => s.serviceId !== serviceId);
    onServicesChange(updatedServices);
  };

  const handleQuantityChange = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveService(serviceId);
      return;
    }

    const updatedServices = selectedServices.map(s => 
      s.serviceId === serviceId 
        ? { ...s, quantity, total: quantity * s.price }
        : s
    );
    onServicesChange(updatedServices);
  };

  const handlePriceChange = (serviceId: string, price: number) => {
    const updatedServices = selectedServices.map(s => 
      s.serviceId === serviceId 
        ? { ...s, price, total: s.quantity * price }
        : s
    );
    onServicesChange(updatedServices);
  };

  const handleCreateService = async () => {
    if (!newService.name || !newService.description || newService.price <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields with valid values',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await createService({
        ...newService,
        isActive: true,
      });

      if (result.success) {
        toast({
          title: 'Service Created',
          description: `${newService.name} created successfully`,
        });

        // Reset form
        setNewService({
          name: '',
          description: '',
          category: 'Labor',
          price: 0,
          estimatedTime: 60,
        });

        setIsCreateOpen(false);
        loadServices(); // Refresh services list
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating service:', error);
      toast({
        title: 'Error',
        description: `Failed to create service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Selected Services Display */}
      {selectedServices.length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Selected Services ({selectedServices.length})
          </h4>
          <div className="space-y-2">
            {selectedServices.map((service) => (
              <div key={service.serviceId} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                <div className="flex-1">
                  <div className="font-medium">{service.serviceName}</div>
                  <div className="text-sm text-muted-foreground">
                    {service.serviceDescription}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Qty:</Label>
                  <Input
                    type="number"
                    min="1"
                    value={service.quantity}
                    onChange={(e) => handleQuantityChange(service.serviceId, parseInt(e.target.value) || 1)}
                    className="w-16"
                  />
                  <Label className="text-xs">Price:</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={service.price}
                    onChange={(e) => handlePriceChange(service.serviceId, parseFloat(e.target.value) || 0)}
                    className="w-20"
                  />
                  <div className="font-medium min-w-16 text-right">
                    ${service.total.toFixed(2)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveService(service.serviceId)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="text-right font-bold">
              Total Services: ${selectedServices.reduce((sum, service) => sum + service.total, 0).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Add Services Buttons */}
      <div className="flex gap-2">
        <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Wrench className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Select Services
              </DialogTitle>
              <DialogDescription>
                Choose services to add to this job
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services by name, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Services Table */}
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading services...</p>
                    </div>
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="text-center py-8">
                    <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? `No services found matching "${searchTerm}"` : 'No services available'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Est. Time</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{service.name}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {service.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={categoryColors[service.category]}>
                              {service.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 font-medium">
                              <DollarSign className="h-3 w-3" />
                              {service.price.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {service.estimatedTime && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {service.estimatedTime}m
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleAddService(service)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create New Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
              <DialogDescription>
                Create a new service that can be reused for other jobs
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Service Name *</Label>
                  <Input
                    placeholder="e.g., Screen Replacement"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select 
                    value={newService.category} 
                    onValueChange={(value: Service['category']) => setNewService({ ...newService, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Labor">Labor</SelectItem>
                      <SelectItem value="Diagnostic">Diagnostic</SelectItem>
                      <SelectItem value="Repair">Repair</SelectItem>
                      <SelectItem value="Installation">Installation</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description *</Label>
                <Textarea
                  placeholder="Describe what this service includes..."
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price ($) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Est. Time (minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="60"
                    value={newService.estimatedTime}
                    onChange={(e) => setNewService({ ...newService, estimatedTime: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateService}>
                Create Service
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}