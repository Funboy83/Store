'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JobStats } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Clock, Package, CheckCircle2, AlertCircle } from 'lucide-react';

interface RepairStatsCardsProps {
  stats: JobStats;
}

export function RepairStatsCards({ stats }: RepairStatsCardsProps) {
  const statCards = [
    {
      title: 'Total Jobs',
      value: stats.total,
      icon: Package,
      description: 'All repair jobs',
      variant: 'default' as const,
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      description: 'Currently being worked on',
      variant: 'warning' as const,
    },
    {
      title: 'Ready for Pickup',
      value: stats.readyForPickup,
      icon: CheckCircle2,
      description: 'Completed & ready',
      variant: 'success' as const,
    },
    {
      title: 'Waiting for Parts',
      value: stats.waitingForParts,
      icon: AlertCircle,
      description: 'Pending parts delivery',
      variant: 'destructive' as const,
    },
  ];

  const getBadgeVariant = (variant: string) => {
    switch (variant) {
      case 'warning':
        return 'default';
      case 'success':
        return 'secondary';
      case 'destructive':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">{card.value}</div>
                <Badge variant={getBadgeVariant(card.variant)} className="text-xs">
                  {card.variant === 'warning' && 'Active'}
                  {card.variant === 'success' && 'Ready'}
                  {card.variant === 'destructive' && 'Waiting'}
                  {card.variant === 'default' && 'Total'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}