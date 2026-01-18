import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, Download } from 'lucide-react';

interface ChartDataPoint {
    date: string;
    clicks: number;
    conversions: number;
}

interface PerformanceChartV2Props {
    data: ChartDataPoint[];
    dateRange: string;
}

export function PerformanceChartV2({ data, dateRange }: PerformanceChartV2Props) {
    // Format data for chart (show abbreviated month names)
    const formattedData = data.map(point => ({
        ...point,
        displayDate: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    // Calculate total conversions
    const totalConversions = data.reduce((sum, point) => sum + point.conversions, 0);

    return (
        <div className="bg-gradient-to-br from-[#0f0e21] to-[#1a1929] rounded-2xl p-6 border border-[rgba(255,255,255,0.05)] shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">Performance Overview</h3>
                        <select className="px-3 py-1.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-[#9ca3af] hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer">
                            <option>{dateRange}</option>
                            <option>Last 7 days</option>
                            <option>Last 90 days</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="text-3xl font-bold text-white">{totalConversions}</div>
                            <div className="text-xs text-[#9ca3af]">Total Conversions</div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button className="p-2.5 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] rounded-lg transition-colors">
                        <BarChart3 className="w-5 h-5 text-[#9ca3af]" />
                    </button>
                    <button className="p-2.5 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] rounded-lg transition-colors">
                        <Download className="w-5 h-5 text-[#9ca3af]" />
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff4b00]"></div>
                    <span className="text-sm text-[#9ca3af]">Clicks</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#6b7280]"></div>
                    <span className="text-sm text-[#9ca3af]">Conversions</span>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ff4b00" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ff4b00" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

                        <XAxis
                            dataKey="displayDate"
                            stroke="#6b7280"
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                            tickLine={false}
                        />

                        <YAxis
                            stroke="#6b7280"
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                            tickLine={false}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1929',
                                border: '1px solid rgba(255, 75, 0, 0.3)',
                                borderRadius: '12px',
                                padding: '12px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                            }}
                            labelStyle={{ color: '#ffffff', marginBottom: '8px', fontWeight: '600' }}
                            itemStyle={{ color: '#9ca3af', fontSize: '13px' }}
                        />

                        <Area
                            type="monotone"
                            dataKey="clicks"
                            stroke="#ff4b00"
                            strokeWidth={2}
                            fill="url(#clicksGradient)"
                            dot={{ fill: '#ff4b00', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                            activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff' }}
                        />

                        <Area
                            type="monotone"
                            dataKey="conversions"
                            stroke="#6b7280"
                            strokeWidth={2}
                            fill="transparent"
                            dot={{ fill: '#6b7280', r: 3 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
