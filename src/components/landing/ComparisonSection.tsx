
import React from 'react';

export const ComparisonSection = () => {
    return (
        <section className="py-24 bg-transparent">
            <div className="container mx-auto px-4">

                <div className="max-w-3xl mb-16">
                    <h2 className="text-4xl lg:text-5xl font-semibold font-header text-white mb-6">
                        The Ad Trap vs. The <span className="text-[#ff4b00]">Earniyx</span> Way
                    </h2>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        Why the world's most successful coaches are ditching paid ads for organic referrals.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">

                    {/* The Ad Trap Card */}
                    <div className="bg-[#0f0e21] p-8 lg:p-10 rounded-3xl border-2 border-white/5 hover:border-red-500/20 transition-colors shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-8">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                <polyline points="17 18 23 18 23 12"></polyline>
                            </svg>
                        </div>

                        <h3 className="text-2xl font-medium font-header text-white mb-6">The Ad Trap</h3>

                        <ul className="space-y-4">
                            <li className="flex gap-3 items-start">
                                <span className="text-red-500 mt-1">×</span>
                                <span className="text-gray-400 text-sm leading-relaxed">Sky-high CAC that eats into your margins daily.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="text-red-500 mt-1">×</span>
                                <span className="text-gray-400 text-sm leading-relaxed">Unpredictable algorithms that kill your traffic overnight.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="text-red-500 mt-1">×</span>
                                <span className="text-gray-400 text-sm leading-relaxed">Constant ad fatigue requiring new creative every week.</span>
                            </li>
                        </ul>
                    </div>

                    {/* The Earniyx Way Card */}
                    <div className="bg-[#0f0e21] p-8 lg:p-10 rounded-3xl border-2 border-[#ff4b00]/20 shadow-xl shadow-orange-500/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff4b00]/10 rounded-bl-full -z-10" />

                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#ff4b00] flex items-center justify-center mb-8">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                <polyline points="17 6 23 6 23 12"></polyline>
                            </svg>
                        </div>

                        <h3 className="text-2xl font-medium font-header text-white mb-6">The Earniyx Way</h3>

                        <ul className="space-y-4">
                            <li className="flex gap-3 items-start">
                                <span className="text-[#ff4b00] font-bold mt-1">✓</span>
                                <span className="text-gray-300 text-sm leading-relaxed">Zero-risk growth. Only pay when you make a sale.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="text-[#ff4b00] font-bold mt-1">✓</span>
                                <span className="text-gray-300 text-sm leading-relaxed">High-trust referrals from students who love your work.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="text-[#ff4b00] font-bold mt-1">✓</span>
                                <span className="text-gray-300 text-sm leading-relaxed">Compound interest. Your sales force grows with every student.</span>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>
        </section>
    );
};
