import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './lib/theme-provider';
import { OfferDataProvider } from './contexts/OfferDataContext';
import Dashboard from './pages/Dashboard';
import Programs from './pages/Programs';
import PartnerRecruitmentPage from './pages/p/[vendorSlug]';
import AffiliateSignupPage from './pages/signup/affiliate';
import ProgramPreview from './pages/ProgramPreview';
import AffiliateDashboard from './pages/dashboard/affiliate';
import CommissionsPage from './pages/dashboard/affiliate/commissions';

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <OfferDataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/preview" element={<ProgramPreview />} />
            <Route path="/p/:vendorSlug" element={<PartnerRecruitmentPage />} />
            <Route path="/signup/affiliate" element={<AffiliateSignupPage />} />
            <Route path="/dashboard/affiliate" element={<AffiliateDashboard />} />
            <Route path="/dashboard/affiliate/commissions" element={<CommissionsPage />} />
          </Routes>
        </BrowserRouter>
      </OfferDataProvider>
    </ThemeProvider>
  );
}

export default App;
