import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { SidebarDrawer } from './components/SidebarDrawer';
import { BottomMobileNav } from './components/BottomMobileNav';
import { FloatingControls } from './components/FloatingControls';
import { AuthModals } from './components/AuthModals';
import { QuickTradeModal } from './components/QuickTradeModal';
import { WalletConnectModal } from './components/WalletConnectModal';
import { NotificationsModal } from './components/NotificationsModal';
import { LiveChatWidget } from './components/LiveChatWidget';
import { NeonDbModal } from './components/NeonDbModal';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';

// Views
import { LandingView } from './components/views/LandingView';
import { DashboardView } from './components/views/DashboardView';
import { MarketsView } from './components/views/MarketsView';
import { CopyTradingView } from './components/views/CopyTradingView';
import { PortfolioView } from './components/views/PortfolioView';
import { InvestmentPlansView } from './components/views/InvestmentPlansView';
import { WalletView } from './components/views/WalletView';
import { StatementsView } from './components/views/StatementsView';
import { KycView } from './components/views/KycView';
import { ProfileView } from './components/views/ProfileView';
import { ReferralView } from './components/views/ReferralView';
import { SupportView } from './components/views/SupportView';
import { AdminDashboard } from './components/admin/AdminDashboard';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, toast, isLoggedIn } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingView />;
      case 'dashboard':
        return <DashboardView />;
      case 'markets':
        return <MarketsView />;
      case 'portfolio':
        return <PortfolioView />;
      case 'performance':
        return <PortfolioView />;
      case 'plans':
        return <InvestmentPlansView />;
      case 'copy-trading':
      case 'copy':
      case 'experts':
        return <CopyTradingView />;
      case 'ai-bots':
      case 'signals':
        return <MarketsView />;

      case 'wallet':
        return <WalletView />;
      case 'statements':
        return <StatementsView />;
      case 'kyc':
        return <KycView />;
      case 'profile':
        return <ProfileView />;
      case 'referral':
        return <ReferralView />;
      case 'support':
        return <SupportView />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return isLoggedIn ? <DashboardView /> : <LandingView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090e1a] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header & Live Ticker */}
      <Header />

      {/* Main View Area */}
      <main className="flex-1 w-full">
        {renderActiveView()}
      </main>

      {/* Global Interactive Overlays */}
      <SidebarDrawer />
      <BottomMobileNav />
      <FloatingControls />
      <AuthModals />
      <QuickTradeModal />
      <WalletConnectModal />
      <NotificationsModal />
      <LiveChatWidget />
      <NeonDbModal />
      <DepositModal />
      <WithdrawModal />


      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm bg-slate-900 border border-blue-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span className="text-xs font-semibold leading-snug">{toast.text}</span>
        </div>
      )}

      {/* Footer Legal & Regulatory Bar */}
      <footer className="border-t border-slate-800/80 bg-[#060a14] py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/brand/blue-edge-mark.png"
              alt="Blue Edge Market"
              className="h-6 w-auto object-contain"
            />
            <span className="text-slate-400 font-semibold">
              Blue Edge Market LLC • Authorized & Regulated Broker-Dealer
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 text-[11px] text-center md:text-right text-slate-500 leading-relaxed">
            <span>SIPC Protected up to $500,000 · Segregated Custody under SEC Rule 15c3-3</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
