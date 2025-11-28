import { useState } from 'react';
import { Calendar, Eye, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  date: string;
  clicks: number;
  conversions: number;
}

interface PerformanceChartProps {
  data: ChartDataPoint[];
  dateRange: string;
}

export default function PerformanceChart({ data, dateRange }: PerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<'clicks' | 'conversions' | 'both'>('both');

  // Find max value for scaling
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.clicks, d.conversions)),
    1
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Performance Overview</h2>
          <p className="text-sm text-gray-400">Clicks vs Conversions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/50 border border-gray-700 rounded-md">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">{dateRange}</span>
          </div>
          <button className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-md hover:bg-gray-900/50 transition">
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64 mb-4">
        <div className="absolute inset-0 flex flex-col justify-between">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between px-2">
            {[0, 25, 50, 75, 100].map((percent) => {
              const value = Math.round((maxValue * (100 - percent)) / 100);
              return (
                <span key={percent} className="text-xs text-gray-500">
                  {value}
                </span>
              );
            })}
          </div>

          {/* Chart area with padding for labels */}
          <div className="ml-12 mr-4 flex-1 relative">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((percent) => (
                <line
                  key={percent}
                  x1="0"
                  y1={percent}
                  x2="100"
                  y2={percent}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="0.5"
                />
              ))}

              {/* Clicks line */}
              {selectedMetric === 'clicks' || selectedMetric === 'both' ? (
                <polyline
                  points={data.map((d, i) => {
                    const x = (i / (data.length - 1 || 1)) * 100;
                    const y = 100 - (d.clicks / maxValue) * 100;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}

              {/* Conversions line */}
              {selectedMetric === 'conversions' || selectedMetric === 'both' ? (
                <polyline
                  points={data.map((d, i) => {
                    const x = (i / (data.length - 1 || 1)) * 100;
                    const y = 100 - (d.conversions / maxValue) * 100;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="2 2"
                />
              ) : null}
            </svg>
          </div>

          {/* X-axis dates */}
          <div className="ml-12 mr-4 flex justify-between px-2 mt-2">
            {data.map((d, i) => {
              if (i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) {
                return (
                  <span key={i} className="text-xs text-gray-500">
                    {formatDate(d.date)}
                  </span>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
        <button
          onClick={() => setSelectedMetric(selectedMetric === 'clicks' ? 'both' : 'clicks')}
          className={cn(
            "flex items-center gap-2 text-sm transition",
            (selectedMetric === 'clicks' || selectedMetric === 'both') ? "text-white" : "text-gray-400 hover:text-gray-300"
          )}
        >
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Clicks</span>
        </button>
        <button
          onClick={() => setSelectedMetric(selectedMetric === 'conversions' ? 'both' : 'conversions')}
          className={cn(
            "flex items-center gap-2 text-sm transition",
            (selectedMetric === 'conversions' || selectedMetric === 'both') ? "text-white" : "text-gray-400 hover:text-gray-300"
          )}
        >
          <div className="w-3 h-3 border-2 border-green-500 border-dashed" />
          <span>Conversions</span>
        </button>
      </div>
    </div>
  );
}

