import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import { Logo } from '../components/Logo.js';
import { DailyProfitClaimCard } from '../components/DailyProfitClaimCard.js';
import { DepositWithdrawalHistorySection } from '../components/DepositWithdrawalHistorySection.js';
import {
  User,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Share2,
  Layers,
  Copy,
  Check,
  Clock,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowDownLeft,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenPlans: () => void;
  onOpenTeam: () => void;
  onOpenTransactions: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenDeposit,
  onOpenWithdraw,
  onOpenPlans,
  onOpenTeam,
  onOpenTransactions,
}) => {
  const { user, stats, settings, addToast } = useApp();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  // Generate dynamic referral link based on current domain and user referral code
  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://wealthera.app';
  const referralLink = `${currentHost}/register?ref=${encodeURIComponent(user.referralCode || user.username)}`;

  const handleCopyReferral = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        const input = document.createElement('input');
        input.value = referralLink;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      addToast('Referral link copied', 'Share with partners to earn 10% commission dividends', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      addToast('Copy failed', 'Please copy the link manually', 'error');
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* 15. USER INFORMATION CARD */}
      <div
        id="dashboard-user-info-card"
        className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex items-center justify-between transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-aqua-900 flex items-center justify-center text-white shadow-xs">
            <User className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
              <span>@{user.username}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-aqua-100 text-aqua-900">
                Active
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Ref by: <span className="font-semibold text-slate-600">{user.referredBy || 'Direct Platform'}</span>
            </p>
          </div>
        </div>

        {/* Currency badge */}
        <div className="text-right">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-peach-50 border border-peach-200 text-peach-700 text-xs font-black">
            <span>{settings.currency}</span>
            <span className="text-[10px] font-bold">({settings.currencySymbol})</span>
          </div>
        </div>
      </div>

      {/* 16. MAIN ACCOUNT BALANCE CARD (Deep Aqua with Warm Peach accents) */}
      <div
        id="dashboard-main-balance-card"
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl bg-aqua-950 border border-aqua-900 transition-transform active:scale-[0.99]"
      >
        {/* Abstract luxury geometric WEALTHERA emblem watermark in the background */}
        <div className="absolute -right-6 -bottom-10 w-44 h-44 opacity-15 pointer-events-none select-none flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full stroke-white fill-none stroke-[6]">
            <polygon points="100,10 190,55 190,145 100,190 10,145 10,55" />
            <polygon points="100,40 160,70 160,130 100,160 40,130 40,70" />
            <circle cx="100" cy="100" r="25" />
          </svg>
        </div>

        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-aqua-200 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-peach-400" />
              <span>Available Balance</span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-sm text-white">
                {user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-lg font-black text-peach-400">{settings.currencySymbol}</span>
            </div>
            <p className="text-[11px] text-aqua-200/80 font-medium">
              ≈ {Math.round(user.balance * (settings.depositRatePkr || 911)).toLocaleString()} PKR
            </p>
          </div>

          {/* Official WEALTHERA Brand Emblem */}
          <div className="shrink-0 drop-shadow-md">
            <Logo variant="icon" size="lg" />
          </div>
        </div>

        {/* Prominent Withdraw Button inside card */}
        <div className="relative z-10 mt-6 pt-4 border-t border-aqua-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-aqua-200">
            <ShieldCheck className="w-4 h-4 text-peach-400" />
            <span className="font-medium">Instant 24/7 Withdrawal</span>
          </div>

          <button
            id="balance-card-withdraw-btn"
            onClick={onOpenWithdraw}
            className="px-5 py-2.5 rounded-full bg-peach-500 hover:bg-peach-600 active:scale-95 text-white text-xs font-black tracking-tight shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Withdraw</span>
            <ArrowUpRight className="w-4 h-4 text-white stroke-[3]" />
          </button>
        </div>
      </div>

      {/* 24-HOUR DAILY DIVIDEND CLAIM ENGINE */}
      <DailyProfitClaimCard onOpenPlans={onOpenPlans} />

      {/* 17. QUICK ACTION BUTTONS (Deposit, Invite, My Plans) */}
      <div id="dashboard-quick-actions" className="grid grid-cols-3 gap-2.5">
        {/* Deposit Action */}
        <button
          id="quick-action-deposit-btn"
          onClick={onOpenDeposit}
          className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-peach-500 flex items-center justify-center text-white mb-2 shadow-xs group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xs font-extrabold text-slate-800">Deposit</span>
        </button>

        {/* Invite Action */}
        <button
          id="quick-action-invite-btn"
          onClick={onOpenTeam}
          className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-aqua-800 flex items-center justify-center text-white mb-2 shadow-xs group-hover:scale-105 transition-transform">
            <Share2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xs font-extrabold text-slate-800">Invite</span>
        </button>

        {/* My Plans Action */}
        <button
          id="quick-action-plans-btn"
          onClick={onOpenPlans}
          className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-aqua-950 flex items-center justify-center text-white mb-2 shadow-xs group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xs font-extrabold text-slate-800">My Plans</span>
        </button>
      </div>

      {/* 18. REFERRAL LINK CARD */}
      <div
        id="dashboard-referral-link-card"
        className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-2"
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-aqua-700" />
            <span>Referral Invitation Link</span>
          </label>
          <span className="text-[11px] font-bold text-peach-700 bg-peach-50 border border-peach-200/60 px-2 py-0.5 rounded-md">
            {settings.referralCommissionPercent}% Bonus
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs text-slate-600 font-mono truncate select-all">
            {referralLink}
          </div>
          <button
            id="copy-referral-link-btn"
            onClick={handleCopyReferral}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-aqua-800 hover:bg-aqua-900 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 19. DASHBOARD STATISTICS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Portfolio Metrics</h4>
          <button
            id="view-all-tx-link"
            onClick={onOpenTransactions}
            className="text-xs font-bold text-aqua-800 hover:text-aqua-900 transition-colors"
          >
            View Ledger
          </button>
        </div>

        <div id="dashboard-statistics-grid" className="grid grid-cols-2 gap-2.5">
          {/* 1. Total Investment */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold text-slate-600">Total Investment</span>
              <div className="w-6 h-6 rounded-lg bg-peach-50 flex items-center justify-center text-peach-600">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-slate-900">
              {Number(stats?.totalInvestment || 0).toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-500">{settings.currencySymbol}</span>
            </div>
          </div>

          {/* 2. Total Withdraw */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold text-slate-600">Total Withdraw</span>
              <div className="w-6 h-6 rounded-lg bg-aqua-50 flex items-center justify-center text-aqua-700">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-slate-900">
              {Number(stats?.totalWithdraw || 0).toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-500">{settings.currencySymbol}</span>
            </div>
          </div>

          {/* 3. Total Profit */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold text-slate-600">Total Profit</span>
              <div className="w-6 h-6 rounded-lg bg-peach-50 flex items-center justify-center text-peach-600">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-peach-600">
              +{Number(stats?.totalProfit || 0).toFixed(2)}{' '}
              <span className="text-xs font-bold text-peach-500">{settings.currencySymbol}</span>
            </div>
          </div>

          {/* 4. Referral Earnings */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold text-slate-600">Referral Earnings</span>
              <div className="w-6 h-6 rounded-lg bg-aqua-50 flex items-center justify-center text-aqua-700">
                <Share2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-slate-900">
              {Number(stats?.referralEarnings || 0).toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-500">{settings.currencySymbol}</span>
            </div>
          </div>

          {/* 5. Pending Withdrawal */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold text-slate-600">Pending Withdrawal</span>
              <div className="w-6 h-6 rounded-lg bg-aqua-50 flex items-center justify-center text-aqua-700">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-slate-900">
              {Number(stats?.pendingWithdrawal || 0).toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-500">{settings.currencySymbol}</span>
            </div>
          </div>

          {/* 6. Pending Deposit */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold text-slate-600">Pending Deposit</span>
              <div className="w-6 h-6 rounded-lg bg-peach-50 flex items-center justify-center text-peach-600">
                <ArrowDownLeft className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-slate-900">
              {Number(stats?.pendingDeposit || 0).toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-500">{settings.currencySymbol}</span>
            </div>
          </div>

          {/* 7. Team Size */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold text-slate-600">Team Size</span>
              <div className="w-6 h-6 rounded-lg bg-aqua-50 flex items-center justify-center text-aqua-700">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-slate-900">
              {stats?.teamSize ?? 0} <span className="text-xs font-normal text-slate-400">Members</span>
            </div>
          </div>

          {/* 8. Team Investment */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold text-slate-600">Team Investment</span>
              <div className="w-6 h-6 rounded-lg bg-peach-50 flex items-center justify-center text-peach-600">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-slate-900">
              {Number(stats?.teamInvestment || 0).toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-500">{settings.currencySymbol}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 20. DEDICATED REAL-TIME DEPOSIT & WITHDRAWAL HISTORY SECTION */}
      <DepositWithdrawalHistorySection
        onOpenDeposit={onOpenDeposit}
        onOpenWithdraw={onOpenWithdraw}
        maxInitialItems={5}
      />
    </div>
  );
};
