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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Product Name</Label>
                            <Input id="name" name="name" placeholder="e.g. iPhone 15 Pro" />
                            {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brand">Brand</Label>
                            <Input id="brand" name="brand" placeholder="e.g. Apple" />
                            {state.errors?.brand && <p className="text-sm text-destructive">{state.errors.brand}</p>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Input id="model" name="model" placeholder="e.g. A2849" />
                        {state.errors?.model && <p className="text-sm text-destructive">{state.errors.model}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price</Label>
                            <Input id="price" name="price" type="number" step="0.01" placeholder="e.g. 999.99" />
                            {state.errors?.price && <p className="text-sm text-destructive">{state.errors.price}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stock">Stock Quantity</Label>
                            <Input id="stock" name="stock" type="number" placeholder="e.g. 100" />
                            {state.errors?.stock && <p className="text-sm text-destructive">{state.errors.stock}</p>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input id="imageUrl" name="imageUrl" placeholder="https://..." defaultValue="https://picsum.photos/seed/newphone/400/400" />
                        {state.errors?.imageUrl && <p className="text-sm text-destructive">{state.errors.imageUrl}</p>}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <SubmitButton />
                </CardFooter>
            </Card>
        </form>
    );
}
