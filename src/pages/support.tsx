import { AffiliateSidebar } from '@/components/AffiliateSidebar';
import { VendorSidebar } from '@/components/VendorSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { HelpCircle, Mail, Send, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function CustomerSupportPage() {
  const [userRole, setUserRole] = useState<'vendor' | 'affiliate' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setUserRole(profile?.role === 'vendor' ? 'vendor' : 'affiliate');
    } catch (err) {
      console.error('Error fetching user role:', err);
      setUserRole('affiliate'); // Default
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full min-h-screen relative">
        <div className="relative z-20">
          <DashboardHeader />
        </div>
        <div className="flex items-center justify-center flex-1">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const Sidebar = userRole === 'vendor' ? VendorSidebar : AffiliateSidebar;

  return (
    <div className={cn("flex flex-col w-full min-h-screen bg-black relative")}>
      {/* Top Header Bar */}
      <div className="relative z-20">
        <DashboardHeader />
      </div>
      
      <div className="flex flex-1 relative z-10">
        {/* Sidebar */}
        <div className="relative z-10">
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <div className="flex flex-1 relative z-10">
          <div className="p-2 md:p-10 rounded-tl-2xl border-l border-gray-800 bg-black/95 backdrop-blur-xl flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-white mb-2">Customer Support</h1>
              <p className="text-sm text-gray-400">Get help with your account, programs, and more</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Contact Support */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-primary-600 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-600/20 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Email Support</h3>
                    <p className="text-sm text-gray-400">Get help via email</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Send us an email and we'll get back to you within 24 hours.
                </p>
                <a
                  href="mailto:support@vouchfor.com"
                  className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm font-medium"
                >
                  support@vouchfor.com
                </a>
              </div>

              {/* DM on X */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-primary-600 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-600/20 flex items-center justify-center">
                    <Send className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">DM on X</h3>
                    <p className="text-sm text-gray-400">Send us a direct message</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Reach out to us on X (Twitter) for quick support.
                </p>
                <a
                  href="https://x.com/no_user009?s=21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm font-medium"
                >
                  Send DM on X
                </a>
              </div>

              {/* Feedback */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-primary-600 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-600/20 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Feedback</h3>
                    <p className="text-sm text-gray-400">Share your thoughts</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Send us feedback, feature requests, or report issues.
                </p>
                <Link
                  to="/feedback"
                  className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm font-medium"
                >
                  Go to Feedback Page
                </Link>
              </div>

              {/* FAQ */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-primary-600 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-600/20 flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">FAQs</h3>
                    <p className="text-sm text-gray-400">Frequently asked questions</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Quick answers to the most common questions.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm font-medium"
                >
                  View FAQs
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

