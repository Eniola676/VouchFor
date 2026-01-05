import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ThemeProvider } from './lib/theme-provider';
import { OfferDataProvider } from './contexts/OfferDataContext';
import VendorDashboard from './pages/VendorDashboard';
import Programs from './pages/Programs';
import PartnerRecruitmentPage from './pages/p/[vendorSlug]';
import AffiliateSignupPage from './pages/signup/affiliate';
import VendorSignupPage from './pages/signup/vendor';
import AffiliateLoginPage from './pages/login/affiliate';
import VendorLoginPage from './pages/login/vendor';
import OAuthCallback from './components/auth/OAuthCallback';
import ProgramPreview from './pages/ProgramPreview';
import AffiliateDashboard from './pages/dashboard/affiliate';
import CommissionsPage from './pages/dashboard/affiliate/commissions';
import TrackingLinkPage from './pages/go/TrackingLink';
import SettingsPage from './pages/settings/index';
import AccountDetailsPage from './pages/settings/account';
import SecurityPage from './pages/settings/security';
import IntegrationsPage from './pages/settings/integrations';
import ProgramEditPage from './pages/programs/[vendorSlug]/edit';
import CustomerSupportPage from './pages/support';
import FeedbackPage from './pages/feedback';
import AffiliateSettingsPage from './pages/affiliate/settings';
import AffiliateProfilePage from './pages/affiliate/settings/profile';
import AffiliatePayoutPage from './pages/affiliate/settings/payout';
import AffiliateSecurityPage from './pages/affiliate/settings/security';
import PartnersPage from './pages/dashboard/vendor/partners';
import { supabase } from './lib/supabase';

/**
 * Auth gate for the root route.
 *
 * - If user is authenticated, send them to the vendor dashboard
 * - If not authenticated, send them to the vendor login page
 *
 * NOTE: This uses Supabase auth directly. If you swap auth providers later,
 * update the check in this component and in RequireAuth below.
 */
function RootAuthGate() {
  const navigate = useNavigate();

  useEffect(() => {
    let isCancelled = false;

    async function checkAuth() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (isCancelled) return;

        if (error || !data?.user) {
          // Not authenticated → send to vendor login
          navigate('/login/vendor', { replace: true });
        } else {
          // Authenticated → send to main vendor dashboard
          // If you later support separate affiliate/vendor dashboards, this
          // is where you'd branch based on user metadata/role.
          navigate('/dashboard/vendor', { replace: true });
        }
      } catch {
        if (!isCancelled) {
          navigate('/login/affiliate', { replace: true });
        }
      }
    }

    checkAuth();

    return () => {
      isCancelled = true;
    };
  }, [navigate]);

  // Minimal placeholder while we resolve auth – avoids layout shift.
  return null;
}

/**
 * Simple auth guard for protected routes.
 *
 * - Redirects unauthenticated users to the vendor login page
 * - Lets authenticated users render the requested dashboard page
 *
 * This is intentionally minimal and tied to Supabase; swap out the auth
 * check in one place here if you change providers later.
 */
function RequireAuth({ children }: { children: JSX.Element }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function check() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (isCancelled) return;

        if (error || !data?.user) {
          setIsAuthed(false);
        } else {
          setIsAuthed(true);
        }
      } finally {
        if (!isCancelled) {
          setIsChecking(false);
        }
      }
    }

    check();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (isChecking) {
    // Keep it minimal – real SaaS apps often show a tiny loader here.
    return null;
  }

  if (!isAuthed) {
    return <Navigate to="/login/vendor" replace />;
  }

  return children;
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <OfferDataProvider>
        <BrowserRouter>
          <Routes>
            {/* Root acts as an auth gate instead of a concrete page */}
            <Route path="/" element={<RootAuthGate />} />

            {/* Dashboards are protected */}
            <Route
              path="/dashboard/vendor"
              element={
                <RequireAuth>
                  <VendorDashboard />
                </RequireAuth>
              }
            />
            <Route path="/programs" element={<Programs />} />
            <Route path="/preview" element={<ProgramPreview />} />
            <Route path="/p/:vendorSlug" element={<PartnerRecruitmentPage />} />
            <Route path="/signup/affiliate" element={<AffiliateSignupPage />} />
            <Route path="/signup/vendor" element={<VendorSignupPage />} />
            <Route path="/login/affiliate" element={<AffiliateLoginPage />} />
            <Route path="/login/vendor" element={<VendorLoginPage />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route
              path="/dashboard/affiliate"
              element={
                <RequireAuth>
                  <AffiliateDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard/affiliate/commissions"
              element={
                <RequireAuth>
                  <CommissionsPage />
                </RequireAuth>
              }
            />
            <Route path="/go/:affiliateId/:programId" element={<TrackingLinkPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/account" element={<AccountDetailsPage />} />
            <Route path="/settings/security" element={<SecurityPage />} />
            <Route path="/settings/integrations" element={<IntegrationsPage />} />
            <Route path="/programs/:vendorSlug/edit" element={<ProgramEditPage />} />
            <Route path="/support" element={<CustomerSupportPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/affiliate/settings" element={<AffiliateSettingsPage />} />
            <Route path="/affiliate/settings/profile" element={<AffiliateProfilePage />} />
            <Route path="/affiliate/settings/payout" element={<AffiliatePayoutPage />} />
            <Route path="/affiliate/settings/security" element={<AffiliateSecurityPage />} />
            <Route
              path="/dashboard/vendor/partners"
              element={
                <RequireAuth>
                  <PartnersPage />
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </OfferDataProvider>
    </ThemeProvider>
  );
}

export default App;
