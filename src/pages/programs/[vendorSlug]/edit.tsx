import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { VendorSidebar } from '@/components/VendorSidebar';
import { GridBackground } from '@/components/ui/grid-background';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { ArrowLeft, Copy, Check, ExternalLink, Code } from 'lucide-react';
import Button from '@/components/ui/Button';

interface VendorProgram {
  id: string;
  vendor_slug: string;
  program_name: string;
  destination_url: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: string;
  cookie_duration: number;
  cooling_off_period: number;
  payout_schedule: string;
  payout_method: string;
  minimum_payout_threshold: string;
  transaction_fees: string;
  service_price: string | null;
  is_active: boolean;
}

export default function ProgramEditPage() {
  const { vendorSlug } = useParams<{ vendorSlug: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<VendorProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgram();
  }, [vendorSlug]);

  const fetchProgram = async () => {
    if (!vendorSlug) return;

    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('vendor_slug', vendorSlug)
        .single();

      if (error) {
        console.error('Error fetching program:', error);
        setError('Program not found');
      } else {
        setProgram(data);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load program');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!program) return;

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('vendors')
        .update({
          program_name: program.program_name,
          destination_url: program.destination_url,
          commission_type: program.commission_type,
          commission_value: program.commission_value,
          cookie_duration: program.cookie_duration,
          cooling_off_period: program.cooling_off_period,
          payout_schedule: program.payout_schedule,
          payout_method: program.payout_method,
          minimum_payout_threshold: program.minimum_payout_threshold,
          transaction_fees: program.transaction_fees,
          service_price: program.service_price,
          is_active: program.is_active,
        })
        .eq('id', program.id);

      if (updateError) {
        throw updateError;
      }

      // Show success and refresh
      alert('Program updated successfully!');
      fetchProgram();
    } catch (err) {
      console.error('Error updating program:', err);
      setError(err instanceof Error ? err.message : 'Failed to update program');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const programUrl = program 
    ? `${window.location.origin}/p/${program.vendor_slug}`
    : '';

  const trackerScriptUrl = `${window.location.origin}/tracker.js`;

  if (loading) {
    return (
      <div className={cn("rounded-md flex flex-col md:flex-row w-full flex-1 min-h-screen bg-black", "relative")}>
        <GridBackground />
        <div className="relative z-10">
          <VendorSidebar />
        </div>
        <div className="flex flex-1 relative z-10 items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!program || error) {
    return (
      <div className={cn("rounded-md flex flex-col md:flex-row w-full flex-1 min-h-screen bg-black", "relative")}>
        <GridBackground />
        <div className="relative z-10">
          <VendorSidebar />
        </div>
        <div className="flex flex-1 relative z-10 items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-4">{error || 'Program not found'}</p>
            <Link to="/programs" className="text-primary-400 hover:text-primary-300">
              Back to Programs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-md flex flex-col md:flex-row w-full flex-1 min-h-screen bg-black", "relative")}>
      <GridBackground />
      <div className="relative z-10">
        <VendorSidebar />
      </div>
      
      <div className="flex flex-1 relative z-10">
        <div className="p-2 md:p-10 rounded-tl-2xl border-l border-gray-800 bg-black/95 backdrop-blur-xl flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
          {/* Header */}
          <div className="mb-4">
            <Link
              to="/programs"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Programs
            </Link>
            <h1 className="text-2xl font-semibold text-white mb-2">Edit Program</h1>
            <p className="text-sm text-gray-400">{program.program_name}</p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-md p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Edit Form */}
            <div className="space-y-6">
              <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Program Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Program Name
                    </label>
                    <input
                      type="text"
                      value={program.program_name}
                      onChange={(e) => setProgram({ ...program, program_name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Destination URL
                    </label>
                    <input
                      type="url"
                      value={program.destination_url}
                      onChange={(e) => setProgram({ ...program, destination_url: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Commission Type
                      </label>
                      <select
                        value={program.commission_type}
                        onChange={(e) => setProgram({ ...program, commission_type: e.target.value as 'percentage' | 'fixed' })}
                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Commission Value
                      </label>
                      <input
                        type="text"
                        value={program.commission_value}
                        onChange={(e) => setProgram({ ...program, commission_value: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Cookie Duration (days)
                      </label>
                      <input
                        type="number"
                        value={program.cookie_duration}
                        onChange={(e) => setProgram({ ...program, cookie_duration: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={program.is_active ? 'active' : 'inactive'}
                        onChange={(e) => setProgram({ ...program, is_active: e.target.value === 'active' })}
                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    variant="primary"
                    fullWidth
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column - Program URL & Tracker Code */}
            <div className="space-y-6">
              {/* Program URL */}
              <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Program URL
                </h2>
                <p className="text-sm text-gray-400 mb-3">
                  Share this URL with potential affiliates to join your program
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={programUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-700 text-white text-sm rounded-md"
                  />
                  <button
                    onClick={() => copyToClipboard(programUrl, 'program-url')}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-white text-sm transition flex items-center gap-2"
                  >
                    {copied === 'program-url' ? (
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
                <Link
                  to={`/p/${program.vendor_slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 mt-3 text-sm text-primary-400 hover:text-primary-300"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Program Page
                </Link>
              </div>

              {/* Tracker Code */}
              <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Tracker Script
                </h2>
                <p className="text-sm text-gray-400 mb-3">
                  Add this script to your website to track affiliate signups
                </p>
                <div className="mb-3">
                  <label className="block text-xs text-gray-400 mb-1">Script URL:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={trackerScriptUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 text-white text-xs rounded-md"
                    />
                    <button
                      onClick={() => copyToClipboard(trackerScriptUrl, 'tracker-url')}
                      className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-white text-xs transition"
                    >
                      {copied === 'tracker-url' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Code to add:</label>
                  <div className="relative">
                    <pre className="bg-gray-900 border border-gray-800 rounded-lg p-3 overflow-x-auto">
                      <code className="text-xs text-gray-300">
                        {`<script src="${trackerScriptUrl}"></script>`}
                      </code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`<script src="${trackerScriptUrl}"></script>`, 'tracker-code')}
                      className="absolute top-2 right-2 px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-white text-xs transition"
                    >
                      {copied === 'tracker-code' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <Link
                  to="/settings/integrations"
                  className="inline-flex items-center gap-2 mt-3 text-sm text-primary-400 hover:text-primary-300"
                >
                  View Integration Guide
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

