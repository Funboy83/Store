'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createSupplier } from '@/lib/actions/suppliers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface AddSupplierFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddSupplierForm({ open, onOpenChange }: AddSupplierFormProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        contactPerson: '',
        website: '',
        paymentTerms: '',
        taxId: '',
        notes: ''
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Supplier name is required.',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        
        try {
            const result = await createSupplier({
                name: formData.name,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
                address: formData.address || undefined,
                contactPerson: formData.contactPerson || undefined,
                website: formData.website || undefined,
                paymentTerms: formData.paymentTerms || undefined,
                taxId: formData.taxId || undefined,
                notes: formData.notes || undefined
            });

            if (result.success) {
                toast({
                    title: 'Success!',
                    description: 'New supplier has been added.',
                });
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    contactPerson: '',
                    website: '',
                    paymentTerms: '',
                    taxId: '',
                    notes: ''
                });
                onOpenChange(false);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to add supplier.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error adding supplier:', error);
            toast({
                title: 'Error',
                description: 'Failed to add supplier.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Supplier</DialogTitle>
                    <DialogDescription>
                        Fill in the details to add a new supplier.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Supplier Name (Required)</Label>
                        <Input 
                            id="name" 
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="e.g. ABC Parts Supply" 
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contactPerson">Contact Person</Label>
                        <Input 
                            id="contactPerson" 
                            value={formData.contactPerson}
                            onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                            placeholder="e.g. John Smith" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                            id="phone" 
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            type="tel" 
                            placeholder="e.g. 555-123-4567" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email" 
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            type="email" 
                            placeholder="e.g. contact@abcparts.com" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input 
                            id="address" 
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            placeholder="e.g. 123 Business Ave, City, State" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input 
                            id="website" 
                            value={formData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            placeholder="e.g. www.abcparts.com" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="paymentTerms">Payment Terms</Label>
                        <Input 
                            id="paymentTerms" 
                            value={formData.paymentTerms}
                            onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                            placeholder="e.g. Net 30" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="taxId">Tax ID</Label>
                        <Input 
                            id="taxId" 
                            value={formData.taxId}
                            onChange={(e) => handleInputChange('taxId', e.target.value)}
                            placeholder="e.g. 12-3456789" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea 
                            id="notes" 
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder="Additional notes about the supplier..." 
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Supplier'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}