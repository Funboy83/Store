import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, Users, Package } from "lucide-react";
import type { DashboardStats } from "@/lib/actions/dashboard";

interface StatsCardsProps {
    stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const formatGrowth = (growth: number | undefined) => {
        if (growth === undefined) return "No data";
        const sign = growth > 0 ? "+" : "";
        return `${sign}${growth.toFixed(1)}%`;
    };

    const getGrowthColor = (growth: number | undefined) => {
        if (growth === undefined) return "text-muted-foreground";
        return growth >= 0 ? "text-green-600" : "text-red-600";
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <p className={`text-xs ${getGrowthColor(stats.revenueGrowth)}`}>
                  {formatGrowth(stats.revenueGrowth)} from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSales.toLocaleString()}</div>
                <p className={`text-xs ${getGrowthColor(stats.salesGrowth)}`}>
                  {formatGrowth(stats.salesGrowth)} from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCustomers.toLocaleString()}</div>
                <p className={`text-xs ${getGrowthColor(stats.customersGrowth)}`}>
                  {formatGrowth(stats.customersGrowth)} from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Inventory</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInventory.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Items in stock
                </p>
              </CardContent>
            </Card>
        </div>
    )
}
