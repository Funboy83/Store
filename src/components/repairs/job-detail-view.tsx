'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RepairJob, JobStatus } from '@/lib/types';
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
  Trash2
} from 'lucide-react';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState<RepairJob>(job);
  const [newNote, setNewNote] = useState('');
  const [newInternalNote, setNewInternalNote] = useState('');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">{job.jobId}</h1>
          <Badge variant={getStatusColor(editedJob.status)} className="text-sm">
            {editedJob.status}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Job
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generate Invoice
              </Button>
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

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Labor Cost</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editedJob.laborCost}
                      onChange={(e) => 
                        setEditedJob({
                          ...editedJob, 
                          laborCost: parseFloat(e.target.value)
                        })
                      }
                    />
                  ) : (
                    <div>${job.laborCost}</div>
                  )}
                </div>
                
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
              {job.usedParts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No parts used yet</p>
              ) : (
                <div className="space-y-3">
                  {job.usedParts.map((part, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">{part.partName}</div>
                      <div className="text-xs text-muted-foreground">
                        Qty: {part.quantity} • Cost: ${part.cost} • Price: ${part.price}
                      </div>
                      <div className="text-sm font-medium mt-1">
                        Total: ${part.total}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <Button variant="outline" size="sm" className="w-full mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Add Part
              </Button>
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
    </div>
  );
}