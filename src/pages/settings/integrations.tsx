import { useEffect, useState } from 'react';
import { VendorSidebar } from '@/components/VendorSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { GridBackground } from '@/components/ui/grid-background';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Check, Copy, Globe, Play, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface VendorProgram {
  id: string;
  vendor_slug: string;
  program_name: string;
  is_active: boolean;
  destination_url: string | null;
}

export default function IntegrationsPage() {
  const [programs, setPrograms] = useState<VendorProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<VendorProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [checkingInstallation, setCheckingInstallation] = useState(false);
  const [installationStatus, setInstallationStatus] = useState<'unknown' | 'installed' | 'not-installed'>('unknown');
  const [listening, setListening] = useState(false);
  const [lastEvent, setLastEvent] = useState<any>(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    if (selectedProgram && listening) {
      // Poll for recent events
      pollInterval = setInterval(async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Check for recent referrals for this vendor (clicks and sales)
          const { data: recentReferrals } = await supabase
            .from('referrals')
            .select('*')
            .eq('vendor_id', selectedProgram.id)
            .in('status', ['click', 'sale', 'pending_commission'])
            .order('created_at', { ascending: false })
            .limit(1);

          if (recentReferrals && recentReferrals.length > 0) {
            const latest = recentReferrals[0];
            setLastEvent((prev: any) => {
              if (!prev || latest.id !== prev.id) {
                // Update program status to active if we receive an event
                if (!selectedProgram.is_active) {
                  supabase
                    .from('vendors')
                    .update({ is_active: true })
                    .eq('id', selectedProgram.id)
                    .then(() => {
                      fetchPrograms();
                    });
                }
                return latest;
              }
              return prev;
            });
          }
        } catch (err) {
          console.error('Error polling for events:', err);
        }
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [selectedProgram?.id, listening]);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, vendor_slug, program_name, is_active, destination_url')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching programs:', error);
      } else {
        setPrograms(data || []);
        // Auto-select first program if available
        if (data && data.length > 0) {
          setSelectedProgram(data[0]);
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const trackerScriptUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/tracker.js`
    : 'https://your-domain.com/tracker.js';

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const checkInstallation = async () => {
    if (!selectedProgram?.destination_url) {
      alert('Please set a destination URL for this program first.');
      return;
    }

    setCheckingInstallation(true);
    setInstallationStatus('unknown');

    try {
      // Try to fetch the destination URL and check if tracker is loaded
      // Note: This might fail due to CORS, so we'll show a manual check option
      await fetch(selectedProgram.destination_url, { 
        method: 'HEAD',
        mode: 'no-cors' // This will always succeed but we can't read the response
      });

      // Since we can't actually check due to CORS, we'll show instructions
      setInstallationStatus('unknown');
      alert('Due to browser security (CORS), we cannot automatically check installation.\n\nPlease manually verify:\n1. Open your destination URL in a new tab\n2. Open browser console (F12)\n3. Type: window.vouchfor\n4. If it shows an object, the tracker is installed!');
    } catch (err) {
      console.error('Error checking installation:', err);
      setInstallationStatus('unknown');
    } finally {
      setCheckingInstallation(false);
    }
  };


  const CodeBlock = ({ code, language = 'html', id }: { code: string; language?: string; id: string }) => (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase">{language}</span>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition"
        >
          {copied === id ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto">
        <code className="text-sm text-gray-300">{code}</code>
      </pre>
    </div>
  );

  const globalScriptCode = `<script src="${trackerScriptUrl}"></script>`;

  const thankYouPageCode = selectedProgram 
    ? `// On your thank you / confirmation page
vouchfor('track', 'sale', {
  program_id: '${selectedProgram.id}'
});`
    : '';

  return (
    <div className={cn("flex flex-col w-full min-h-screen bg-black", "relative")}>
      <GridBackground />
      
      {/* Top Header Bar */}
      <div className="relative z-20">
        <DashboardHeader />
      </div>
      
      <div className="flex flex-1 relative z-10">
        {/* Sidebar */}
        <div className="relative z-10">
          <VendorSidebar />
        </div>
        
        {/* Main Content */}
        <div className="flex flex-1 relative z-10">
          <div className="p-2 md:p-10 rounded-tl-2xl border-l border-gray-800 bg-black/95 backdrop-blur-xl flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
            <div className="mb-4">
              <h1 className="text-2xl font-semibold text-white mb-2">Integrations</h1>
              <p className="text-sm text-gray-400">Add the VouchFor tracker to your website to track affiliate clicks and conversions</p>
            </div>

            {/* Program Selector */}
            <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Program
              </label>
              {loading ? (
                <p className="text-gray-400 text-sm">Loading programs...</p>
              ) : programs.length === 0 ? (
                <p className="text-gray-400 text-sm">No programs found. Create a program first.</p>
              ) : (
                <select
                  value={selectedProgram?.id || ''}
                  onChange={(e) => {
                    const program = programs.find(p => p.id === e.target.value);
                    setSelectedProgram(program || null);
                    setListening(false);
                    setLastEvent(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                >
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.program_name} {program.is_active ? '(Active)' : '(Inactive)'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedProgram && (
              <>
                {/* Step 1: Global Script */}
                <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-sm">1</span>
                      <span>Add Global Script</span>
                    </h2>
                    <button
                      onClick={checkInstallation}
                      disabled={checkingInstallation || !selectedProgram.destination_url}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-white text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {checkingInstallation ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4" />
                          <span>Check Installation</span>
                        </>
                      )}
                    </button>
                  </div>

                  {programs.length > 1 && (
                    <div className="mb-4 p-3 bg-primary-900/20 border border-primary-800 rounded-md">
                      <p className="text-sm text-primary-300">
                        <AlertCircle className="w-4 h-4 inline mr-2" />
                        If you've already added this header code for another program, you can skip Step 1.
                      </p>
                    </div>
                  )}

                  <p className="text-sm text-gray-400 mb-4">
                    Add this script to every page of your website, ideally before the closing <code className="text-gray-500">&lt;/body&gt;</code> tag:
                  </p>
                  
                  <CodeBlock code={globalScriptCode} id="global-script" />

                  {installationStatus === 'installed' && (
                    <div className="mt-4 p-3 bg-green-900/20 border border-green-800 rounded-md flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-green-300">Tracker detected! Installation verified.</span>
                    </div>
                  )}

                  {installationStatus === 'not-installed' && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-md flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-sm text-red-300">Tracker not detected. Please verify the script is added correctly.</span>
                    </div>
                  )}
                </div>

                {/* Step 2: Thank You Page Code */}
                <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-sm">2</span>
                    <span>Add to Thank You Page</span>
                  </h2>
                  
                  <p className="text-sm text-gray-400 mb-4">
                    Add this code to your thank you / confirmation page after a successful sale or conversion:
                  </p>
                  
                  <CodeBlock code={thankYouPageCode} language="javascript" id="thank-you-code" />

                  <div className="mt-4 p-3 bg-gray-900/50 border border-gray-700 rounded-md">
                    <p className="text-xs text-gray-400">
                      The <code className="text-gray-500">program_id</code> is already set for this program: <code className="text-gray-500">{selectedProgram.id}</code>
                    </p>
                  </div>
                </div>

                {/* Step 3: Validation & Listening */}
                <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-sm">3</span>
                      <span>Validate Installation</span>
                    </h2>
                    <button
                      onClick={() => {
                        setListening(!listening);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-white text-sm transition ${
                        listening 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-primary-600 hover:bg-primary-700'
                      }`}
                    >
                      {listening ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span>Stop Listening</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Start Listening</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-sm text-gray-400 mb-4">
                    Click "Start Listening" to monitor for tracking events. The program will be marked as "Active" once we receive the first click or sale event.
                  </p>

                  {listening && (
                    <div className="mt-4 p-4 bg-gray-900/50 border border-gray-700 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                        <span className="text-sm text-gray-300">Listening for events...</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Test by visiting your site with ?ref= parameter (for clicks) or completing a sale (for sales). Events will appear here when detected.
                      </p>
                    </div>
                  )}

                  {lastEvent && (
                    <div className="mt-4 p-4 bg-green-900/20 border border-green-800 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <span className="text-sm font-semibold text-green-300">
                          {lastEvent.status === 'click' ? 'Click Event Received!' : 'Sale Event Received!'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Event Type: <span className="text-white capitalize">{lastEvent.status}</span>
                        {lastEvent.status !== 'click' && (
                          <> | Commission: <span className="text-white">${lastEvent.commission_amount}</span></>
                        )}
                      </p>
                    </div>
                  )}

                  {selectedProgram.is_active && (
                    <div className="mt-4 p-3 bg-green-900/20 border border-green-800 rounded-md flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-green-300">Program is Active - Tracking is working!</span>
                    </div>
                  )}
                </div>

                {/* How It Works */}
                <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">How Hybrid Click & Sale Tracking Works</h2>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-white">1</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white mb-1">Affiliate shares tracking link</h3>
                        <p className="text-sm text-gray-400">
                          When someone clicks the affiliate's tracking link, they're redirected to your website with a <code className="text-gray-500">?ref=</code> parameter.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-white">2</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white mb-1">Click is automatically tracked</h3>
                        <p className="text-sm text-gray-400">
                          The tracker script automatically detects the <code className="text-gray-500">?ref=</code> parameter, sends a click event to our API, and saves the referral ID for 60 days in the browser's localStorage.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-white">3</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white mb-1">Customer completes sale</h3>
                        <p className="text-sm text-gray-400">
                          When the customer completes a purchase, call <code className="text-gray-500">vouchfor('track', 'sale', {'{'} program_id: '...' {'}'})</code> on your thank you page.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-white">4</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white mb-1">Sale is recorded</h3>
                        <p className="text-sm text-gray-400">
                          The sale is automatically recorded using the stored referral ID and appears in the affiliate's dashboard with pending commission status.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
