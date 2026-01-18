
import React from 'react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#070614]/80 backdrop-blur-md border-b border-white/5">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <img src="/logo.png" alt="Earniyx" className="h-10 w-auto" />
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <Link to="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Product</Link>
                    <Link to="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Pricing</Link>
                    <Link to="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Calculators</Link>
                    <Link to="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">About</Link>
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center gap-4">
                    <a href="https://cal.com/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-300 hover:text-white transition-colors hidden sm:block">
                        Book a Demo
                    </a>
                    <Link to="/signup/vendor" className="text-sm font-bold text-white hover:text-[#ff4b00] transition-colors hidden sm:block">
                        Log In
                    </Link>
                    <Link to="/signup/vendor" className="bg-[#ff4b00] hover:bg-[#ff7438] text-white text-sm font-bold py-2.5 px-5 rounded-full transition-all shadow-md hover:shadow-lg active:scale-95">
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    );
};
