import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import {
  Wallet,
  ArrowUpRight,
  CreditCard,
  TrendingUp,
  Clock,
  ArrowDownLeft,
  RefreshCw,
  Sparkles,
  Calculator,
} from 'lucide-react';

interface WalletViewProps {
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenTransactions: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransactions,
}) => {
  const { user, stats, settings, transactions, refreshData } = useApp();
  const [calcKwd, setCalcKwd] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  if (!user) return null;

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const parsedKwd = parseFloat(calcKwd) || 0;
  const pkrDepositCalc = Math.round(parsedKwd * (settings.depositRatePkr || 911));
  const pkrWithdrawCalc = Math.round(parsedKwd * (settings.withdrawalRatePkr || 911));

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* Wallet Balance Hero Card */}
      <div className="bg-aqua-950 border border-aqua-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-aqua-200 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-peach-400" />
            <span>Available Balance</span>
          </span>
          <button
            id="wallet-refresh-btn"
            onClick={handleManualRefresh}
            className={`p-2 rounded-xl bg-aqua-900 hover:bg-aqua-800 transition-all text-white ${
              refreshing ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative z-10 my-4 flex items-baseline gap-2">
          <span className="text-4xl font-black tracking-tight drop-shadow-sm text-white">
            {(user?.balance ?? 0).toFixed(2)}
          </span>
          <span className="text-xl font-black text-peach-400">{settings.currencySymbol}</span>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-3 pt-3 border-t border-aqua-900">
          <button
            id="wallet-deposit-action-btn"
            onClick={onOpenDeposit}
            className="w-full py-2.5 rounded-2xl bg-peach-500 hover:bg-peach-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
          >
            <CreditCard className="w-4 h-4 text-white" />
            <span>Deposit</span>
          </button>

          <button
            id="wallet-withdraw-action-btn"
            onClick={onOpenWithdraw}
            className="w-full py-2.5 rounded-2xl bg-aqua-900 hover:bg-aqua-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 border border-aqua-800 cursor-pointer transition-transform active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4 text-peach-400" />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* Ledger Breakdown Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600">Total Investment</span>
            <TrendingUp className="w-4 h-4 text-peach-500" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {(stats?.totalInvestment ?? 0).toFixed(2)} <span className="text-xs font-bold text-slate-400">{settings.currencySymbol}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600">Total Profit</span>
            <Sparkles className="w-4 h-4 text-peach-500" />
          </div>
          <div className="text-lg font-black text-peach-600">
            +{(stats?.totalProfit ?? 0).toFixed(2)} <span className="text-xs font-bold text-peach-400">{settings.currencySymbol}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600">Pending Deposit</span>
            <ArrowDownLeft className="w-4 h-4 text-peach-500" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {(stats?.pendingDeposit ?? 0).toFixed(2)} <span className="text-xs font-bold text-slate-400">{settings.currencySymbol}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-600">Pending Withdrawal</span>
            <Clock className="w-4 h-4 text-aqua-700" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {(stats?.pendingWithdrawal ?? 0).toFixed(2)} <span className="text-xs font-bold text-slate-400">{settings.currencySymbol}</span>
          </div>
        </div>
      </div>

      {/* Real-time Exchange Calculator */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-aqua-700" />
            <span>KWD ↔ PKR Live Exchange Converter</span>
          </h4>
          <span className="text-[10px] font-bold text-aqua-800 bg-aqua-50 border border-aqua-200/60 px-2 py-0.5 rounded-full">
            1 KWD = {settings.depositRatePkr || 911} PKR
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              id="wallet-kwd-converter-input"
              type="number"
              step="any"
              min="0"
              value={calcKwd}
              onChange={(e) => setCalcKwd(e.target.value)}
              placeholder="Enter KWD"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full pl-3 pr-11 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-aqua-500 placeholder:text-slate-400"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KWD</span>
          </div>

          <div className="flex-1 bg-aqua-50/70 border border-aqua-100 rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-aqua-700 block font-medium">Deposit Value</span>
            <span className="text-xs font-black text-aqua-950">
              {calcKwd.trim() && parsedKwd > 0 ? `${pkrDepositCalc.toLocaleString()} PKR` : '0 PKR'}
            </span>
          </div>

          <div className="flex-1 bg-peach-50/70 border border-peach-100 rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-peach-700 block font-medium">Withdraw Value</span>
            <span className="text-xs font-black text-peach-950">
              {calcKwd.trim() && parsedKwd > 0 ? `${pkrWithdrawCalc.toLocaleString()} PKR` : '0 PKR'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity Mini List */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">Recent Wallet Operations</h4>
          <button
            onClick={onOpenTransactions}
            className="text-xs font-bold text-aqua-800 hover:text-aqua-900 transition-colors"
          >
            All History
          </button>
        </div>

        {(!transactions || transactions.length === 0) ? (
          <p className="text-xs text-slate-400 text-center py-4">No recent wallet transactions recorded.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {(transactions || []).slice(0, 5).map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800 capitalize">{tx.description || tx.type.replace('_', ' ')}</p>
                  <p className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`font-black ${
                      tx.type === 'deposit' || tx.type === 'profit' || tx.type === 'referral_commission' || tx.type === 'balance_add'
                        ? 'text-emerald-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {tx.type === 'deposit' || tx.type === 'profit' || tx.type === 'referral_commission' || tx.type === 'balance_add'
                      ? '+'
                      : '-'}
                    {tx.amount.toFixed(2)} {settings.currencySymbol}
                  </span>
                  <span className={`block text-[10px] font-bold capitalize ${
                    tx.status === 'completed' ? 'text-emerald-500' : tx.status === 'pending' ? 'text-amber-500' : 'text-slate-400'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
