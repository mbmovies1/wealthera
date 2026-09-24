import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext.js';
import { ToastContainer } from './components/Toast.js';
import { Header } from './components/Header.js';
import { BottomNav, NavTab } from './components/BottomNav.js';

import { LoginView } from './views/LoginView.js';
import { RegisterView } from './views/RegisterView.js';
import { AdminLoginView } from './views/AdminLoginView.js';
import { DashboardView } from './views/DashboardView.js';
import { WalletView } from './views/WalletView.js';
import { DepositModal } from './views/DepositModal.js';
import { WithdrawModal } from './views/WithdrawModal.js';
import { PlansView } from './views/PlansView.js';
import { TeamView } from './views/TeamView.js';
import { TransactionsView } from './views/TransactionsView.js';
import { NotificationsView } from './views/NotificationsView.js';
import { CustomerSupportView } from './views/CustomerSupportView.js';
import { MoreMenuView } from './views/MoreMenuView.js';
import { AdminPanelView } from './views/AdminPanelView.js';
import { DepositWithdrawalHistorySection } from './components/DepositWithdrawalHistorySection.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';

type AuthScreen = 'login' | 'register';
type AppView = 'home' | 'wallet' | 'team' | 'more' | 'plans' | 'transactions' | 'notifications' | 'support' | 'history';

const MainLayout: React.FC = () => {
  const { user, admin, isImpersonating, logoutAdmin } = useApp();

  // Helper to detect if current URL is the dedicated /admin or /admmin route
  const checkIsAdminPath = () => {
    if (typeof window === 'undefined') return false;
    const pathname = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      pathname === '/admin' ||
      pathname.startsWith('/admin/') ||
      pathname === '/admmin' ||
      pathname.startsWith('/admmin/') ||
      hash === '#/admin' ||
      hash.startsWith('#/admin') ||
      hash === '#/admmin' ||
      hash.startsWith('#/admmin') ||
      hash === '#admin' ||
      hash === '#admmin' ||
      search.includes('admin=true') ||
      search.includes('route=admin')
    );
  };

  // Helper to detect if user arrived via registration link or referral query
  const checkIsRegisterPath = () => {
    if (typeof window === 'undefined') return false;
    const pathname = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      pathname === '/register' ||
      search.includes('ref=') ||
      search.includes('referral=') ||
      hash.includes('/register') ||
      hash.includes('ref=')
    );
  };

  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkIsAdminPath());
  const [authScreen, setAuthScreen] = useState<AuthScreen>(checkIsRegisterPath() ? 'register' : 'login');
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Synchronize route state with browser history (back/forward and URL bar changes)
  const syncRouteFromLocation = useCallback(() => {
    const isNowAdmin = checkIsAdminPath();
    setIsAdminRoute(isNowAdmin);

    // If referral link or /register was accessed, persist referral code and switch to register screen
    if (checkIsRegisterPath()) {
      let ref = '';
      try {
        const searchParams = new URLSearchParams(window.location.search);
        ref = searchParams.get('ref') || searchParams.get('referral') || '';
        if (!ref && window.location.hash.includes('?')) {
          const hashQuery = window.location.hash.split('?')[1];
          const hashParams = new URLSearchParams(hashQuery);
          ref = hashParams.get('ref') || hashParams.get('referral') || '';
        }
      } catch {}

      if (ref && ref.trim()) {
        try {
          localStorage.setItem('wealthera_ref_code', ref.trim());
        } catch {}
      }
      if (!user) {
        setAuthScreen('register');
      }
    } else if (window.location.pathname.toLowerCase() === '/login' && !user) {
      setAuthScreen('login');
    }
  }, [user]);

  useEffect(() => {
    syncRouteFromLocation();
    window.addEventListener('popstate', syncRouteFromLocation);
    window.addEventListener('hashchange', syncRouteFromLocation);
    return () => {
      window.removeEventListener('popstate', syncRouteFromLocation);
      window.removeEventListener('hashchange', syncRouteFromLocation);
    };
  }, [syncRouteFromLocation]);

  // Clean navigation helper that updates browser URL without full page reload or 404
  const navigateTo = (path: string) => {
    try {
      window.history.pushState({}, '', path);
    } catch {}
    syncRouteFromLocation();
  };

  // 1. DEDICATED ADMIN ROUTE (/admin, /admin/*, #admin, ?admin=true):
  if (isAdminRoute) {
    if (admin && !isImpersonating) {
      return (
        <>
          <ToastContainer />
          <AdminPanelView
            onBackToUserDashboard={() => {
              setIsAdminRoute(false);
              navigateTo('/');
            }}
          />
        </>
      );
    }

    return (
      <>
        <ToastContainer />
        <AdminLoginView
          onBackToUserLogin={() => {
            setIsAdminRoute(false);
            navigateTo('/');
          }}
          onSuccess={() => {
            setIsAdminRoute(true);
            navigateTo('/admin');
          }}
        />
      </>
    );
  }

  // 2. USER AUTHENTICATION: If no user session is active, display Login or Register
  if (!user) {
    if (authScreen === 'register' || checkIsRegisterPath()) {
      return (
        <>
          <ToastContainer />
          <RegisterView
            onNavigateLogin={() => {
              navigateTo('/login');
              setAuthScreen('login');
            }}
          />
        </>
      );
    }

    return (
      <>
        <ToastContainer />
        <LoginView
          onNavigateRegister={() => {
            navigateTo('/register');
            setAuthScreen('register');
          }}
        />
      </>
    );
  }

  // 3. AUTHENTICATED USER PORTAL (Admin portal buttons are completely hidden from UI)
  const getHeaderProps = () => {
    switch (currentView) {
      case 'wallet':
        return { title: 'My Wallet', showBack: false };
      case 'team':
        return { title: 'Affiliate Team', showBack: false };
      case 'more':
        return { title: 'Menu & Settings', showBack: false };
      case 'plans':
        return { title: 'Investment Plans', showBack: true, onBack: () => setCurrentView('home') };
      case 'transactions':
        return { title: 'Financial Ledger', showBack: true, onBack: () => setCurrentView('home') };
      case 'history':
        return { title: 'Deposit & Withdrawal History', showBack: true, onBack: () => setCurrentView('home') };
      case 'notifications':
        return { title: 'Notifications', showBack: true, onBack: () => setCurrentView('home') };
      case 'support':
        return { title: 'Customer Concierge', showBack: true, onBack: () => setCurrentView('more') };
      default:
        return { title: 'WEALTHERA', showBack: false };
    }
  };

  const navTab: NavTab =
    currentView === 'home' || currentView === 'wallet' || currentView === 'team' || currentView === 'more'
      ? currentView
      : 'home';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-peach-100 selection:text-peach-900">
      <ToastContainer />

      {/* Super Admin Quick Switcher Bar */}
      {admin && !isImpersonating && (
        <div className="bg-slate-950 text-white px-4 py-2 text-xs flex items-center justify-between sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-[11px]">Super Admin Session Active</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsAdminRoute(true);
              navigateTo('/admin');
            }}
            className="bg-aqua-500 hover:bg-aqua-400 text-slate-950 px-3 py-1 rounded-lg font-black text-xs transition-colors cursor-pointer"
          >
            Open Admin Panel (/admin) &rarr;
          </button>
        </div>
      )}

      {/* Header (Admin button removed for normal users) */}
      <Header
        {...getHeaderProps()}
        onOpenNotifications={() => setCurrentView('notifications')}
        onOpenProfile={() => setCurrentView('more')}
      />

      {/* Main View Area constrained to mobile-first luxury width */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4">
        <ErrorBoundary fallbackTitle="View Display Issue" fallbackMessage="This section encountered an unexpected render glitch. Click below to refresh.">
          {currentView === 'home' && (
            <DashboardView
              onOpenDeposit={() => setShowDepositModal(true)}
              onOpenWithdraw={() => setShowWithdrawModal(true)}
              onOpenPlans={() => setCurrentView('plans')}
              onOpenTeam={() => setCurrentView('team')}
              onOpenTransactions={() => setCurrentView('transactions')}
            />
          )}

          {currentView === 'wallet' && (
            <WalletView
              onOpenDeposit={() => setShowDepositModal(true)}
              onOpenWithdraw={() => setShowWithdrawModal(true)}
              onOpenTransactions={() => setCurrentView('transactions')}
            />
          )}

          {currentView === 'team' && <TeamView />}

          {currentView === 'more' && (
            <MoreMenuView
              onNavigate={(target) => setCurrentView(target as AppView)}
            />
          )}

          {currentView === 'plans' && (
            <PlansView onOpenDeposit={() => setShowDepositModal(true)} />
          )}

          {currentView === 'transactions' && (
            <TransactionsView
              onOpenDeposit={() => setShowDepositModal(true)}
              onOpenWithdraw={() => setShowWithdrawModal(true)}
            />
          )}

          {currentView === 'history' && (
            <div className="pb-24 animate-in fade-in duration-300">
              <DepositWithdrawalHistorySection
                onOpenDeposit={() => setShowDepositModal(true)}
                onOpenWithdraw={() => setShowWithdrawModal(true)}
              />
            </div>
          )}

          {currentView === 'notifications' && <NotificationsView />}

          {currentView === 'support' && <CustomerSupportView />}
        </ErrorBoundary>
      </main>

      {/* Fixed Bottom Navigation with central floating Deposit button */}
      <BottomNav
        currentTab={navTab}
        onTabChange={(tab) => {
          if (tab === 'deposit') {
            setShowDepositModal(true);
          } else {
            setCurrentView(tab as AppView);
          }
        }}
        onOpenDeposit={() => setShowDepositModal(true)}
      />

      {/* Global Modals */}
      {showDepositModal && <DepositModal onClose={() => setShowDepositModal(false)} />}
      {showWithdrawModal && <WithdrawModal onClose={() => setShowWithdrawModal(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Glitch Recovered" fallbackMessage="Wealthera has protected your session. Click reload to refresh smoothly.">
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}
