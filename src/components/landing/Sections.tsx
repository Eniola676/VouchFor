
import React from 'react';
import { Link } from 'react-router-dom';

export const StepsSection = () => {
    return (
        <section className="py-24 bg-transparent">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-20">
                    <h2 className="text-4xl font-semibold font-header text-white mb-4">
                        Go live in under 10 minutes
                    </h2>
                    <p className="text-gray-400">
                        We built Earniyx to be the easiest part of your business operations.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-12">
                    {/* Step 1 */}
                    <div className="space-y-6">
                        <div className="w-16 h-16 rounded-full bg-orange-500/10 text-[#ff4b00] flex items-center justify-center text-2xl font-bold border border-orange-500/20">
                            1
                        </div>
                        <h3 className="text-xl font-medium font-header text-white">Connect Course</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Sync with Kajabi, Teachable, or your custom stack via API in seconds.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="space-y-6">
                        <div className="w-16 h-16 rounded-full bg-orange-500/10 text-[#ff4b00] flex items-center justify-center text-2xl font-bold border border-orange-500/20">
                            2
                        </div>
                        <h3 className="text-xl font-medium font-header text-white">Invite Students</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Automatically invite your top students to become partners as they complete your course.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="space-y-6">
                        <div className="w-16 h-16 rounded-full bg-orange-500/10 text-[#ff4b00] flex items-center justify-center text-2xl font-bold border border-orange-500/20">
                            3
                        </div>
                        <h3 className="text-xl font-medium font-header text-white">Track Growth</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Watch the dashboard as referrals roll in and payouts are handled automatically.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export const CTASection = () => {
    return (
        <section className="py-24 px-4">
            <div className="container mx-auto max-w-5xl">
                <div className="bg-[#0f0e21] rounded-[3rem] p-12 lg:p-24 text-center relative overflow-hidden border border-white/5">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ff4b00 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                    <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold font-header text-white leading-tight">
                            Ready to stop renting traffic?
                        </h2>

                        <p className="text-gray-400 text-lg">
                            Join 500+ creators who are scaling predictably with student-led growth.
                        </p>

                        <Link to="/signup/vendor" className="inline-block bg-[#ff4b00] hover:bg-[#ff7438] text-white text-lg font-bold py-4 px-10 rounded-full transition-all shadow-xl hover:shadow-orange-500/30 active:scale-95">
                            Get Started for Free
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};
