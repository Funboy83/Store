'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

interface PartsStatsCardsProps {
  stats: {
    totalParts: number;
    totalValue: number;
    lowStock: number;
    outOfStock: number;
    categories: Record<string, number>;
  };
}

export function PartsStatsCards({ stats }: PartsStatsCardsProps) {
  const statCards = [
    {
      title: 'Total Parts',
      value: stats.totalParts,
      icon: Package,
      description: 'Parts in inventory',
      variant: 'default' as const,
    },
    {
      title: 'Inventory Value',
      value: `$${stats.totalValue.toLocaleString()}`,
      icon: DollarSign,
      description: 'Total cost value',
      variant: 'default' as const,
    },
    {
      title: 'Low Stock',
      value: stats.lowStock,
      icon: AlertTriangle,
      description: 'Parts need restocking',
      variant: stats.lowStock > 0 ? 'warning' : 'default' as const,
    },
    {
      title: 'Out of Stock',
      value: stats.outOfStock,
      icon: TrendingUp,
      description: 'Parts unavailable',
      variant: stats.outOfStock > 0 ? 'destructive' : 'default' as const,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}