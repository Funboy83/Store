'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SalesChartData } from '@/lib/actions/dashboard';

interface SalesChartProps {
  data: SalesChartData[];
}

export function SalesChart({ data }: SalesChartProps) {
  const formatTooltipValue = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatYAxisValue = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Monthly revenue for {new Date().getFullYear()}
        </p>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxisValue}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
              contentStyle={{ 
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)'
              }}
              formatter={(value: number) => [formatTooltipValue(value), 'Revenue']}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {data.length === 0 && (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            No sales data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
