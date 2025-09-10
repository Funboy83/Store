
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addProduct } from '@/lib/actions/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? 'Adding...' : 'Add Product'}</Button>;
}

export function AddInventoryForm() {
    const router = useRouter();
    const { toast } = useToast();
    const initialState = { errors: {}, success: false };
    const [state, dispatch] = useFormState(addProduct, initialState);

    useEffect(() => {
        if (state.success) {
            toast({
                title: 'Success!',
                description: 'New product has been added to the inventory.',
            });
            router.push('/dashboard/inventory');
        }
        if (state.errors?._form) {
            toast({
                title: 'Error',
                description: state.errors._form.join(', '),
                variant: 'destructive',
            });
        }
    }, [state, router, toast]);

    return (
        <form action={dispatch}>
            <Card>
                <CardHeader>
                    <CardTitle>Add New Product</CardTitle>
                    <CardDescription>Fill in the details of the new product.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="imei">IMEI</Label>
                        <Input id="imei" name="imei" placeholder="e.g. 123456789012345" />
                        {state.errors?.imei && <p className="text-sm text-destructive">{state.errors.imei}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="brand">Brand</Label>
                            <Input id="brand" name="brand" placeholder="e.g. Apple" />
                            {state.errors?.brand && <p className="text-sm text-destructive">{state.errors.brand}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="model">Model</Label>
                            <Input id="model" name="model" placeholder="e.g. iPhone 15 Pro" />
                            {state.errors?.model && <p className="text-sm text-destructive">{state.errors.model}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="storage">Storage</Label>
                            <Input id="storage" name="storage" placeholder="e.g. 256GB" />
                            {state.errors?.storage && <p className="text-sm text-destructive">{state.errors.storage}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="color">Color</Label>
                            <Input id="color" name="color" placeholder="e.g. Space Black" />
                            {state.errors?.color && <p className="text-sm text-destructive">{state.errors.color}</p>}
                        </div>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="carrier">Carrier</Label>
                            <Input id="carrier" name="carrier" placeholder="e.g. Unlocked" />
                            {state.errors?.carrier && <p className="text-sm text-destructive">{state.errors.carrier}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="grade">Grade</Label>
                            <Input id="grade" name="grade" placeholder="e.g. A" />
                            {state.errors?.grade && <p className="text-sm text-destructive">{state.errors.grade}</p>}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price</Label>
                            <Input id="price" name="price" type="number" step="0.01" placeholder="e.g. 999.99" />
                            {state.errors?.price && <p className="text-sm text-destructive">{state.errors.price}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="battery">Battery Health (%)</Label>
                            <Input id="battery" name="battery" type="number" placeholder="e.g. 98" />
                            {state.errors?.battery && <p className="text-sm text-destructive">{state.errors.battery}</p>}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <SubmitButton />
                </CardFooter>
            </Card>
        </form>
    );
}
