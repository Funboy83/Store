
'use client';

import { useActionState, useEffect, useState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addProduct, checkImeiExists } from '@/lib/actions/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AddableCombobox } from './addable-combobox';
import { debounce } from 'lodash';
import {
  getBrandOptions, addBrandOption,
  getStorageOptions, addStorageOption,
  getColorOptions, addColorOption,
  getCarrierOptions, addCarrierOption,
  getGradeOptions, addGradeOption
} from '@/lib/actions/options';
import { CheckCircle, XCircle, Loader, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending || disabled}>{pending ? 'Adding...' : 'Add Product'}</Button>;
}

export function AddInventoryForm() {
    const router = useRouter();
    const { toast } = useToast();
    const initialState = { errors: {}, success: false };
    const [state, dispatch] = useActionState(addProduct, initialState);
    
    const [imei, setImei] = useState('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isImeiChecking, setIsImeiChecking] = useState(false);
    const [isImeiDuplicate, setIsImeiDuplicate] = useState<boolean | null>(null);

    const debouncedCheck = useCallback(
      debounce(async (currentImei: string) => {
        if (currentImei.length < 15) {
          setIsImeiDuplicate(null);
          setIsImeiChecking(false);
          return;
        }
        setIsImeiChecking(true);
        const exists = await checkImeiExists(currentImei);
        setIsImeiDuplicate(exists);
        setIsImeiChecking(false);
      }, 500),
      []
    );

    useEffect(() => {
        debouncedCheck(imei);
    }, [imei, debouncedCheck]);

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

    const handleImeiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newImei = e.target.value.replace(/[^0-9]/g, '').slice(0, 15);
      setImei(newImei);
    };

    return (
        <form action={dispatch}>
            <input type="hidden" name="date" value={date ? format(date, 'yyyy-MM-dd') : ''} />
            <Card>
                <CardHeader>
                    <CardTitle>Add New Product</CardTitle>
                    <CardDescription>Fill in the details of the new product.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="imei">IMEI</Label>
                        <div className="relative">
                            <Input 
                                id="imei" 
                                name="imei" 
                                placeholder="e.g. 123456789012345" 
                                value={imei}
                                onChange={handleImeiChange}
                                maxLength={15}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                {isImeiChecking && <Loader className="h-5 w-5 text-gray-400 animate-spin" />}
                                {isImeiDuplicate === false && imei.length === 15 && <CheckCircle className="h-5 w-5 text-green-500" />}
                                {isImeiDuplicate === true && <XCircle className="h-5 w-5 text-destructive" />}
                            </div>
                        </div>
                        {state.errors?.imei && <p className="text-sm text-destructive">{state.errors.imei}</p>}
                        {isImeiDuplicate && <p className="text-sm text-destructive">This IMEI already exists in the inventory.</p>}
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
                            <Label htmlFor="price">Purchase Price</Label>
                            <Input id="price" name="price" type="number" step="0.01" placeholder="e.g. 999.99" />
                            {state.errors?.price && <p className="text-sm text-destructive">{state.errors.price}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="battery">Battery Health (%)</Label>
                            <Input id="battery" name="battery" type="number" placeholder="e.g. 98" />
                            {state.errors?.battery && <p className="text-sm text-destructive">{state.errors.battery}</p>}
                        </div>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date Added</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {state.errors?.date && <p className="text-sm text-destructive">{state.errors.date}</p>}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <SubmitButton disabled={!!isImeiDuplicate || imei.length !== 15} />
                </CardFooter>
            </Card>
        </form>
    );
}
