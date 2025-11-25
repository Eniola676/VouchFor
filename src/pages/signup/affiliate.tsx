import { useState, FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { GridBackground } from '@/components/ui/grid-background';
import { supabase } from '@/lib/supabase';

export default function AffiliateSignupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const vendorSlug = searchParams.get('vendor') || '';
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'affiliate',
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Profile should be auto-created by trigger, but ensure it exists
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          full_name: formData.fullName,
          role: 'affiliate',
        });

      if (profileError) {
        console.warn('Profile creation warning:', profileError);
        // Don't fail signup if profile creation fails - trigger should handle it
      }

      // If vendor slug is provided, automatically join the affiliate to that program
      // Use database function to bypass RLS (user not fully authenticated yet)
      if (vendorSlug) {
        try {
          // Look up the vendor by slug
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .select('id')
            .eq('vendor_slug', vendorSlug)
            .eq('is_active', true)
            .single();

          if (!vendorError && vendorData) {
            // Use database function to join program (bypasses RLS)
            const { data: joinData, error: joinError } = await supabase
              .rpc('join_program', {
                p_affiliate_id: authData.user.id,
                p_vendor_id: vendorData.id,
              });

            if (joinError) {
              console.warn('Failed to join program:', joinError);
              // Don't fail signup if program join fails
            } else {
              console.log('Successfully joined program:', vendorSlug, joinData);
            }
          } else {
            console.warn('Vendor not found or inactive:', vendorSlug);
          }
        } catch (err) {
          console.warn('Error joining program:', err);
          // Don't fail signup if program join fails
        }
      }

      // Redirect to affiliate dashboard
      navigate('/dashboard/affiliate');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-md p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account & Join Program'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

