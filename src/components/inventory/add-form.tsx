
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addProduct } from '@/lib/actions/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AddableCombobox } from './addable-combobox';
import {
  getBrandOptions, addBrandOption,
  getStorageOptions, addStorageOption,
  getColorOptions, addColorOption,
  getCarrierOptions, addCarrierOption,
  getGradeOptions, addGradeOption
} from '@/lib/actions/options';

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
                        <AddableCombobox
                            formControlName="brand"
                            label="Brand"
                            fetchOptions={getBrandOptions}
                            addOption={addBrandOption}
                            error={state.errors?.brand}
                        />
                        <div className="space-y-2">
                            <Label htmlFor="model">Model</Label>
                            <Input id="model" name="model" placeholder="e.g. iPhone 15 Pro" />
                            {state.errors?.model && <p className="text-sm text-destructive">{state.errors.model}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <AddableCombobox
                            formControlName="storage"
                            label="Storage"
                            fetchOptions={getStorageOptions}
                            addOption={addStorageOption}
                            error={state.errors?.storage}
                        />
                        <AddableCombobox
                            formControlName="color"
                            label="Color"
                            fetchOptions={getColorOptions}
                            addOption={addColorOption}
                            error={state.errors?.color}
                        />
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AddableCombobox
                            formControlName="carrier"
                            label="Carrier"
                            fetchOptions={getCarrierOptions}
                            addOption={addCarrierOption}
                            error={state.errors?.carrier}
                        />
                        <AddableCombobox
                            formControlName="grade"
                            label="Grade"
                            fetchOptions={getGradeOptions}
                            addOption={addGradeOption}
                            error={state.errors?.grade}
                        />
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
