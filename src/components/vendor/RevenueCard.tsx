import { ArrowUpRight, TrendingUp } from 'lucide-react';

interface RevenueCardProps {
    amount: number;
}

export function RevenueCard({ amount }: RevenueCardProps) {
    return (
        <div className="relative group">
            {/* Main Card */}
            <div className="bg-gradient-to-br from-[#0f0e21] to-[#1a1929] rounded-2xl p-6 border border-[rgba(255,75,0,0.2)] shadow-[0_8px_32px_rgba(255,75,0,0.1)] transition-all duration-200 hover:shadow-[0_8px_48px_rgba(255,75,0,0.15)] hover:-translate-y-0.5">
                {/* Header with Label and Trend */}
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-wider text[#9ca3af] font-medium">
                        Revenue Generated
                    </span>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)]">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-[11px] font-semibold text-green-500">+0%</span>
                    </div>
                </div>

                {/* Amount */}
                <div className="mb-6">
                    <div className="text-5xl font-bold text-white mb-1">
                        ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-[#6b7280]">USD</div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#ff4b00] text-[#ff4b00] text-sm font-semibold hover:bg-[rgba(255,75,0,0.1)] transition-all duration-200">
                        <span>Deposit</span>
                        <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
