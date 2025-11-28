import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { GridBackground } from '@/components/ui/grid-background';

export default function TrackingLinkPage() {
  const { affiliateId, programId } = useParams<{ affiliateId: string; programId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    handleRedirect();
  }, [affiliateId, programId]);

  const handleRedirect = async () => {
    if (!affiliateId || !programId) {
      setError('Invalid tracking link parameters');
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Fetch vendor/program data using programId (which is vendor_id)
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, destination_url, program_name, is_active, commission_type, commission_value')
        .eq('id', programId)
        .eq('is_active', true)
        .single();

      if (vendorError || !vendorData) {
        console.error('Error fetching vendor:', vendorError);
        setError('Program not found');
        setIsLoading(false);
        return;
      }

      if (!vendorData.destination_url) {
        setError('Program has no destination URL configured');
        setIsLoading(false);
        return;
      }

      // Step 2: Record the click in referrals table
      // CRITICAL: Await this before redirecting to ensure the click is saved
      try {
        const { data: referralData, error: referralError } = await supabase
          .from('referrals')
          .insert({
            affiliate_id: affiliateId,
            vendor_id: programId,
            status: 'click',
            commission_amount: 0, // Clicks don't have commission yet
          })
          .select()
          .single();

        if (referralError) {
          console.error('❌ Failed to record click - Supabase Error:', {
            message: referralError.message,
            details: referralError.details,
            hint: referralError.hint,
            code: referralError.code,
            error: referralError,
          });
          // Log error but don't block redirect - tracking is nice-to-have
        } else {
          console.log('✅ Click recorded successfully:', referralData);
        }
      } catch (err) {
        // Enhanced error logging for debugging
        console.error('❌ Exception while recording click:', {
          error: err,
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          affiliateId,
          programId,
        });
        // Don't block redirect if click recording fails
      }

      // Step 3: Redirect to destination URL with ref parameter (only after insert attempt completes)
      // Add ref parameter to track the affiliate
      try {
        const destinationUrl = new URL(vendorData.destination_url);
        destinationUrl.searchParams.set('ref', affiliateId);
        window.location.href = destinationUrl.toString();
      } catch (urlError) {
        // If URL parsing fails (e.g., relative URL), append ref parameter manually
        const separator = vendorData.destination_url.includes('?') ? '&' : '?';
        window.location.href = `${vendorData.destination_url}${separator}ref=${affiliateId}`;
      }
    } catch (err) {
      console.error('Redirect error:', err);
      setError('An error occurred while processing the tracking link');
      setIsLoading(false);
    }
  };

  // Show loading state while processing
  if (isLoading && !error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 relative">
        <GridBackground />
        <div className="w-full max-w-md relative z-10 text-center">
          <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state (404 or other errors)
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 relative">
        <GridBackground />
        <div className="w-full max-w-md relative z-10">
          <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-8 text-center">
            <div className="mb-4">
              <h1 className="text-4xl font-bold text-white mb-2">404</h1>
              <h2 className="text-xl font-semibold text-gray-300 mb-4">Program Not Found</h2>
              <p className="text-gray-400">
                {error === 'Program not found' 
                  ? 'The affiliate program you\'re looking for doesn\'t exist or is no longer active.'
                  : error}
              </p>
            </div>
            <a
              href="/"
              className="inline-block mt-6 px-6 py-3 bg-white text-black rounded-md hover:bg-gray-100 transition font-medium"
            >
              Go to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // This shouldn't render, but just in case
  return null;
}

