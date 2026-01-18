
import React from 'react';
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { ComparisonSection } from '../components/landing/ComparisonSection';
import { CalculatorSection } from '../components/landing/CalculatorSection';
import { StepsSection, CTASection } from '../components/landing/Sections';

const Footer = () => {
    return (
        <footer className="py-12 bg-transparent border-t border-white/5">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Earniyx" className="h-8 w-auto" />
                </div>

                <div className="flex gap-8 text-xs font-medium text-gray-500">
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-white transition-colors">Contact</a>
                    <a href="#" className="hover:text-white transition-colors">Twitter / X</a>
                </div>

                <div className="text-xs text-gray-600">
                    © 2024 Earniyx. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-[#070614] font-sans text-white selection:bg-orange-500/30 selection:text-orange-100">
            <Navbar />
            <main>
                <HeroSection />
                <ComparisonSection />
                <CalculatorSection />
                <StepsSection />
                <CTASection />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
