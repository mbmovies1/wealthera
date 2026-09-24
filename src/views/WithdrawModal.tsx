import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import { Logo } from '../components/Logo.js';
import { X, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

interface WithdrawModalProps {
  onClose: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ onClose }) => {
  const { user, settings, depositMethods, withdrawalNetworks, submitWithdrawal, refreshData } = useApp();

  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  const cashGateways = React.useMemo(() => {
    const fromMethods = (depositMethods || [])
      .filter((m) => m.enabled && !m.name.toLowerCase().includes('usdt') && !m.name.toLowerCase().includes('crypto'))
      .map((m) => m.name);

    if (fromMethods.length > 0) {
      return Array.from(new Set(fromMethods));
    }
    return ['Easypaisa'];
  }, [depositMethods]);

  const [type, setType] = useState<'USDT' | 'Cash/PKR'>('Cash/PKR');
  const [amountKwd, setAmountKwd] = useState<string>('15');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [network, setNetwork] = useState<string>(withdrawalNetworks?.[0]?.name || 'TRC20');
  const [accountTitle, setAccountTitle] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [bankOrWalletName, setBankOrWalletName] = useState<string>(() => cashGateways[0] || 'Easypaisa');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (cashGateways.length > 0 && !cashGateways.includes(bankOrWalletName)) {
      setBankOrWalletName(cashGateways[0]);
    }
  }, [cashGateways, bankOrWalletName]);

  React.useEffect(() => {
    if (!network && withdrawalNetworks && withdrawalNetworks.length > 0) {
      setNetwork(withdrawalNetworks[0].name);
    }
  }, [withdrawalNetworks, network]);

  if (!user) return null;

  const userBal = Number(user.balance) || 0;
  const numAmount = parseFloat(amountKwd) || 0;
  const minWd = typeof settings.minWithdrawalKwd === 'number' ? settings.minWithdrawalKwd : 10;
  const maxWd = typeof settings.maxWithdrawalKwd === 'number' ? settings.maxWithdrawalKwd : 2000;
  const feeRate = (settings.withdrawalFeePercent || 0) / 100;
  const feeAmount = Math.round(numAmount * feeRate * 100) / 100;
  const netAmount = Math.max(0, Math.round((numAmount - feeAmount) * 100) / 100);

  const wdRate = settings.withdrawalRatePkr || 911;
  const netPkr = Math.round(netAmount * wdRate);

  const handleSetMax = () => {
    const maxPossible = Math.min(userBal, maxWd);
    if (maxPossible > 0) {
      setAmountKwd(maxPossible.toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (numAmount < minWd) {
      setError(`Minimum withdrawal is ${minWd} ${settings.currencySymbol}`);
      return;
    }

    if (numAmount > maxWd) {
      setError(`Maximum withdrawal limit is ${maxWd} ${settings.currencySymbol}`);
      return;
    }

    if (numAmount > userBal) {
      setError(`Insufficient balance. You have ${userBal.toFixed(2)} ${settings.currencySymbol} available.`);
      return;
    }

    if (type === 'USDT' && !walletAddress.trim()) {
      setError('Please provide a valid USDT destination wallet address.');
      return;
    }

    if (type === 'Cash/PKR' && (!accountNumber.trim() || !accountTitle.trim())) {
      setError('Please provide Account Title and Mobile/Bank Account Number.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await submitWithdrawal({
        type,
        amountKwd: numAmount,
        walletAddress: type === 'USDT' ? walletAddress.trim() : undefined,
        network: type === 'USDT' ? network : undefined,
        accountTitle: type === 'Cash/PKR' ? accountTitle.trim() : undefined,
        accountNumber: type === 'Cash/PKR' ? accountNumber.trim() : undefined,
        bankOrWalletName: type === 'Cash/PKR' ? bankOrWalletName : undefined,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Withdrawal submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-auto animate-in zoom-in-95 duration-200">
        {/* Header with Logo */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Logo variant="icon" size="sm" />
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Withdraw Funds</h3>
              <p className="text-xs text-slate-500">Available: {user.balance.toFixed(2)} {settings.currencySymbol}</p>
            </div>
          </div>
          <button
            id="withdraw-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="my-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Method Type Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Withdrawal Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('Cash/PKR')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  type === 'Cash/PKR'
                    ? 'border-aqua-500 bg-aqua-50/80 text-aqua-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Cash / PKR (Mobile/Bank)
              </button>
              <button
                type="button"
                onClick={() => setType('USDT')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  type === 'USDT'
                    ? 'border-aqua-500 bg-aqua-50/80 text-aqua-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                USDT (Crypto)
              </button>
            </div>
          </div>

          {/* Amount in KWD */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Withdraw Amount (KWD)</label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  Min: {minWd} | Max: {maxWd} {settings.currencySymbol}
                </span>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-[10px] font-black uppercase tracking-wider text-peach-600 bg-peach-50 hover:bg-peach-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  Max
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                id="withdraw-amount-input"
                type="number"
                step="any"
                min={minWd}
                max={Math.min(userBal, maxWd)}
                value={amountKwd}
                onChange={(e) => setAmountKwd(e.target.value)}
                placeholder="Enter KWD amount"
                className="w-full pl-4 pr-16 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-aqua-500 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">
                {settings.currencySymbol}
              </span>
            </div>
          </div>

          {/* Calculation Summary Box */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Platform Fee ({settings.withdrawalFeePercent}%):</span>
              <span className="font-bold text-slate-700">{feeAmount.toFixed(2)} {settings.currencySymbol}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Net Payout (KWD):</span>
              <span className="font-extrabold text-aqua-900">{netAmount.toFixed(2)} {settings.currencySymbol}</span>
            </div>
            {type === 'Cash/PKR' && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-slate-800 font-bold">
                <span>Net PKR (Rate: {wdRate} PKR):</span>
                <span className="text-emerald-600 font-black">{netPkr.toLocaleString()} PKR</span>
              </div>
            )}
          </div>

          {/* Conditional Fields based on Type */}
          {type === 'Cash/PKR' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gateway / Bank</label>
                <select
                  value={bankOrWalletName}
                  onChange={(e) => setBankOrWalletName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-aqua-500"
                >
                  {cashGateways.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  {cashGateways.length === 0 && <option value="Easypaisa">Easypaisa</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Title / Beneficiary</label>
                <input
                  type="text"
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                  placeholder="Full name on account"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-aqua-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Number / IBAN</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="03XXXXXXXXX or IBAN"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-aqua-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Crypto Network</label>
                <div className="grid grid-cols-3 gap-2">
                  {(withdrawalNetworks || []).filter((n) => n.enabled).map((net) => (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => setNetwork(net.name)}
                      className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                        network === net.name
                          ? 'border-aqua-500 bg-aqua-50 text-aqua-900'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {net.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">USDT Wallet Address ({network})</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder={`Enter your ${network} USDT address`}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-aqua-500"
                />
              </div>
            </div>
          )}

          {/* Optional Note / Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Withdrawal Memo / Note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="withdraw-note-input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Personal bank account"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aqua-500 transition-all"
            />
          </div>

          <div className="p-3 bg-aqua-50/60 rounded-2xl border border-aqua-100 flex items-start gap-2 text-[11px] text-aqua-950">
            <ShieldCheck className="w-4 h-4 text-aqua-700 shrink-0 mt-0.5" />
            <span>Amount is held immediately upon submission. If rejected by administrator, funds are automatically refunded back to your balance.</span>
          </div>

          <div className="pt-2">
            <button
              id="withdraw-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-black text-sm text-white bg-peach-500 hover:bg-peach-600 active:scale-[0.99] transition-all shadow-md shadow-peach-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Withdrawal...</span>
                </>
              ) : (
                <>
                  <span>Submit Withdrawal Request</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
