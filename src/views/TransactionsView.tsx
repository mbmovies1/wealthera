import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import { TransactionType } from '../types.js';
import { DepositWithdrawalHistorySection } from '../components/DepositWithdrawalHistorySection.js';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  Sparkles,
  Plus,
  Minus,
  Share2,
  Receipt,
  History,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface TransactionsViewProps {
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenDeposit,
  onOpenWithdraw,
}) => {
  const { transactions, depositRequests, withdrawalRequests, settings } = useApp();
  const [activeMode, setActiveMode] = useState<'requests' | 'ledger'>('requests');
  const [filter, setFilter] = useState<string>('all');

  const pendingOrProcessedDeposits = depositRequests || [];
  const pendingOrProcessedWithdrawals = withdrawalRequests || [];

  const filteredTransactions = (transactions || []).filter((t) => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const getIcon = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-peach-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-aqua-800" />;
      case 'plan_purchase':
        return <Layers className="w-4 h-4 text-peach-500" />;
      case 'profit':
        return <Sparkles className="w-4 h-4 text-peach-500" />;
      case 'balance_add':
        return <Plus className="w-4 h-4 text-aqua-700" />;
      case 'balance_deduct':
        return <Minus className="w-4 h-4 text-rose-600" />;
      case 'referral_commission':
        return <Share2 className="w-4 h-4 text-peach-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-600" />;
    }
  };

  const isPositive = (type: TransactionType) => {
    return ['deposit', 'profit', 'balance_add', 'referral_commission', 'withdrawal_refund'].includes(type);
  };

  const getLinkedRequest = (tx: any) => {
    if (tx.type === 'deposit') {
      return pendingOrProcessedDeposits.find(
        (d) => d.id === tx.referenceId || d.transactionId === tx.referenceId
      );
    }
    if (tx.type === 'withdrawal') {
      return pendingOrProcessedWithdrawals.find(
        (w) => w.id === tx.referenceId
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* Primary Mode Switcher */}
      <div className="bg-slate-200/80 p-1 rounded-2xl grid grid-cols-2 gap-1">
        <button
          id="trans-mode-requests-btn"
          onClick={() => setActiveMode('requests')}
          className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMode === 'requests'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-peach-600" />
          <span>Deposit & Withdraw Status</span>
        </button>

        <button
          id="trans-mode-ledger-btn"
          onClick={() => setActiveMode('ledger')}
          className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMode === 'ledger'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5 text-aqua-700" />
          <span>Full Ledger & Dividends</span>
        </button>
      </div>

      {/* Mode 1: Deposit & Withdrawal History */}
      {activeMode === 'requests' && (
        <DepositWithdrawalHistorySection
          onOpenDeposit={onOpenDeposit}
          onOpenWithdraw={onOpenWithdraw}
        />
      )}

      {/* Mode 2: Full Transactions Ledger */}
      {activeMode === 'ledger' && (
        <div className="space-y-3">
          {/* Live Status Summary Banner if any pending requests exist */}
          {(pendingOrProcessedDeposits.some((d) => d.status === 'pending') ||
            pendingOrProcessedWithdrawals.some((w) => w.status === 'pending')) && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 animate-spin duration-3000" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-amber-950">Review In Progress</div>
                <div className="text-[11px] text-amber-800 leading-tight mt-0.5">
                  Admin is reviewing your pending financial request. Your balance updates automatically once approved.
                </div>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: 'all', label: 'All Transactions' },
              { key: 'deposit', label: 'Deposits' },
              { key: 'withdrawal', label: 'Withdrawals' },
              { key: 'plan_purchase', label: 'Investments' },
              { key: 'profit', label: 'Dividends' },
              { key: 'referral_commission', label: 'Referrals' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filter === item.key
                    ? 'bg-aqua-950 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Ledger List */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No transactions recorded for the selected filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const linked = getLinkedRequest(tx);
                  const effectiveStatus = linked?.status || tx.status;
                  const rejectionReason = linked?.rejectionReason;

                  return (
                    <div key={tx.id} className="py-3.5 flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                            {getIcon(tx.type)}
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-800 text-xs">{tx.description}</h5>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400 font-mono">{tx.referenceId}</span>
                              <span className="text-[10px] text-slate-400">•</span>
                              <span className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-black text-sm block ${
                              isPositive(tx.type) ? 'text-emerald-600' : 'text-slate-900'
                            }`}
                          >
                            {isPositive(tx.type) ? '+' : '-'}
                            {tx.amount.toFixed(2)} {settings.currencySymbol}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mt-0.5 ${
                              effectiveStatus === 'completed' || effectiveStatus === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : effectiveStatus === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : effectiveStatus === 'refunded'
                                ? 'bg-aqua-50 text-aqua-800 border border-aqua-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {effectiveStatus === 'completed' || effectiveStatus === 'approved' ? (
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            ) : effectiveStatus === 'pending' ? (
                              <Clock className="w-2.5 h-2.5" />
                            ) : (
                              <XCircle className="w-2.5 h-2.5" />
                            )}
                            <span>
                              {effectiveStatus === 'approved' || effectiveStatus === 'completed'
                                ? 'Approved'
                                : effectiveStatus === 'pending'
                                ? 'Pending Review'
                                : effectiveStatus === 'rejected'
                                ? 'Rejected'
                                : effectiveStatus}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Rejection notice if rejected by Admin */}
                      {effectiveStatus === 'rejected' && rejectionReason && (
                        <div className="ml-12 mr-2 bg-rose-50/80 border border-rose-200/70 rounded-xl p-2.5 flex items-start gap-2 text-rose-700">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <div className="text-[11px] leading-tight">
                            <span className="font-bold">Admin Reason: </span>
                            {rejectionReason}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
