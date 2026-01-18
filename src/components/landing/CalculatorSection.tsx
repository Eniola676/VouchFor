
import React, { useState, useMemo } from 'react';

export const CalculatorSection = () => {
    const [students, setStudents] = useState<number>(2500);
    const [price, setPrice] = useState<number>(499);

    // Constants
    const CONVERSION_RATE = 0.01; // 1%
    const COMMISSION_RATE = 0.20; // 20%

    const calculations = useMemo(() => {
        const potentialRevenue = (students * CONVERSION_RATE) * price;
        const commission = potentialRevenue * COMMISSION_RATE;
        const netProfit = potentialRevenue - commission;
        const newReferralSales = Math.round(students * CONVERSION_RATE);

        return {
            potentialRevenue,
            commission,
            netProfit,
            newReferralSales
        };
    }, [students, price]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <section className="py-24 bg-transparent">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="bg-[#ff4b00] rounded-[2.5rem] p-8 md:p-12 lg:p-16 text-white grid lg:grid-cols-2 gap-12 lg:gap-20 items-center overflow-hidden relative">

                    {/* Left Column: Inputs */}
                    <div className="space-y-8 relative z-10">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-5xl font-semibold font-header leading-tight">
                                Calculate your potential revenue
                            </h2>
                            <p className="text-white/90 text-lg leading-relaxed max-w-md">
                                See how much additional revenue you could generate by turning just 10% of your students into partners.
                            </p>
                        </div>

                        <div className="space-y-10 pt-4">
                            {/* Students Slider */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center font-medium">
                                    <label>Number of Students</label>
                                    <span className="text-2xl font-bold">{students.toLocaleString()}</span>
                                </div>
                                <input
                                    type="range"
                                    min="100"
                                    max="10000"
                                    step="100"
                                    value={students}
                                    onChange={(e) => setStudents(Number(e.target.value))}
                                    className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-100 transition-all"
                                />
                            </div>

                            {/* Price Slider */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center font-medium">
                                    <label>Course Price</label>
                                    <span className="text-2xl font-bold">${price}</span>
                                </div>
                                <input
                                    type="range"
                                    min="49"
                                    max="2000"
                                    step="10"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-100 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Results Card */}
                    <div className="bg-[#0f0e21] rounded-3xl p-8 text-white relative z-10 shadow-xl transform transition-transform hover:scale-[1.01] duration-300 border border-white/10">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-[#ff4b00] text-xs font-bold tracking-widest uppercase mb-1">
                                    MONTHLY POTENTIAL
                                </h3>
                                <div className="text-6xl font-bold font-header tracking-tight text-white">
                                    {formatCurrency(calculations.potentialRevenue)}
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-white/10">
                                <div className="flex justify-between text-sm font-medium text-gray-400">
                                    <span>New Referral Sales</span>
                                    <span>{calculations.newReferralSales} /mo</span>
                                </div>
                                <div className="flex justify-between text-sm font-medium text-gray-400">
                                    <span>Partner Commission ({(COMMISSION_RATE * 100).toFixed(0)}%)</span>
                                    <span>- {formatCurrency(calculations.commission)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                <span className="font-bold text-lg">Net Profit</span>
                                <span className="font-bold text-2xl text-[#10b981]">
                                    +{formatCurrency(calculations.netProfit)}
                                </span>
                            </div>

                            <button className="w-full bg-[#ff4b00] hover:bg-[#ff7438] text-white font-bold py-4 px-6 rounded-xl transition-colors shadow-lg shadow-orange-500/20 active:scale-[0.98]">
                                Claim This Growth
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};
