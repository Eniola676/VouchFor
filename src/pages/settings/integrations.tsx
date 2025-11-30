import { useEffect, useState } from 'react';
import { VendorSidebar } from '@/components/VendorSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { GridBackground } from '@/components/ui/grid-background';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Check, Copy, Code, Globe, Play } from 'lucide-react';

interface VendorProgram {
  id: string;
  vendor_slug: string;
  program_name: string;
  is_active: boolean;
}

export default function IntegrationsPage() {
  const [programs, setPrograms] = useState<VendorProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<VendorProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, vendor_slug, program_name, is_active')
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

  const apiEndpoint = typeof window !== 'undefined'
    ? `${window.location.origin}/api/track/event`
    : 'https://your-domain.com/api/track/event';

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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

  const basicTrackerCode = `<!-- Add before closing </body> tag -->
<script src="${trackerScriptUrl}"></script>`;

  const signupTrackingCode = `// Track signup on form submission
document.getElementById('signup-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  
  // Track the signup
  window.vouchfor.track('signup', {
    email: email
  }).then(function(response) {
    console.log('Signup tracked:', response);
    // Continue with your form submission
  }).catch(function(error) {
    console.error('Tracking error:', error);
  });
});`;

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
              <p className="text-sm text-gray-400">Add the VouchFor tracker to your website to track affiliate signups</p>
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
              {/* Video Guide Placeholder */}
              <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Video Guide
                </h2>
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center border border-gray-800">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">Video tutorial coming soon</p>
                    <p className="text-sm text-gray-500">Learn how to integrate the tracker in this step-by-step video guide</p>
                  </div>
                </div>
              </div>

              {/* Tracker Script URL */}
              <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Tracker Script URL
                </h2>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={trackerScriptUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-700 text-white text-sm rounded-md"
                  />
                  <button
                    onClick={() => copyToClipboard(trackerScriptUrl, 'tracker-url')}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-white text-sm transition flex items-center gap-2"
                  >
                    {copied === 'tracker-url' ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Include this script URL in your website to enable tracking.
                </p>
              </div>

              {/* Quick Start */}
              <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Start</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Step 1: Add the Script</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Add this code before the closing <code className="text-gray-500">&lt;/body&gt;</code> tag:
                    </p>
                    <CodeBlock code={basicTrackerCode} id="basic-script" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Step 2: Track Signups</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Call the track function when a user signs up:
                    </p>
                    <CodeBlock code={signupTrackingCode} language="javascript" id="tracking-code" />
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">How It Works</h2>
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
                      <h3 className="text-sm font-medium text-white mb-1">Tracker saves referral ID</h3>
                      <p className="text-sm text-gray-400">
                        The tracker script detects the <code className="text-gray-500">?ref=</code> parameter and saves it for 90 days.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-white">3</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white mb-1">User signs up</h3>
                      <p className="text-sm text-gray-400">
                        When the user signs up, call <code className="text-gray-500">window.vouchfor.track('signup', {'{'} email: '...' {'}'})</code> to record the signup.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-white">4</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white mb-1">Signup is recorded</h3>
                      <p className="text-sm text-gray-400">
                        The signup is automatically recorded and appears in the affiliate's dashboard.
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

