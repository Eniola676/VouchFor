import { AlertCircle, PartyPopper } from 'lucide-react';

interface ActionItem {
    id: string;
    type: 'partner_approval' | 'payout_ready';
    title: string;
    description: string;
    count: number;
    href: string;
}

interface ActionItemsWidgetProps {
    items: ActionItem[];
}

export function ActionItemsWidget({ items }: ActionItemsWidgetProps) {
    const hasItems = items.length > 0;

    return (
        <div className="bg-gradient-to-br from-[#0f0e21] to-[#1a1929] rounded-2xl p-6 border border-[rgba(255,255,255,0.05)] h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Action Items</h3>
                <button className="p-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors">
                    <div className="w-1 h-1 rounded-full bg-[#9ca3af] mb-1"></div>
                    <div className="w-1 h-1 rounded-full bg-[#9ca3af] mb-1"></div>
                    <div className="w-1 h-1 rounded-full bg-[#9ca3af]"></div>
                </button>
            </div>

            {/* Items or Empty State */}
            {hasItems ? (
                <div className="space-y-3">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => window.location.href = item.href}
                            className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-[rgba(255,75,0,0.08)] transition-all duration-200 group text-left"
                        >
                            {/* Icon */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[rgba(255,75,0,0.15)] border border-[rgba(255,75,0,0.3)] flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-[#ff4b00]" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white mb-0.5 group-hover:text-[#ff4b00] transition-colors">
                                    {item.title}
                                </div>
                                <div className="text-xs text-[#9ca3af]">
                                    {item.description}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                    {/* Empty State Icon */}
                    <div className="w-20 h-20 rounded-full bg-[rgba(255,75,0,0.1)] border-2 border-[rgba(255,75,0,0.2)] flex items-center justify-center mb-4">
                        <PartyPopper className="w-10 h-10 text-[#ff4b00]" />
                    </div>

                    {/* Empty State Text */}
                    <h4 className="text-base font-semibold text-white mb-1">
                        All caught up!
                    </h4>
                    <p className="text-sm text-[#9ca3af] text-center">
                        No pending actions
                    </p>
                </div>
            )}
        </div>
    );
}
