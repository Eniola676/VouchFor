import { Link } from 'react-router-dom';
import { AffiliateSidebar } from '@/components/AffiliateSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { cn } from '@/lib/utils';
import { User, CreditCard, Shield, ArrowRight } from 'lucide-react';

export default function AffiliateSettingsPage() {
  const settingsCards = [
    {
      title: 'My Profile',
      description: 'Manage your personal details and avatar.',
      icon: <User className="w-6 h-6 text-primary-400" />,
      href: '/affiliate/settings/profile',
      color: 'primary',
    },
    {
      title: 'Payout Details',
      description: 'Add your bank information to receive payments.',
      icon: <CreditCard className="w-6 h-6 text-primary-400" />,
      href: '/affiliate/settings/payout',
      color: 'primary',
    },
    {
      title: 'Security',
      description: 'Update your password and security settings.',
      icon: <Shield className="w-6 h-6 text-primary-400" />,
      href: '/affiliate/settings/security',
      color: 'primary',
    },
  ];

  return (
    <div className={cn("flex flex-col w-full min-h-screen bg-black", "relative")}>
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
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-white mb-2">Settings</h1>
              <p className="text-sm text-gray-400">Manage your account settings and preferences</p>
            </div>

            {/* Settings Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {settingsCards.map((card) => (
                <Link
                  key={card.href}
                  to={card.href}
                  className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-primary-600 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-600/20 flex items-center justify-center group-hover:bg-primary-600/30 transition-colors">
                      {card.icon}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-400">{card.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






