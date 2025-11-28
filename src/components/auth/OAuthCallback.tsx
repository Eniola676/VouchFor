import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          throw new Error('No user session found');
        }

        // Check if user already has a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 is "not found" - that's okay, we'll create one
          console.error('Error checking profile:', profileError);
        }

        // Determine role from redirect URL or default to affiliate
        const redirectPath = searchParams.get('redirect') || window.location.pathname;
        let role = 'affiliate'; // default

        if (redirectPath.includes('/dashboard/affiliate') || redirectPath.includes('affiliate')) {
          role = 'affiliate';
        } else if (redirectPath.includes('/') || redirectPath.includes('vendor')) {
          role = 'vendor';
        }

        // If profile doesn't exist or role is missing, create/update it
        if (!profile || !profile.role) {
          const fullName = session.user.user_metadata?.full_name || 
                          session.user.user_metadata?.name || 
                          session.user.email?.split('@')[0] || 
                          'User';

          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              full_name: fullName,
              role: role,
            });

          if (upsertError) {
            console.error('Error creating/updating profile:', upsertError);
            // Don't throw - profile might be created by trigger
          }
        }

        // Redirect based on role
        if (role === 'affiliate') {
          const vendorSlug = searchParams.get('vendor');
          navigate(vendorSlug ? `/dashboard/affiliate?vendor=${vendorSlug}` : '/dashboard/affiliate');
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Failed to complete sign in');
        // Redirect to appropriate login page after a delay
        setTimeout(() => {
          const redirectPath = searchParams.get('redirect') || '';
          if (redirectPath.includes('affiliate')) {
            navigate('/login/affiliate');
          } else {
            navigate('/login/vendor');
          }
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Error</h1>
          <p className="text-red-400 mb-4">{error}</p>
          <p className="text-gray-400 text-sm">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}

