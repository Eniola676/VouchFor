import { AffiliateSidebar } from '@/components/AffiliateSidebar';
import { VendorSidebar } from '@/components/VendorSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { GridBackground } from '@/components/ui/grid-background';
import { MessageSquare, Sparkles, Bug, Lightbulb } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

export default function FeedbackPage() {
  const [userRole, setUserRole] = useState<'vendor' | 'affiliate' | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackType, setFeedbackType] = useState<'feature' | 'bug' | 'general'>('feature');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Here you would typically save to a feedback table
      // For now, we'll just simulate a submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSubmitted(true);
      setTitle('');
      setDescription('');
      setFeedbackType('feature');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full min-h-screen relative">
        <GridBackground />
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
      <GridBackground />
      
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
              <h1 className="text-2xl font-semibold text-white mb-2">Feature Requests & Feedback</h1>
              <p className="text-sm text-gray-400">Share your ideas, report bugs, or provide feedback</p>
            </div>

            {submitted ? (
              <div className="bg-primary-600/20 border border-primary-600/50 rounded-lg p-6 text-center">
                <Sparkles className="w-12 h-12 text-primary-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Thank you for your feedback!</h3>
                <p className="text-gray-300 text-sm mb-4">
                  We've received your submission and will review it soon.
                </p>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="primary"
                  size="md"
                >
                  Submit Another
                </Button>
              </div>
            ) : (
              <div className="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Feedback Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      What type of feedback is this?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setFeedbackType('feature')}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all text-left",
                          feedbackType === 'feature'
                            ? "border-primary-600 bg-primary-600/20"
                            : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
                        )}
                      >
                        <Lightbulb className="w-5 h-5 text-primary-400 mb-2" />
                        <div className="text-white text-sm font-medium">Feature Request</div>
                        <div className="text-gray-400 text-xs mt-1">Suggest a new feature</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFeedbackType('bug')}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all text-left",
                          feedbackType === 'bug'
                            ? "border-primary-600 bg-primary-600/20"
                            : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
                        )}
                      >
                        <Bug className="w-5 h-5 text-primary-400 mb-2" />
                        <div className="text-white text-sm font-medium">Bug Report</div>
                        <div className="text-gray-400 text-xs mt-1">Report an issue</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFeedbackType('general')}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all text-left",
                          feedbackType === 'general'
                            ? "border-primary-600 bg-primary-600/20"
                            : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
                        )}
                      >
                        <MessageSquare className="w-5 h-5 text-primary-400 mb-2" />
                        <div className="text-white text-sm font-medium">General</div>
                        <div className="text-gray-400 text-xs mt-1">Other feedback</div>
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Brief summary of your feedback"
                      className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide details about your feedback, feature request, or bug report..."
                      rows={8}
                      className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition resize-none"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={submitting}
                    fullWidth
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

