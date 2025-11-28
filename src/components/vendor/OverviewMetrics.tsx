import { DollarSign, Clock, UserPlus, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OverviewMetricsProps {
  revenueGenerated: number;
  pendingPayouts: number;
  newPartners: number;
}

export default function OverviewMetrics({ revenueGenerated, pendingPayouts, newPartners }: OverviewMetricsProps) {
  const metrics = [
    {
      label: 'Revenue Generated',
      value: `$${revenueGenerated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-800',
    },
    {
      label: 'Pending Payouts',
      value: `$${pendingPayouts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-800',
    },
    {
      label: 'New Partners',
      value: newPartners.toLocaleString(),
      icon: UserPlus,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-800',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={index}
            className={cn(
              "bg-black/80 backdrop-blur-xl border rounded-lg p-6",
              metric.borderColor
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={cn("w-5 h-5", metric.color)} />
              <div className={cn("w-2 h-2 rounded-full", metric.bgColor)} />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
              <p className="text-sm text-gray-400">{metric.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

