import { AffiliateSidebar } from '@/components/AffiliateSidebar';
import { VendorSidebar } from '@/components/VendorSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { MessageSquare, Sparkles, Bug, Lightbulb, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface FeedbackItem {
  id: string;
  user_id: string | null;
  user_role: 'vendor' | 'partner' | null;
  type: 'feature' | 'bug' | 'general';
  title: string;
  description: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  user_vote?: 'upvote' | 'downvote' | null;
}

export default function FeedbackPage() {
  const [userRole, setUserRole] = useState<'vendor' | 'affiliate' | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackType, setFeedbackType] = useState<'feature' | 'bug' | 'general'>('feature');
  const [selectedRole, setSelectedRole] = useState<'vendor' | 'partner' | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [featureRequests, setFeatureRequests] = useState<FeedbackItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [voting, setVoting] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUserRole();
    fetchFeatureRequests();
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

  const fetchFeatureRequests = async () => {
    try {
      setLoadingRequests(true);
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch all feature requests
      const { data: feedback, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      // Fetch user's votes if authenticated
      let userVotes: Record<string, 'upvote' | 'downvote'> = {};
      if (user) {
        const { data: votes } = await supabase
          .from('feedback_votes')
          .select('feedback_id, vote_type')
          .eq('user_id', user.id);

        if (votes) {
          votes.forEach((vote) => {
            userVotes[vote.feedback_id] = vote.vote_type as 'upvote' | 'downvote';
          });
        }
      }

      // Combine feedback with user votes
      const feedbackWithVotes = (feedback || []).map((item) => ({
        ...item,
        user_vote: userVotes[item.id] || null,
      }));

      setFeatureRequests(feedbackWithVotes);
    } catch (err) {
      console.error('Error fetching feature requests:', err);
    } finally {
      setLoadingRequests(false);
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

      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          user_role: selectedRole || null,
          type: feedbackType,
          title: title.trim(),
          description: description.trim(),
        });

      if (error) {
        throw error;
      }

      setSubmitted(true);
      setTitle('');
      setDescription('');
      setFeedbackType('feature');
      setSelectedRole('');
      
      // Refresh the feature requests list
      fetchFeatureRequests();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (feedbackId: string, voteType: 'upvote' | 'downvote') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in to vote');
        return;
      }

      setVoting((prev) => new Set(prev).add(feedbackId));

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('feedback_votes')
        .select('vote_type')
        .eq('feedback_id', feedbackId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if clicking the same vote type
          await supabase
            .from('feedback_votes')
            .delete()
            .eq('feedback_id', feedbackId)
            .eq('user_id', user.id);
        } else {
          // Update vote if different type
          await supabase
            .from('feedback_votes')
            .update({ vote_type: voteType })
            .eq('feedback_id', feedbackId)
            .eq('user_id', user.id);
        }
      } else {
        // Insert new vote
        await supabase
          .from('feedback_votes')
          .insert({
            feedback_id: feedbackId,
            user_id: user.id,
            vote_type: voteType,
          });
      }

      // Refresh the list to get updated vote counts
      fetchFeatureRequests();
    } catch (err) {
      console.error('Error voting:', err);
      alert('Failed to vote. Please try again.');
    } finally {
      setVoting((prev) => {
        const next = new Set(prev);
        next.delete(feedbackId);
        return next;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
          <div className="p-2 md:p-10 rounded-tl-2xl border-l border-gray-800 bg-black/95 backdrop-blur-xl flex gap-6 flex-1 w-full h-full overflow-y-auto">
            {/* Left Side - Form */}
            <div className="flex-1 min-w-0">
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

                  {/* User Role Selection (Optional) */}
                  <div>
                    <label htmlFor="userRole" className="block text-sm font-medium text-gray-300 mb-2">
                      I am a (Optional)
                    </label>
                    <select
                      id="userRole"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as 'vendor' | 'partner' | '')}
                      className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                    >
                      <option value="">Select...</option>
                      <option value="vendor">Vendor</option>
                      <option value="partner">Partner</option>
                    </select>
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
              )}
            </div>

            {/* Right Side - Feature Requests List */}
            <div className="w-96 flex-shrink-0">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Feature Requests</h2>
                <p className="text-sm text-gray-400">See what others are requesting</p>
              </div>

              {loadingRequests ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
                </div>
              ) : featureRequests.length === 0 ? (
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 text-center">
                  <p className="text-gray-400 text-sm">No feature requests yet</p>
                  <p className="text-gray-500 text-xs mt-1">Be the first to share your ideas!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {featureRequests.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {/* Vote Buttons */}
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => handleVote(item.id, 'upvote')}
                            disabled={voting.has(item.id)}
                            className={cn(
                              "p-1 rounded transition-colors",
                              item.user_vote === 'upvote'
                                ? "text-primary-400 bg-primary-600/20"
                                : "text-gray-400 hover:text-primary-400 hover:bg-gray-800"
                            )}
                          >
                            <ChevronUp className="w-5 h-5" />
                          </button>
                          <span className="text-sm font-medium text-white">
                            {item.upvotes - item.downvotes}
                          </span>
                          <button
                            onClick={() => handleVote(item.id, 'downvote')}
                            disabled={voting.has(item.id)}
                            className={cn(
                              "p-1 rounded transition-colors",
                              item.user_vote === 'downvote'
                                ? "text-red-400 bg-red-600/20"
                                : "text-gray-400 hover:text-red-400 hover:bg-gray-800"
                            )}
                          >
                            <ChevronDown className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded",
                              item.type === 'feature' && "bg-primary-600/20 text-primary-400",
                              item.type === 'bug' && "bg-red-600/20 text-red-400",
                              item.type === 'general' && "bg-gray-600/20 text-gray-400"
                            )}>
                              {item.type === 'feature' ? 'Feature' : item.type === 'bug' ? 'Bug' : 'General'}
                            </span>
                            {item.user_role && (
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-600/20 text-gray-400">
                                {item.user_role === 'vendor' ? 'Vendor' : 'Partner'}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatDate(item.created_at)}</span>
                            <div className="flex items-center gap-3">
                              <span>↑ {item.upvotes}</span>
                              <span>↓ {item.downvotes}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
