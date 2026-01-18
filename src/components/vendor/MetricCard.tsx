import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: number;
    href?: string;
}

export function MetricCard({ title, value, subtitle, trend, href }: MetricCardProps) {
    const isPositiveTrend = trend !== undefined && trend >= 0;

    return (
        <div className="relative group">
            <div className="bg-gradient-to-br from-[#0f0e21] to-[#1a1929] rounded-2xl p-6 border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,75,0,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(255,75,0,0.08)] h-full">
                {/* Header */}
                <div className="mb-4">
                    <span className="text-xs uppercase tracking-wider text-[#9ca3af] font-medium">
                        {title}
                    </span>
                </div>

                {/* Value */}
                <div className="mb-4">
                    <div className="text-3xl font-bold text-white mb-1">
                        {value}
                    </div>
                    {subtitle && (
                        <div className="text-xs text-[#6b7280]">
                            {subtitle}
                        </div>
                    )}
                </div>

                {/* Footer with Trend or Link */}
                <div className="flex items-center justify-between mt-auto">
                    {href && (
                        <a
                            href={href}
                            className="flex items-center gap-1 text-xs text-[#ff4b00] hover:text-[#ff5d1a] font-medium transition-colors"
                        >
                            View Details
                            <ArrowRight className="w-3 h-3" />
                        </a>
                    )}

                    {trend !== undefined && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${isPositiveTrend
                            ? 'bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)]'
                            : 'bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)]'
                            }`}>
                            {isPositiveTrend ? (
                                <TrendingUp className="w-3 h-3 text-green-500" />
                            ) : (
                                <TrendingDown className="w-3 h-3 text-red-400" />
                            )}
                            <span className={`text-[11px] font-semibold ${isPositiveTrend ? 'text-green-500' : 'text-red-400'}`}>
                                {isPositiveTrend ? '+' : ''}{trend}%
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
