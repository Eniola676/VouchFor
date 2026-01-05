import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { GridBackground } from '@/components/ui/grid-background';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff } from 'lucide-react';

export default function VendorLoginPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Check if supabase is properly configured
      if (!supabase || !supabase.auth) {
        throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error('Failed to sign in');
      }

      // Redirect to vendor dashboard
      navigate('/');
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      // Check if supabase is properly configured
      if (!supabase || !supabase.auth) {
        throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 relative">
      <GridBackground />
      <div className="w-full max-w-md relative z-10">
        <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-8">
          <h1 className="text-3xl font-semibold text-white mb-2">
            Sign in to your account
          </h1>
          
          <p className="text-gray-400 mb-6">
            New to VouchFor?{' '}
            <Link 
              to="/signup/vendor"
              className="text-white font-semibold underline hover:text-gray-300 transition"
            >
              Sign up here!
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email address"
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password"
                  className="w-full px-4 py-2 pr-10 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-gray-700 bg-gray-900/50 text-primary-600 focus:ring-primary-600 focus:ring-offset-0"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-300">
                Remember me
              </label>
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
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Recovery Links */}
          <div className="mt-4 text-center space-y-2">
            <Link
              to="/forgot-password"
              className="text-sm text-gray-400 hover:text-white transition block"
            >
              Forgot your password?
            </Link>
            <Link
              to="/resend-confirmation"
              className="text-sm text-gray-400 hover:text-white transition block"
            >
              Didn't receive confirmation instructions?
            </Link>
          </div>

          {/* Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black/80 text-gray-400">OR</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            variant="secondary"
            size="lg"
            fullWidth
            disabled={isGoogleLoading}
            className="flex items-center justify-center gap-2"
          >
            {isGoogleLoading ? (
              'Connecting...'
            ) : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="whitespace-nowrap">Continue with Google</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

