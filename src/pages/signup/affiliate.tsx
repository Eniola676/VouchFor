import { useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { GridBackground } from '@/components/ui/grid-background';

export default function AffiliateSignupPage() {
  const [searchParams] = useSearchParams();
  const vendorSlug = searchParams.get('vendor') || '';
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Signup Data:', { ...formData, vendorSlug });
    // TODO: Implement actual signup logic
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 relative">
      <GridBackground />
      <div className="w-full max-w-md relative z-10">
        <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-8">
          <h1 className="text-3xl font-semibold text-white mb-2">
            Join as an Affiliate Partner
          </h1>
          
          {vendorSlug && (
            <p className="text-gray-400 mb-6">
              Applying to the <span className="text-white font-medium">{vendorSlug}</span> program.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter your full name"
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                required
              />
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a password"
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                required
                minLength={8}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
            >
              Create Account & Join Program
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

