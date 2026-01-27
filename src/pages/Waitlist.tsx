import React, { useState } from 'react';
import { Github } from 'lucide-react';
import { GridBackground } from '../components/ui/grid-background';

// Twitter/X Icon component
const TwitterIcon = () => (
    <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="currentColor"
    >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const Waitlist = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset status
        setStatus('loading');
        setMessage('');

        try {
            // Loops.so form submission using form-urlencoded format
            const formData = new URLSearchParams();
            formData.append('email', email);

            const response = await fetch('https://app.loops.so/api/newsletter-form/cmkvvyj3p02ot0izz4yuu09nt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage('🎉 Successfully joined the waitlist! Check your email.');
                setEmail('');
            } else {
                setStatus('error');
                setMessage(data.message || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Network error. Please check your connection and try again.');
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#f84b02] via-[#c93d01] to-[#8b2500]">
            {/* Grid Background */}
            <GridBackground gridColor="rgba(255, 255, 255, 0.08)" />

            {/* Navigation Arrows */}
            <button
                className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white/90 hover:bg-white/10 transition-all duration-300"
                aria-label="Previous"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <button
                className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white/90 hover:bg-white/10 transition-all duration-300"
                aria-label="Next"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            {/* Main Content */}
            <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
                {/* Heading */}
                <h1
                    className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white/90"
                    style={{ fontFamily: "'Ginora Sans', sans-serif" }}
                >
                    Affiliate Management,
                    <br />
                    <span className="text-white/70">Simplified.</span>
                </h1>

                {/* Subtitle */}
                <p
                    className="text-lg md:text-xl text-white/60 mb-12 max-w-xl mx-auto leading-relaxed"
                    style={{ fontFamily: "'Ginora Sans', sans-serif" }}
                >
                    Finally, an affiliate platform built specifically for coaches. No complex tech, just seamless tracking and happy affiliates.
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="mb-8">
                    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            disabled={status === 'loading'}
                            className="flex-1 px-6 py-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 disabled:opacity-50"
                            style={{ fontFamily: "'Ginora Sans', sans-serif" }}
                        />
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="px-8 py-4 rounded-lg bg-black text-white font-medium hover:bg-black/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            style={{ fontFamily: "'Ginora Sans', sans-serif" }}
                        >
                            {status === 'loading' ? 'Joining...' : 'Get Notified'}
                        </button>
                    </div>

                    {/* Status Message */}
                    {message && (
                        <div
                            className={`mt-4 text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'
                                }`}
                            style={{ fontFamily: "'Ginora Sans', sans-serif" }}
                        >
                            {message}
                        </div>
                    )}
                </form>

                {/* Waitlist Count */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="flex -space-x-2">
                        {/* Avatar Stack */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-[#1e293b] flex items-center justify-center text-white text-xs font-bold">
                            JD
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-[#1e293b] flex items-center justify-center text-white text-xs font-bold">
                            AS
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 border-2 border-[#1e293b] flex items-center justify-center text-white text-xs font-bold">
                            MK
                        </div>
                    </div>
                    <span
                        className="text-white/80 font-medium"
                        style={{ fontFamily: "'Ginora Sans', sans-serif" }}
                    >
                        100+ people on the waitlist
                    </span>
                </div>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-4">
                    <a
                        href="https://twitter.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white/90 hover:bg-white/10 transition-all duration-300"
                        aria-label="Twitter/X"
                    >
                        <TwitterIcon />
                    </a>
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white/90 hover:bg-white/10 transition-all duration-300"
                        aria-label="GitHub"
                    >
                        <Github className="w-5 h-5" />
                    </a>
                </div>
            </div>
        </div >
    );
};

export default Waitlist;
