import React from 'react';
import { Link } from 'react-router-dom';

export const HeroSection = () => {
    return (
        <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-[#ff4b00]/10 to-transparent -z-10" />

            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

                    {/* Left Content */}
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-[#ff4b00] text-xs font-bold uppercase tracking-wider mb-6 border border-orange-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ff4b00]" />
                            Join 500+ Top Creators
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-bold font-header text-white leading-[1.1] mb-6">
                            Turn your students into <span className="text-[#ff4b00]">your sales force.</span>
                        </h1>

                        <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-lg">
                            Stop renting traffic from Meta and Google. Start owning your growth with the affiliate platform built specifically for course creators.
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            <Link to="/signup/vendor" className="bg-[#ff4b00] hover:bg-[#ff7438] text-white text-base font-bold py-3.5 px-8 rounded-full transition-all shadow-lg hover:shadow-orange-500/25 active:scale-95">
                                Start for Free
                            </Link>
                            <button className="bg-transparent hover:bg-white/5 text-white text-base font-bold py-3.5 px-8 rounded-full border border-gray-700 transition-all active:scale-95">
                                Watch Demo
                            </button>
                        </div>
                    </div>

                    {/* Right Content - CSS Mock Dashboard */}
                    <div className="relative">
                        {/* Dashboard Card */}
                        <div className="bg-[#0f0e21] rounded-3xl p-6 shadow-2xl border border-white/5 relative z-10 w-full max-w-md mx-auto lg:ml-auto lg:mr-0 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">

                            {/* Card Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                </div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    Student Partner Dashboard
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="text-xs text-gray-400 font-medium mb-1">Referral Sales</div>
                                    <div className="text-2xl font-bold text-[#ff4b00]">$42,800</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="text-xs text-gray-400 font-medium mb-1">Active Partners</div>
                                    <div className="text-2xl font-bold text-white">1,240</div>
                                </div>
                            </div>

                            {/* Chart Area */}
                            <div className="bg-white/5 rounded-xl p-4 mb-6">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <div className="text-xs text-gray-400 font-medium mb-0.5">Growth Rate</div>
                                        <div className="text-lg font-bold text-white">+24% MoM</div>
                                    </div>
                                    <div className="flex gap-1 items-end h-16">
                                        <div className="w-3 bg-orange-900/50 rounded-t-sm h-[40%]" />
                                        <div className="w-3 bg-orange-800/50 rounded-t-sm h-[60%]" />
                                        <div className="w-3 bg-orange-700/50 rounded-t-sm h-[50%]" />
                                        <div className="w-3 bg-orange-600/50 rounded-t-sm h-[80%]" />
                                        <div className="w-3 bg-[#ff4b00] rounded-t-sm h-[100%]" />
                                    </div>
                                </div>
                            </div>

                            {/* User Row */}
                            <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm">
                                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-[#ff4b00]">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-white">Sarah Jenkins</div>
                                    <div className="text-[10px] text-gray-400">Just earned $450 commission</div>
                                </div>
                            </div>

                        </div>

                        {/* Blurred backdrop effect */}
                        <div className="absolute -inset-4 bg-[#ff4b00]/10 blur-2xl rounded-full -z-10" />
                    </div>

                </div>
            </div>
        </section>
    );
};
