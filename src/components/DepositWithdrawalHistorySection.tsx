import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.js';
import { DepositRequest, WithdrawalRequest } from '../types.js';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Receipt,
  Copy,
  Check,
  Eye,
  X,
  CreditCard,
  Building2,
  Wallet,
} from 'lucide-react';

interface UnifiedRecord {
  id: string;
  kind: 'deposit' | 'withdrawal';
  amountKwd: number;
  amountPkr?: number;
  feeKwd?: number;
  netKwd?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  transactionId?: string;
  channelName: string;
  accountDetails?: string;
  senderAccount?: string;
  proofUrl?: string;
  rejectionReason?: string;
  adminNote?: string;
  raw: DepositRequest | WithdrawalRequest;
}

interface DepositWithdrawalHistorySectionProps {
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  maxInitialItems?: number;
}

export const DepositWithdrawalHistorySection: React.FC<DepositWithdrawalHistorySectionProps> = ({
  onOpenDeposit,
  onOpenWithdraw,
  maxInitialItems,
}) => {
  const { depositRequests, withdrawalRequests, settings, refreshData } = useApp();
  const [kindFilter, setKindFilter] = useState<'all' | 'deposits' | 'withdrawals'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Normalize deposits and withdrawals into a single chronological timeline
  const unifiedList: UnifiedRecord[] = useMemo(() => {
    const list: UnifiedRecord[] = [];

    (depositRequests || []).forEach((d) => {
      list.push({
        id: d.id,
        kind: 'deposit',
        amountKwd: Number(d.amountKwd || d.amount || 0),
        amountPkr: d.amountPkr,
        status: (d.status || 'pending').toLowerCase() as any,
        createdAt: d.createdAt || d.created_at || new Date().toISOString(),
        transactionId: d.transactionId || d.reference_number || d.id,
        channelName: d.methodTitle || d.methodName || d.payment_method || 'Deposit Gateway',
        accountDetails: d.accountNumber ? `${d.accountTitle ? d.accountTitle + ' - ' : ''}${d.accountNumber}` : undefined,
        senderAccount: d.senderAccount,
        proofUrl: d.proofUrl,
        rejectionReason: d.rejectionReason,
        adminNote: d.adminNote,
        raw: d,
      });
    });

    (withdrawalRequests || []).forEach((w) => {
      list.push({
        id: w.id,
        kind: 'withdrawal',
        amountKwd: Number(w.amountKwd || w.amount || 0),
        amountPkr: w.amountPkr,
        feeKwd: w.feeKwd,
        netKwd: w.netKwd || w.netAmountKwd,
        status: (w.status || 'pending').toLowerCase() as any,
        createdAt: w.createdAt || w.requested_at || new Date().toISOString(),
        transactionId: w.id,
        channelName: w.bankOrWalletName || w.network || w.type || w.payment_method || 'Withdrawal Gateway',
        accountDetails: w.walletAddress || (w.accountNumber ? `${w.accountTitle ? w.accountTitle + ' - ' : ''}${w.accountNumber}` : undefined),
        rejectionReason: w.rejectionReason,
        adminNote: w.adminNote,
        raw: w,
      });
    });

    // Sort newest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [depositRequests, withdrawalRequests]);

  // Counts for status chips
  const counts = useMemo(() => {
    return {
      all: unifiedList.length,
      pending: unifiedList.filter((x) => x.status === 'pending').length,
      approved: unifiedList.filter((x) => x.status === 'approved').length,
      rejected: unifiedList.filter((x) => x.status === 'rejected').length,
      deposits: unifiedList.filter((x) => x.kind === 'deposit').length,
      withdrawals: unifiedList.filter((x) => x.kind === 'withdrawal').length,
    };
  }, [unifiedList]);

  // Filter list
  const filteredList = useMemo(() => {
    return unifiedList.filter((item) => {
      if (kindFilter === 'deposits' && item.kind !== 'deposit') return false;
      if (kindFilter === 'withdrawals' && item.kind !== 'withdrawal') return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const tid = (item.transactionId || '').toLowerCase();
        const ch = item.channelName.toLowerCase();
        const amt = item.amountKwd.toString();
        const reason = (item.rejectionReason || '').toLowerCase();
        return tid.includes(q) || ch.includes(q) || amt.includes(q) || reason.includes(q);
      }
      return true;
    });
  }, [unifiedList, kindFilter, statusFilter, searchQuery]);

  const displayedList = useMemo(() => {
    if (maxInitialItems && !showAll) {
      return filteredList.slice(0, maxInitialItems);
    }
    return filteredList;
  }, [filteredList, maxInitialItems, showAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  const handleCopyTid = async (tid: string, id: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(tid);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  return (
    <div id="user-deposit-withdrawal-history-section" className="space-y-3">
      {/* Header with Title and Real-time Refresh */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-aqua-950 text-peach-400 flex items-center justify-center shadow-xs">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Deposit & Withdrawal History</h3>
            <p className="text-[11px] text-slate-400 font-medium">Real-time status tracking & verification logs</p>
          </div>
        </div>

        <button
          id="history-refresh-btn"
          onClick={handleRefresh}
          className={`p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all cursor-pointer shadow-xs ${
            refreshing ? 'animate-spin text-aqua-800' : ''
          }`}
          title="Refresh transaction status"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category Tabs: All / Deposits / Withdrawals */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
        <button
          id="history-tab-all"
          onClick={() => setKindFilter('all')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            kindFilter === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All ({counts.all})
        </button>
        <button
          id="history-tab-deposits"
          onClick={() => setKindFilter('deposits')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            kindFilter === 'deposits'
              ? 'bg-white text-peach-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5 text-peach-500" />
          <span>Deposits ({counts.deposits})</span>
        </button>
        <button
          id="history-tab-withdrawals"
          onClick={() => setKindFilter('withdrawals')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            kindFilter === 'withdrawals'
              ? 'bg-white text-aqua-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-aqua-700" />
          <span>Withdrawals ({counts.withdrawals})</span>
        </button>
      </div>

      {/* Status Filters & Search Bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Statuses ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({counts.pending})</span>
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved ({counts.approved})</span>
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected ({counts.rejected})</span>
          </button>
        </div>

        {/* Quick Search */}
        {unifiedList.length > 3 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by TID, gateway, or amount..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aqua-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main List Container */}
      <div className="space-y-2.5">
        {displayedList.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">No transactions match your criteria</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {kindFilter === 'deposits'
                  ? 'You have not made any deposits yet.'
                  : kindFilter === 'withdrawals'
                  ? 'You have not submitted any withdrawal requests yet.'
                  : 'Your deposit and withdrawal requests will appear here with live verification status.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              {onOpenDeposit && (
                <button
                  onClick={onOpenDeposit}
                  className="px-4 py-2 rounded-xl bg-peach-500 hover:bg-peach-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Make Deposit</span>
                </button>
              )}
              {onOpenWithdraw && (
                <button
                  onClick={onOpenWithdraw}
                  className="px-4 py-2 rounded-xl bg-aqua-900 hover:bg-aqua-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-peach-400" />
                  <span>Request Withdraw</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          displayedList.map((item) => {
            const isDeposit = item.kind === 'deposit';
            const isPending = item.status === 'pending';
            const isApproved = item.status === 'approved';
            const isRejected = item.status === 'rejected';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-xs space-y-3 ${
                  isPending
                    ? 'border-amber-200/80 bg-amber-50/20'
                    : isApproved
                    ? 'border-emerald-100 hover:border-emerald-200'
                    : 'border-rose-100 bg-rose-50/15'
                }`}
              >
                {/* Top Row: Type, Channel & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        isDeposit ? 'bg-peach-50 text-peach-600' : 'bg-aqua-50 text-aqua-700'
                      }`}
                    >
                      {isDeposit ? (
                        <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900">
                          {isDeposit ? 'Deposit' : 'Withdrawal'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">•</span>
                        <span className="text-[11px] font-bold text-slate-700 truncate max-w-[140px] sm:max-w-[200px]">
                          {item.channelName}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Prominent Status Pill */}
                  <div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200 shadow-xs animate-pulse">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>Pending</span>
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200 shadow-xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>Approved</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-200 shadow-xs">
                        <XCircle className="w-3 h-3 text-rose-700" />
                        <span>Rejected</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount & Currency Details */}
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {isDeposit ? 'Deposit Amount' : 'Requested Amount'}
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span
                        className={`text-lg font-black tracking-tight ${
                          isDeposit ? 'text-peach-600' : 'text-slate-900'
                        }`}
                      >
                        {isDeposit ? '+' : '-'}
                        {item.amountKwd.toFixed(2)} {settings.currencySymbol}
                      </span>
                      {item.amountPkr && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          ≈ {item.amountPkr.toLocaleString()} PKR
                        </span>
                      )}
                    </div>
                  </div>

                  {item.netKwd !== undefined && !isDeposit && (
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Net Payout
                      </span>
                      <span className="text-xs font-black text-aqua-950">
                        {item.netKwd.toFixed(2)} {settings.currencySymbol}
                      </span>
                    </div>
                  )}
                </div>

                {/* Account Details & TID */}
                <div className="text-[11px] space-y-1.5 pt-0.5">
                  {item.transactionId && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-semibold text-slate-600">Transaction ID / TID:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-slate-900 font-bold select-all">
                          {item.transactionId}
                        </span>
                        <button
                          onClick={() => handleCopyTid(item.transactionId!, item.id)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Copy TID"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {item.senderAccount && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-semibold text-slate-600">Sender Account:</span>
                      <span className="font-medium text-slate-800">{item.senderAccount}</span>
                    </div>
                  )}

                  {item.accountDetails && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-semibold text-slate-600">Destination:</span>
                      <span className="font-mono text-[10px] text-slate-800 truncate max-w-[200px]" title={item.accountDetails}>
                        {item.accountDetails}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Notice / Explanations */}
                {isPending && (
                  <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <span className="font-bold">Under Review: </span>
                      {isDeposit
                        ? 'Admin is verifying your payment receipt against company statements. Balance will credit automatically upon approval.'
                        : 'Admin is processing payout to your wallet/bank account. Funds will arrive after batch authorization.'}
                    </div>
                  </div>
                )}

                {isApproved && (
                  <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-2.5 text-[11px] text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <span className="font-bold">Approved & Verified: </span>
                      {isDeposit
                        ? 'Payment verified by administrator. Balance has been credited to your active wallet.'
                        : 'Payout dispatched to your designated destination.'}
                      {item.adminNote && (
                        <span className="block mt-0.5 font-medium italic text-emerald-800">
                          Admin note: &ldquo;{item.adminNote}&rdquo;
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {isRejected && (
                  <div className="bg-rose-50/90 border border-rose-200/90 rounded-xl p-2.5 text-[11px] text-rose-900 flex items-start gap-2">
                    <XCircle className="w-3.5 h-3.5 text-rose-700 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <span className="font-bold">Request Declined: </span>
                      <span>{item.rejectionReason || 'Declined by Admin'}</span>
                      {!isDeposit && (
                        <span className="block mt-0.5 font-medium text-emerald-700">
                          ✓ Held balance has been fully refunded back to your available balance.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Proof of Payment Button if available */}
                {item.proofUrl && (
                  <div className="pt-1 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => setSelectedProof(item.proofUrl!)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Receipt Proof</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Show More / Show Less toggle if capped */}
        {maxInitialItems && filteredList.length > maxInitialItems && (
          <div className="text-center pt-1">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-aqua-900 transition-colors cursor-pointer shadow-xs"
            >
              {showAll
                ? 'Show Fewer Records'
                : `View All ${filteredList.length} History Records`}
            </button>
          </div>
        )}
      </div>

      {/* Image / Receipt Proof Modal */}
      {selectedProof && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedProof(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-aqua-700" />
                <span>Payment Screenshot Proof</span>
              </span>
              <button
                onClick={() => setSelectedProof(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-900 max-h-[70vh] overflow-auto">
              <img
                src={selectedProof}
                alt="Payment receipt proof"
                className="max-h-[60vh] max-w-full rounded-lg object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-3 bg-slate-50 text-center">
              <button
                onClick={() => setSelectedProof(null)}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
