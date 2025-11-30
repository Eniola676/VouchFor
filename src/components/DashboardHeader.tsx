import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from 'lucide-react';

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export default function DashboardHeader() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch profile from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      setUserProfile({
        full_name: profile?.full_name || user.user_metadata?.full_name || null,
        avatar_url: profile?.avatar_url || null,
        email: user.email || null,
      });
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Fallback to auth user data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserProfile({
          full_name: user.user_metadata?.full_name || null,
          avatar_url: null,
          email: user.email || null,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const displayName = userProfile?.full_name || userProfile?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="w-full h-16 bg-black border-b border-gray-800 flex items-center justify-between px-6 z-20 relative">
      <div className="flex-1" /> {/* Spacer for centering */}
      
      <div className="flex items-center gap-4">
        {!loading && userProfile && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-900/50 border border-gray-700 hover:bg-gray-800/50 transition-colors">
            {userProfile.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                {initials}
              </div>
            )}
            <span className="text-white text-sm font-medium">{displayName}</span>
          </div>
        )}
        {loading && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-900/50 border border-gray-700">
            <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
            <div className="w-20 h-4 bg-gray-700 rounded animate-pulse" />
          </div>
        )}
      </div>
    </header>
  );
}

