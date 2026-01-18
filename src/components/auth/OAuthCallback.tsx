import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleSession = async (session: Session) => {
      if (processedRef.current) return;
      processedRef.current = true;

      try {
        console.log('OAuthCallback: Handling session', session.user.id);

        // Check if user already has a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking profile:', profileError);
        }

        // Determine role from redirect URL or default to affiliate
        // Determine role from localStorage or redirect URL or default to affiliate
        const storageRole = localStorage.getItem('auth_role');
        const storageVendorSlug = localStorage.getItem('auth_vendor_slug');

        // Clear storage immediately to prevent pollution
        if (storageRole) localStorage.removeItem('auth_role');
        if (storageVendorSlug) localStorage.removeItem('auth_vendor_slug');

        const redirectPath = searchParams.get('redirect') || window.location.pathname;
        let role = storageRole || 'affiliate'; // default

        // Infer role context from the redirect path or previous navigation intent if not in storage
        if (!storageRole) {
          if (redirectPath.includes('/dashboard/affiliate') || redirectPath.includes('affiliate')) {
            role = 'affiliate';
          } else if (redirectPath.includes('/') || redirectPath.includes('vendor')) {
            role = 'vendor';
          }
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
          }
        }

        // If affiliate and vendor slug is present, join the program
        if (role === 'affiliate') {
          const vendorSlug = storageVendorSlug || searchParams.get('vendor');

          if (vendorSlug) {
            try {
              const { data: vendorData, error: vendorError } = await supabase
                .from('vendors')
                .select('id')
                .eq('vendor_slug', vendorSlug)
                .eq('is_active', true)
                .single();

              if (!vendorError && vendorData) {
                const { data: joinData, error: joinError } = await supabase
                  .rpc('join_program', {
                    p_affiliate_id: session.user.id,
                    p_vendor_id: vendorData.id,
                  });

                if (joinError) console.warn('Failed to join program:', joinError);
                else console.log('Successfully joined program:', vendorSlug, joinData);
              }
            } catch (err) {
              console.warn('Error joining program:', err);
            }
          }

          navigate(vendorSlug ? `/dashboard/affiliate?vendor=${vendorSlug}` : '/dashboard/affiliate');
        } else {
          navigate('/dashboard/vendor');
        }
      } catch (err) {
        console.error('OAuth processing error:', err);
        setError(err instanceof Error ? err.message : 'Failed to complete sign in');
      }
    };

    // Check for existing session first
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setError(error.message);
        return;
      }
      if (session) {
        handleSession(session);
      }
    });

    // Listen for auth state changes (waits for the OAuth redirect processing to complete)
    const { data: authListener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      console.log('Auth state change:', event);
      if (event === 'SIGNED_IN' && session) {
        handleSession(session);
      } else if (event === 'SIGNED_OUT') {
        // If we get specific error parameters in URL that supabase parsed
        const params = new URLSearchParams(window.location.hash.substring(1)); // Implicit flow often puts error in hash
        const errorDescription = params.get('error_description') || searchParams.get('error_description');
        if (errorDescription) {
          setError(errorDescription);
          processedRef.current = true; // Stop waiting
        }
      }
    });

    // Fallback timeout in case nothing happens
    timeoutId = setTimeout(() => {
      if (!processedRef.current) {
        setError('Request timed out. Please try logging in again.');
      }
    }, 15000); // 15 seconds

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
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


