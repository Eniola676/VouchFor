import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Search, Settings, LogOut } from 'lucide-react';
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

    if (path.startsWith('/dashboard/vendor') || path.startsWith('/programs') || path.startsWith('/settings')) {
      return '/settings/account';
    }

    if (path.startsWith('/dashboard/affiliate') || path.startsWith('/affiliate')) {
      return '/affiliate/settings/profile';
    }

    if (userProfile?.role === 'vendor') return '/settings/account';
    if (userProfile?.role === 'affiliate') return '/affiliate/settings/profile';

    return '/settings/account';
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();

      const path = location.pathname;

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
      "bg-[#1a1a2c] border-gray-800"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-8">
        <img src="/logo.png" alt="Earniyx" className="h-9 w-auto" />

        {/* Search Bar */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search campaigns, affiliates..."
            className="w-64 lg:w-80 pl-10 pr-4 py-2 bg-[#0f0e21] border border-[rgba(255,255,255,0.05)] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[rgba(255,75,0,0.3)] focus:ring-1 focus:ring-[rgba(255,75,0,0.2)] transition-all"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {!loading && userProfile && (
          <DropdownMenu
            align="right"
            trigger={
              <div className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-full transition-colors",
                "bg-[#0f0e21] border border-[rgba(255,255,255,0.05)]",
                "hover:bg-[#1a1929] cursor-pointer"
              )}>
                {userProfile.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#ff4b00] flex items-center justify-center text-white text-sm font-semibold">
                    {initials}
                  </div>
                )}
                <span className="text-sm font-medium text-white">
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
              <span className="text-sm text-gray-100">Theme</span>
              <ThemeToggle />
            </div>
          </DropdownMenu>
        )}
        {loading && (
          <div className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-full",
            "bg-[#0f0e21] border border-[rgba(255,255,255,0.05)]"
          )}>
            <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
            <div className="w-20 h-4 bg-gray-700 rounded animate-pulse" />
          </div>
        )}
      </div>
    </header>
  );
}
