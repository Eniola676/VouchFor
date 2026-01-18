import { useEffect, useState } from 'react';
import { VendorSidebar } from '@/components/VendorSidebar';
import DashboardHeader from '@/components/DashboardHeader';
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
      alert('Due to browser security (CORS), we cannot automatically check installation.\n\nPlease manually verify:\n1. Open your destination URL in a new tab\n2. Open browser console (F12)\n3. Type: window.earniyx\n4. If it shows an object, the tracker is installed!');
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

  const stripeCode = selectedProgram
    ? `// When creating a Stripe Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000, // $20.00 in cents
  currency: 'usd',
  metadata: {
    vendor_id: '${selectedProgram.id}' // Required: Your program ID
  }
});`
    : '';

  const paypalCode = selectedProgram
    ? `// When creating a PayPal order
const order = await paypal.orders.create({
  intent: 'CAPTURE',
  purchase_units: [{
    amount: {
      currency_code: 'USD',
      value: '20.00'
    },
    custom_id: '${selectedProgram.id}' // Required: Your program ID
  }]
});`
    : '';

  return (
    <div className={cn("flex flex-col w-full min-h-screen bg-black", "relative")}>
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
              <p className="text-sm text-gray-400">Add the Earniyx tracker to your website to track affiliate clicks and conversions</p>
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
                      <span>Add Tracking Script to Your Website</span>
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
                        <strong>Already added this?</strong> If you've already added this script for another program, you can skip this step.
                      </p>
                    </div>
                  )}

                  <p className="text-sm text-gray-400 mb-3">
                    <strong>What this does:</strong> This script helps us track when visitors come from affiliate links. It needs to be on every page of your website.
                  </p>

                  <p className="text-sm text-gray-400 mb-4">
                    <strong>How to add it:</strong> Copy the code below and ask your web developer to add it to your website's template (usually in the header or footer, before the closing <code className="text-gray-500">&lt;/body&gt;</code> tag). If you're using WordPress, Shopify, or another platform, you can usually add this in your theme settings.
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

                {/* Step 2: Payment Integration */}
                <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-sm">2</span>
                    <span>Configure Payment Processor</span>
                  </h2>

                  <p className="text-sm text-gray-400 mb-4">
                    When a customer makes a payment, you need to tell Stripe or PayPal which program this sale belongs to. Copy the code below and add it to your checkout code where you create payments.
                  </p>

                  <div className="mb-4 p-3 bg-primary-900/20 border border-primary-800 rounded-md">
                    <p className="text-xs text-primary-300">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      <strong>Your Program ID:</strong> <code className="text-primary-200 font-mono">{selectedProgram.id}</code>
                    </p>
                    <p className="text-xs text-primary-300/80 mt-1">
                      You'll need this ID in the code below. If you're not sure where to add this code, ask your developer to help.
                    </p>
                  </div>

                  {/* Stripe Integration */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <span className="text-primary-400">For Stripe Users</span>
                    </h3>
                    <p className="text-xs text-gray-400 mb-2">
                      Copy this code and add it to your Stripe payment code. Replace the example amount with your actual price:
                    </p>
                    <CodeBlock code={stripeCode} language="javascript" id="stripe-code" />
                    <div className="mt-3 p-3 bg-blue-900/20 border border-blue-800 rounded-md">
                      <p className="text-xs text-blue-300 mb-1">
                        <strong>What this does:</strong> When someone pays, Stripe will include your program ID so we can track the sale.
                      </p>
                    </div>
                  </div>

                  {/* PayPal Integration */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <span className="text-primary-400">For PayPal Users</span>
                    </h3>
                    <p className="text-xs text-gray-400 mb-2">
                      Copy this code and add it to your PayPal order code. Replace the example amount with your actual price:
                    </p>
                    <CodeBlock code={paypalCode} language="javascript" id="paypal-code" />
                    <div className="mt-3 p-3 bg-blue-900/20 border border-blue-800 rounded-md">
                      <p className="text-xs text-blue-300 mb-1">
                        <strong>What this does:</strong> When someone pays, PayPal will include your program ID so we can track the sale.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 3: Webhook Configuration */}
                <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-sm">3</span>
                    <span>Configure Webhooks</span>
                  </h2>

                  <p className="text-sm text-gray-400 mb-4">
                    A webhook is like a notification system. When someone completes a payment, Stripe or PayPal will automatically notify us. This way, we can track sales without needing any code on your thank you page!
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-md">
                      <h3 className="text-sm font-semibold text-white mb-3">Stripe Setup (Step by Step)</h3>
                      <ol className="text-xs text-gray-400 space-y-2 mb-3 list-decimal list-inside">
                        <li>Go to your <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">Stripe Dashboard → Webhooks</a></li>
                        <li>Click "Add endpoint" or "Add webhook endpoint"</li>
                        <li>Paste this URL in the endpoint field:</li>
                      </ol>
                      <div className="mb-3">
                        <code className="text-xs text-primary-300 block bg-gray-950 p-3 rounded border border-gray-800 break-all">
                          {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/stripe` : 'https://your-domain.com/api/webhooks/stripe'}
                        </code>
                        <button
                          onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/stripe` : 'https://your-domain.com/api/webhooks/stripe', 'stripe-webhook-url')}
                          className="mt-2 text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                        >
                          {copied === 'stripe-webhook-url' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>
                      </div>
                      <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside" start={4}>
                        <li>Under "Events to send", select these two events:
                          <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                            <li><code className="text-gray-500">payment_intent.succeeded</code></li>
                            <li><code className="text-gray-500">charge.refunded</code></li>
                          </ul>
                        </li>
                        <li>Click "Add endpoint" to save</li>
                      </ol>
                    </div>

                    <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-md">
                      <h3 className="text-sm font-semibold text-white mb-3">PayPal Setup (Step by Step)</h3>
                      <ol className="text-xs text-gray-400 space-y-2 mb-3 list-decimal list-inside">
                        <li>Go to your <a href="https://developer.paypal.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">PayPal Developer Dashboard</a></li>
                        <li>Navigate to your app → Webhooks section</li>
                        <li>Click "Add webhook"</li>
                        <li>Paste this URL in the webhook URL field:</li>
                      </ol>
                      <div className="mb-3">
                        <code className="text-xs text-primary-300 block bg-gray-950 p-3 rounded border border-gray-800 break-all">
                          {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/paypal` : 'https://your-domain.com/api/webhooks/paypal'}
                        </code>
                        <button
                          onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/paypal` : 'https://your-domain.com/api/webhooks/paypal', 'paypal-webhook-url')}
                          className="mt-2 text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                        >
                          {copied === 'paypal-webhook-url' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>
                      </div>
                      <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside" start={5}>
                        <li>Select these event types:
                          <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                            <li><code className="text-gray-500">PAYMENT.CAPTURE.COMPLETED</code></li>
                            <li><code className="text-gray-500">PAYMENT.CAPTURE.REFUNDED</code></li>
                          </ul>
                        </li>
                        <li>Click "Save" to finish</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Step 4: Validation & Listening */}
                <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-sm">4</span>
                      <span>Validate Installation</span>
                    </h2>
                    <button
                      onClick={() => {
                        setListening(!listening);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-white text-sm transition ${listening
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
                    Use this tool to test if everything is working correctly. Click "Start Listening" and then test your setup by either:
                  </p>

                  <ul className="text-sm text-gray-400 mb-4 space-y-2 list-disc list-inside ml-2">
                    <li>Visiting your website with an affiliate link (to test click tracking)</li>
                    <li>Completing a test purchase (to test conversion tracking)</li>
                  </ul>

                  <p className="text-sm text-gray-400 mb-4">
                    Once we receive your first tracking event, your program will automatically be marked as "Active" and you're all set!
                  </p>

                  {listening && (
                    <div className="mt-4 p-4 bg-gray-900/50 border border-gray-700 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                        <span className="text-sm text-gray-300">Watching for events...</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        We're monitoring for clicks and sales. Try visiting your site with an affiliate link or complete a test purchase to see events appear here.
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
                  <h2 className="text-lg font-semibold text-white mb-4">How It Works (Simple Explanation)</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-white">1</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white mb-1">Affiliate shares your link</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          An affiliate shares a special tracking link with their audience. When someone clicks it, they visit your website.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-white">2</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white mb-1">We remember the visitor</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          Our tracking script remembers that this visitor came from an affiliate. This information is saved for 60 days, so even if they come back later to buy, we'll know who referred them.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-white">3</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white mb-1">Customer makes a purchase</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          The visitor decides to buy something and completes checkout through Stripe or PayPal. Your payment processor automatically sends us a notification (webhook) about the sale.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-white">4</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white mb-1">Commission is automatically recorded</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          We match the sale to the affiliate who referred the customer, calculate their commission, and add it to their account. The affiliate can see this in their dashboard right away. No manual work needed!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-primary-900/20 border border-primary-800 rounded-md">
                    <p className="text-sm text-primary-300">
                      <strong>✨ The Best Part:</strong> Everything happens automatically! Once you set up the webhook (Step 3), you don't need to add any code to your thank you page. Sales are tracked instantly when payments complete.
                    </p>
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
