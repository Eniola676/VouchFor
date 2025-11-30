import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AffiliateSidebar } from '@/components/AffiliateSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { GridBackground } from '@/components/ui/grid-background';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Shield, Lock, Key, Smartphone, ArrowLeft, Check, X } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function AffiliateSecurityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<Array<{ provider: string; connected: boolean }>>([]);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Check for connected providers
      const providers = ['google', 'github', 'twitter'];
      const connected: Array<{ provider: string; connected: boolean }> = [];
      
      // Note: Supabase doesn't directly expose connected providers in the user object
      // This is a placeholder - you'd need to check via auth metadata or a separate table
      providers.forEach(provider => {
        connected.push({
          provider,
          connected: false, // Placeholder - implement actual check
        });
      });

      setConnectedAccounts(connected);
    } catch (err) {
      console.error('Error fetching security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert('New passwords do not match');
        setSaving(false);
        return;
      }

      if (passwordData.newPassword.length < 8) {
        alert('Password must be at least 8 characters long');
        setSaving(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) {
        throw error;
      }

      alert('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      console.error('Error updating password:', err);
      alert('Failed to update password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTwoFactor = async () => {
    // Placeholder - implement actual 2FA logic
    setTwoFactorEnabled(!twoFactorEnabled);
    alert('Two-factor authentication ' + (!twoFactorEnabled ? 'enabled' : 'disabled'));
  };

  if (loading) {
    return (
      <div className={cn("flex flex-col w-full min-h-screen bg-black", "relative")}>
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
          <AffiliateSidebar />
        </div>
        
        {/* Main Content */}
        <div className="flex flex-1 relative z-10">
          <div className="p-2 md:p-10 rounded-tl-2xl border-l border-gray-800 bg-black/95 backdrop-blur-xl flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
            {/* Header with Back Button */}
            <div className="mb-6">
              <Link
                to="/affiliate/settings"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Settings</span>
              </Link>
              <h1 className="text-2xl font-semibold text-white mb-2">Security</h1>
              <p className="text-sm text-gray-400">Manage your password, two-factor authentication, and connected accounts</p>
            </div>

            {/* Split Layout */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Side - Info/Description */}
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Security Best Practices</h2>
                  <p className="text-sm text-gray-400 mb-4">
                    Keep your account secure by following these recommendations.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Lock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Use a strong, unique password</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Smartphone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Enable two-factor authentication for extra security</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Review connected accounts regularly</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Security Cards */}
              <div className="space-y-6">
                {/* Password Card */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center">
                        <Key className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Password</h3>
                        <p className="text-sm text-gray-400">Update your account password</p>
                      </div>
                    </div>
                  </div>
                  
                  <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                        placeholder="Enter new password"
                        minLength={8}
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                        placeholder="Confirm new password"
                        minLength={8}
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={saving}
                      fullWidth
                    >
                      {saving ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </div>

                {/* Two-Factor Authentication Card */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-400">Add an extra layer of security</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {twoFactorEnabled ? (
                        <span className="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400 border border-green-800">
                          Enabled
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-gray-900/30 text-gray-400 border border-gray-800">
                          Disabled
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    Two-factor authentication adds an additional security layer to your account by requiring a verification code from your phone.
                  </p>
                  <Button
                    onClick={toggleTwoFactor}
                    variant={twoFactorEnabled ? "secondary" : "primary"}
                    size="md"
                    fullWidth
                  >
                    {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </Button>
                </div>

                {/* Social Accounts Card */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Connected Accounts</h3>
                      <p className="text-sm text-gray-400">Manage your social account connections</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {connectedAccounts.map((account) => (
                      <div
                        key={account.provider}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-white capitalize">{account.provider}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {account.connected ? (
                            <>
                              <Check className="w-4 h-4 text-green-400" />
                              <span className="text-xs text-green-400">Connected</span>
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 text-gray-500" />
                              <span className="text-xs text-gray-500">Not connected</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

