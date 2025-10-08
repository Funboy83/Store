import { Suspense } from 'react';
import { Plus, Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GeneralInventoryDataTable } from '@/components/general-inventory/data-table';
import { columns } from '@/components/general-inventory/columns';
import { getGeneralItems, getGeneralItemsStats } from '@/lib/actions/general-inventory';
import { getCategoriesWithSubCategories } from '@/lib/actions/categories';
import { GeneralItem, CategoryWithSubCategories } from '@/lib/types';

// Enhanced type for display with resolved category names
type GeneralItemWithCategoryNames = GeneralItem & {
  categoryName?: string;
  subCategoryName?: string;
};

async function GeneralInventoryStats() {
  const stats = await getGeneralItemsStats();
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalItems}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to find category names
function findCategoryNames(categoryId: string, subCategoryId: string | undefined, categories: CategoryWithSubCategories[]) {
  const category = categories.find(cat => cat.id === categoryId);
  if (!category) return { categoryName: categoryId, subCategoryName: subCategoryId };
  
  const subCategory = subCategoryId 
    ? category.subCategories.find(sub => sub.id === subCategoryId)
    : null;
  
  return {
    categoryName: category.name,
    subCategoryName: subCategory?.name || subCategoryId
  };
}

async function GeneralInventoryTable() {
  const [items, categories] = await Promise.all([
    getGeneralItems(),
    getCategoriesWithSubCategories()
  ]);
  
  // Enhance items with category names for display
  const enhancedItems = items.map((item: GeneralItem) => {
    if (!item.categoryId) return item;
    
    const { categoryName, subCategoryName } = findCategoryNames(
      item.categoryId, 
      item.subCategoryId, 
      categories
    );
    
    return {
      ...item,
      categoryName,
      subCategoryName
    };
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Inventory</CardTitle>
        <CardDescription>
          Manage your general inventory items with FIFO tracking system
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[600px]">
        <GeneralInventoryDataTable columns={columns} data={enhancedItems} />
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Inventory</CardTitle>
        <CardDescription>
          Manage your general inventory items with FIFO tracking system
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading general inventory...</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GeneralInventoryPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">General Inventory</h1>
          <p className="text-muted-foreground">
            Manage your general inventory with category organization and FIFO tracking
          </p>
        </div>
        <Link href="/dashboard/general-inventory/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </Link>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <GeneralInventoryStats />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <GeneralInventoryTable />
      </Suspense>
    </div>
  );
}