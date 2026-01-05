import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { User, Settings, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: string | null;
}

export default function DashboardHeader() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme } = useTheme();

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
        .select('full_name, avatar_url, role')
        .eq('id', user.id)
        .single();

      setUserProfile({
        full_name: profile?.full_name || user.user_metadata?.full_name || null,
        avatar_url: profile?.avatar_url || null,
        email: user.email || null,
        role: profile?.role || null,
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
          role: null,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getAccountPath = () => {
    const path = location.pathname;

    // Prefer current context based on URL, then fall back to role.
    if (path.startsWith('/dashboard/vendor') || path.startsWith('/programs') || path.startsWith('/settings')) {
      return '/settings/account';
    }

    if (path.startsWith('/dashboard/affiliate') || path.startsWith('/affiliate')) {
      return '/affiliate/settings/profile';
    }

    if (userProfile?.role === 'vendor') return '/settings/account';
    if (userProfile?.role === 'affiliate') return '/affiliate/settings/profile';

    // Safe default – vendor-style account settings.
    return '/settings/account';
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();

      const path = location.pathname;

      // Redirect purely based on where the user is in the app right now.
      // This avoids any mismatch between profile role and current UI context.
      const isAffiliateContext =
        path.startsWith('/dashboard/affiliate') ||
        path.startsWith('/affiliate') ||
        path.startsWith('/go');

      const target = isAffiliateContext ? '/login/affiliate' : '/login/vendor';
      navigate(target, { replace: true });
    } catch (err) {
      console.error('Error signing out:', err);
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
    <header className={cn(
      "w-full h-16 border-b flex items-center justify-between px-6 z-20 relative",
      "bg-white dark:bg-black border-gray-200 dark:border-gray-800"
    )}>
      <div className="flex-1" /> {/* Spacer for centering */}
      
      <div className="flex items-center gap-4">
        {!loading && userProfile && (
          <DropdownMenu
            align="right"
            trigger={
              <div className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-full transition-colors",
                "bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700",
                "hover:bg-gray-200 dark:hover:bg-gray-800/50 cursor-pointer"
              )}>
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
                <span className={cn(
                  "text-sm font-medium",
                  "text-gray-900 dark:text-white"
                )}>
                  {displayName}
                </span>
              </div>
            }
          >
            <DropdownMenuItem
              onClick={() => navigate(getAccountPath())}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 hover:text-red-500"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div
              className="px-4 py-2 flex items-center justify-between gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-sm text-gray-900 dark:text-gray-100">Theme</span>
              <ThemeToggle />
            </div>
          </DropdownMenu>
        )}
        {loading && (
          <div className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-full",
            "bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700"
          )}>
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
            <div className="w-20 h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        )}
      </div>
    </header>
  );
}

