'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RepairJob, JobStatus, Service, UsedService, Part, UsedPart } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Edit, 
  Save, 
  X,
  FileText,
  Plus,
  Trash2,
  Wrench,
  Printer
} from 'lucide-react';

import { ServiceSelector } from './service-selector';
import { PartPickerModal } from '@/components/parts/part-picker-modal';
import { GenerateInvoiceDialog } from './generate-invoice';
import { getParts } from '@/lib/actions/parts';
import { addPartToJob, removePartFromJob } from '@/lib/actions/repair-jobs';
import { useToast } from '@/hooks/use-toast';
import { printRepairInvoiceThermal, InvoicePrintData } from '@/lib/print-templates';

interface JobDetailViewProps {
  job: RepairJob;
  onUpdate?: (updatedJob: RepairJob) => void;
}

const jobStatuses: JobStatus[] = [
  'Waiting for Parts',
  'In Progress',
  'Ready for Pickup',
  'Completed',
  'Paid',
];

const getStatusColor = (status: JobStatus) => {
  switch (status) {
    case 'Waiting for Parts':
      return 'destructive';
    case 'In Progress':
      return 'default';
    case 'Ready for Pickup':
      return 'secondary';
    case 'Completed':
      return 'outline';
    case 'Paid':
      return 'secondary';
    default:
      return 'outline';
  }
};

export function JobDetailView({ job, onUpdate }: JobDetailViewProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState<RepairJob>({
    ...job,
    usedServices: job.usedServices || [] // Initialize empty array if not present
  });
  const [newNote, setNewNote] = useState('');
  const [newInternalNote, setNewInternalNote] = useState('');
  const [isPartPickerOpen, setIsPartPickerOpen] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);

  // Exit edit mode if job becomes paid
  useEffect(() => {
    if (job.isPaid && isEditing) {
      setIsEditing(false);
    }
  }, [job.isPaid, isEditing]);

  const handleEditClick = () => {
    if (job.isPaid) {
      return; // Prevent editing paid jobs
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate?.(editedJob);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedJob(job);
    setIsEditing(false);
  };

  const addTechnicianNote = () => {
    if (newNote.trim()) {
      setEditedJob({
        ...editedJob,
        technicianNotes: [...editedJob.technicianNotes, newNote.trim()],
      });
      setNewNote('');
    }
  };

  const addInternalNote = () => {
    if (newInternalNote.trim()) {
      setEditedJob({
        ...editedJob,
        internalNotes: [...editedJob.internalNotes, newInternalNote.trim()],
      });
      setNewInternalNote('');
    }
  };

  const handlePrintInvoice = () => {
    if (!job.isPaid) return;

    try {
      // Calculate costs using services
      const partsPrice = job.usedParts?.reduce((total, part) => total + (part.price * part.quantity), 0) || 0;
      const servicesCost = job.usedServices?.reduce((total, service) => total + service.total, 0) || 0;
      const laborCost = servicesCost || job.laborCost || 0;
      const totalAmount = partsPrice + laborCost;

      const printData: InvoicePrintData = {
        jobId: job.jobId,
        invoiceNumber: `REP-${job.jobId}`, // Use job ID as invoice number for display
        customerName: job.customerName,
        customerPhone: job.customerPhone,
        deviceInfo: `${job.deviceMake} ${job.deviceModel}`,
        problemDescription: job.problemDescription,
        laborCost: laborCost,
        partsCost: partsPrice,
        totalAmount: totalAmount,
        paymentMethod: 'Paid', // Since it's already paid
        paidAmount: totalAmount,
        profit: 0, // We don't calculate profit in the print view
        createdAt: job.createdAt,
        usedParts: job.usedParts?.map(part => ({
          partName: part.partName,
          quantity: part.quantity,
          cost: part.price, // Use price for customer invoice
          total: part.price * part.quantity
        })) || [],
        usedServices: job.usedServices?.map(service => ({
          serviceName: service.serviceName,
          quantity: service.quantity,
          price: service.price,
          total: service.total
        })) || []
      };

      printRepairInvoiceThermal(printData);
      
      toast({
        title: 'Thermal Receipt Printed',
        description: `Compact receipt for Job ${job.jobId} has been sent to the thermal printer.`,
      });
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast({
        title: 'Print Error',
        description: 'Failed to print invoice. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Load parts when component mounts
  useEffect(() => {
    const loadParts = async () => {
      try {
        const partsData = await getParts();
        setParts(partsData);
      } catch (error) {
        console.error('Error loading parts:', error);
      }
    };
    loadParts();
  }, []);

  const handlePartSelected = async (part: Part) => {
    try {
      // Use the proper API function to add part to job
      const result = await addPartToJob(job.id, part.id, 1);
      
      if (result.success) {
        // Update local state to reflect the change immediately
        const existingPartIndex = editedJob.usedParts.findIndex(p => p.partId === part.id);
        
        if (existingPartIndex >= 0) {
          // Update existing part quantity
          const updatedParts = [...editedJob.usedParts];
          updatedParts[existingPartIndex] = {
            ...updatedParts[existingPartIndex],
            quantity: updatedParts[existingPartIndex].quantity + 1,
            total: (updatedParts[existingPartIndex].quantity + 1) * updatedParts[existingPartIndex].price
          };
          setEditedJob({ ...editedJob, usedParts: updatedParts });
        } else {
          // Add new part
          const newUsedPart: UsedPart = {
            partId: part.id,
            partName: part.name,
            quantity: 1,
            cost: part.avgCost || 0,
            price: part.price || 0,
            total: part.price || 0
          };
          setEditedJob({ 
            ...editedJob, 
            usedParts: [...editedJob.usedParts, newUsedPart] 
          });
        }
        
        // Notify parent component of the change
        if (onUpdate) {
          onUpdate(editedJob);
        }
        
        toast({
          title: 'Part Added',
          description: `${part.name} has been added to the job`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to add part to job',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding part:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
    
    setIsPartPickerOpen(false);
  };

  const handleRemovePart = async (partId: string, partName: string) => {
    try {
      console.log('Removing part:', partId, partName, 'from job:', job.id);
      const result = await removePartFromJob(job.id, partId, 1);
      console.log('Remove result:', result);
      
      if (result.success) {
        // Update local state to reflect the change immediately
        const existingPartIndex = editedJob.usedParts.findIndex(p => p.partId === partId);
        
        if (existingPartIndex >= 0) {
          const existingPart = editedJob.usedParts[existingPartIndex];
          let updatedParts = [...editedJob.usedParts];
          
          if (existingPart.quantity > 1) {
            // Decrease quantity by 1
            updatedParts[existingPartIndex] = {
              ...existingPart,
              quantity: existingPart.quantity - 1,
              total: (existingPart.quantity - 1) * existingPart.price
            };
          } else {
            // Remove the part completely
            updatedParts.splice(existingPartIndex, 1);
          }
          
          const newEditedJob = { ...editedJob, usedParts: updatedParts };
          setEditedJob(newEditedJob);
          
          // Notify parent component of the change
          if (onUpdate) {
            onUpdate(newEditedJob);
          }
          
          toast({
            title: 'Part Removed',
            description: `${partName} has been removed from the job`,
          });
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to remove part from job',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error removing part:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">{job.jobId}</h1>
          <Badge variant={getStatusColor(editedJob.status)} className="text-sm">
            {editedJob.status}
          </Badge>
          {job.isPaid && (
            <Badge variant="default" className="text-sm bg-green-600 hover:bg-green-700">
              PAID - READ ONLY
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleEditClick}
                disabled={job.isPaid}
                className={job.isPaid ? "opacity-50 cursor-not-allowed" : ""}
                title={job.isPaid ? "Cannot edit paid jobs" : "Edit job details"}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Job
              </Button>
              {!job.isPaid && (
                <GenerateInvoiceDialog 
                  job={job}
                  onInvoiceGenerated={() => {
                    // Refresh the job data after invoice is generated
                    if (onUpdate) {
                      onUpdate({ ...job, status: 'Paid', isPaid: true });
                    }
                    // Navigate back to jobs page to prevent further editing
                    router.push('/dashboard/jobs');
                  }}
                />
              )}
              {job.isPaid && (
                <Button 
                  variant="outline" 
                  onClick={handlePrintInvoice}
                  className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Invoice
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
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
                <div>
                  <Label>Customer Name</Label>
                  <div className="text-lg font-semibold">{job.customerName}</div>
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <div className="flex items-center space-x-2">
                    <span>{job.customerPhone}</span>
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle>Device Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Device</Label>
                  <div className="text-lg">{job.deviceMake} {job.deviceModel}</div>
                </div>
                {job.imei && (
                  <div>
                    <Label>IMEI</Label>
                    <div className="font-mono text-sm">{job.imei}</div>
                  </div>
                )}
              </div>
              
              <div>
                <Label>Device Conditions</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {job.deviceConditions.map((condition) => (
                    <Badge key={condition} variant="outline">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Problem Description</Label>
                {isEditing ? (
                  <Textarea
                    value={editedJob.problemDescription}
                    onChange={(e) => 
                      setEditedJob({...editedJob, problemDescription: e.target.value})
                    }
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {job.problemDescription}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Job Status & Cost */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Status</Label>
                  {isEditing ? (
                    <Select 
                      value={editedJob.status} 
                      onValueChange={(value: JobStatus) => 
                        setEditedJob({...editedJob, status: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {jobStatuses.map(status => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  )}
                </div>
                
                <div>
                  <Label>Estimated Cost</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editedJob.estimatedCost}
                      onChange={(e) => 
                        setEditedJob({
                          ...editedJob, 
                          estimatedCost: parseFloat(e.target.value)
                        })
                      }
                    />
                  ) : (
                    <div className="text-lg font-semibold">${job.estimatedCost}</div>
                  )}
                </div>
                
                {job.actualCost && (
                  <div>
                    <Label>Actual Cost</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editedJob.actualCost || ''}
                        onChange={(e) => 
                          setEditedJob({
                            ...editedJob, 
                            actualCost: parseFloat(e.target.value)
                          })
                        }
                      />
                    ) : (
                      <div className="text-lg font-semibold text-green-600">
                        ${job.actualCost}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Services Section */}
              {isEditing && (
                <div className="col-span-full">
                  <Label>Services</Label>
                  <ServiceSelector
                    selectedServices={editedJob.usedServices}
                    onServicesChange={(services) => 
                      setEditedJob({ ...editedJob, usedServices: services })
                    }
                  />
                </div>
              )}

              {/* Display services in read-only mode */}
              {!isEditing && editedJob.usedServices.length > 0 && (
                <div className="col-span-full">
                  <Label>Applied Services</Label>
                  <div className="mt-2 space-y-2">
                    {editedJob.usedServices.map((service) => (
                      <div key={service.serviceId} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div>
                          <div className="font-medium">{service.serviceName}</div>
                          <div className="text-sm text-muted-foreground">{service.serviceDescription}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {service.quantity} × ${service.price.toFixed(2)} = ${service.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-right font-bold">
                      Total Services: ${editedJob.usedServices.reduce((sum, s) => sum + s.total, 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                
                {job.priority && (
                  <div>
                    <Label>Priority</Label>
                    <Badge 
                      variant={
                        job.priority === 'Urgent' ? 'destructive' :
                        job.priority === 'High' ? 'default' : 'outline'
                      }
                    >
                      {job.priority}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Technician Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Technician Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editedJob.technicianNotes.map((note, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{note}</p>
                </div>
              ))}
              
              <div className="flex space-x-2">
                <Input
                  placeholder="Add technician note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTechnicianNote()}
                />
                <Button onClick={addTechnicianNote} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">Created</div>
                <div className="text-muted-foreground">
                  {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                </div>
              </div>
              
              <div className="text-sm">
                <div className="font-medium">Last Updated</div>
                <div className="text-muted-foreground">
                  {formatDistanceToNow(new Date(job.updatedAt), { addSuffix: true })}
                </div>
              </div>
              
              {job.completedAt && (
                <div className="text-sm">
                  <div className="font-medium">Completed</div>
                  <div className="text-muted-foreground">
                    {formatDistanceToNow(new Date(job.completedAt), { addSuffix: true })}
                  </div>
                </div>
              )}
              
              {job.paidAt && (
                <div className="text-sm">
                  <div className="font-medium">Paid</div>
                  <div className="text-muted-foreground">
                    {formatDistanceToNow(new Date(job.paidAt), { addSuffix: true })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parts Used */}
          <Card>
            <CardHeader>
              <CardTitle>Parts Used</CardTitle>
            </CardHeader>
            <CardContent>
              {editedJob.usedParts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No parts used yet</p>
              ) : (
                <div className="space-y-3">
                  {editedJob.usedParts.map((part, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{part.partName}</div>
                          <div className="text-xs text-muted-foreground">
                            Qty: {part.quantity} • Cost: ${part.cost} • Price: ${part.price}
                          </div>
                          <div className="text-sm font-medium mt-1">
                            Total: ${part.total}
                          </div>
                        </div>
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePart(part.partId, part.partName)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {isEditing && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => setIsPartPickerOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Part
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editedJob.internalNotes.map((note, index) => (
                <div key={index} className="p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <p className="text-sm">{note}</p>
                </div>
              ))}
              
              <div className="flex space-x-2">
                <Input
                  placeholder="Add internal note..."
                  value={newInternalNote}
                  onChange={(e) => setNewInternalNote(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addInternalNote()}
                />
                <Button onClick={addInternalNote} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Part Picker Modal */}
      <PartPickerModal
        open={isPartPickerOpen}
        onOpenChange={setIsPartPickerOpen}
        parts={parts}
        onPartSelected={handlePartSelected}
        title="Add Part to Job"
        description="Select a part to add to this repair job"
      />
    </div>
  );
}