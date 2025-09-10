
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { addCustomer } from '@/lib/actions/customers';
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
  DialogClose,
} from '@/components/ui/dialog';

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? 'Adding...' : 'Add Customer'}</Button>;
}

interface AddCustomerFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function AddCustomerForm({ isOpen, onOpenChange }: AddCustomerFormProps) {
    const { toast } = useToast();
    const initialState = { errors: {}, success: false };
    const [state, dispatch] = useActionState(addCustomer, initialState);

    useEffect(() => {
        if (state.success) {
            toast({
                title: 'Success!',
                description: 'New customer has been added.',
            });
            onOpenChange(false);
        }
        if (state.errors?._form) {
            toast({
                title: 'Error',
                description: state.errors._form.join(', '),
                variant: 'destructive',
            });
        }
    }, [state, onOpenChange, toast]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>
                        Fill in the details to add a new customer.
                    </DialogDescription>
                </DialogHeader>
                <form action={dispatch} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Customer Name (Required)</Label>
                        <Input id="name" name="name" placeholder="e.g. John Doe" />
                        {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (Required)</Label>
                        <Input id="phone" name="phone" type="tel" placeholder="e.g. 555-123-4567" />
                        {state.errors?.phone && <p className="text-sm text-destructive">{state.errors.phone}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="e.g. john.doe@example.com" />
                        {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" name="notes" placeholder="Any relevant notes about the customer..." />
                        {state.errors?.notes && <p className="text-sm text-destructive">{state.errors.notes}</p>}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="ghost">Cancel</Button>
                        </DialogClose>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
