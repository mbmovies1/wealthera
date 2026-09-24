import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.js';
import { Logo } from '../components/Logo.js';
import {
  X,
  Upload,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  DollarSign,
  Smartphone,
  Coins,
  ShieldCheck,
  Landmark,
  Layers,
} from 'lucide-react';

interface DepositModalProps {
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ onClose }) => {
  const { depositMethods, settings, submitDeposit, addToast, refreshData } = useApp();

  // Always refresh latest payment gateways on modal open
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const enabledMethods = (depositMethods || []).filter((m) => m.enabled);

  const [selectedMethodId, setSelectedMethodId] = useState<string>(enabledMethods[0]?.id || '');
  const [amountKwd, setAmountKwd] = useState<string>('30');
  const [transactionId, setTransactionId] = useState<string>('');
  const [senderAccount, setSenderAccount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic automatic fallback if admin disables or deletes currently selected method
  useEffect(() => {
    if (enabledMethods.length > 0) {
      if (!selectedMethodId || !enabledMethods.some((m) => m.id === selectedMethodId)) {
        setSelectedMethodId(enabledMethods[0].id);
      }
    } else {
      setSelectedMethodId('');
    }
  }, [enabledMethods, selectedMethodId]);

  const activeMethod = enabledMethods.find((m) => m.id === selectedMethodId) || enabledMethods[0];

  const isCryptoMethod = (name = '') => {
    const l = name.toLowerCase();
    return (
      l.includes('usdt') ||
      l.includes('crypto') ||
      l.includes('trc') ||
      l.includes('bep') ||
      l.includes('sol') ||
      l.includes('btc') ||
      l.includes('eth') ||
      l.includes('tether')
    );
  };

  const isCurrentCrypto = activeMethod ? isCryptoMethod(activeMethod.name) : false;
  const rate = settings.depositRatePkr || 911;
  const numAmount = parseFloat(amountKwd) || 0;
  const calculatedPkr = Math.round(numAmount * rate);
  // 1 KWD ≈ 3.25 USDT (official peg equivalent to standard international rate)
  const calculatedUsdt = (numAmount * 3.25).toFixed(2);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    addToast('Copied', `${label} copied to clipboard`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setError('Image file must be smaller than 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMethod) {
      setError('No deposit method selected. Please choose a payment gateway.');
      return;
    }

    const globalMin = typeof settings.minDepositKwd === 'number' ? settings.minDepositKwd : 30;
    const methodMin = typeof activeMethod?.minDeposit === 'number' && activeMethod.minDeposit > 0
      ? activeMethod.minDeposit
      : globalMin;
    const minRequired = methodMin;
    const maxAllowed = typeof settings.maxDepositKwd === 'number' ? settings.maxDepositKwd : 5000;
    if (numAmount < minRequired) {
      setError(`Minimum deposit for ${activeMethod.name} is ${minRequired} ${settings.currencySymbol}`);
      return;
    }

    if (numAmount > maxAllowed) {
      setError(`Maximum single deposit limit is ${maxAllowed} ${settings.currencySymbol}`);
      return;
    }

    if (!transactionId.trim()) {
      setError(
        isCurrentCrypto
          ? 'Transaction Hash (TxID) is required for crypto deposit verification.'
          : 'Transaction ID (TID) is required for deposit verification.'
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await submitDeposit({
        amountKwd: numAmount,
        methodId: activeMethod.id,
        transactionId: transactionId.trim(),
        senderAccount: senderAccount.trim() || undefined,
        paymentDate: paymentDate.trim() || undefined,
        note: note.trim() || undefined,
        proofUrl: proofPreview || undefined,
        accountTitle: activeMethod.accountTitle || undefined,
        accountNumber: activeMethod.accountNumber || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Deposit submission failed');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [30, 50, 100, 250, 500, 1000];

  const gridColsClass =
    enabledMethods.length === 1
      ? 'grid-cols-1'
      : enabledMethods.length === 2
      ? 'grid-cols-2'
      : enabledMethods.length === 3
      ? 'grid-cols-3'
      : 'grid-cols-2 sm:grid-cols-4';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-auto animate-in zoom-in-95 duration-200">
        {/* Header with Brand Logo */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Logo variant="icon" size="sm" />
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Deposit Funds</h3>
              <p className="text-xs text-slate-500">Add KWD capital to your active account</p>
            </div>
          </div>
          <button
            id="deposit-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="my-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {enabledMethods.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-black text-slate-900 text-sm">No Payment Gateways Available</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              The administrator is currently updating deposit accounts. Please contact support or check back in a few minutes.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Dynamic Method Selector Pills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">Select Payment Gateway</label>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {enabledMethods.length} {enabledMethods.length === 1 ? 'Method' : 'Methods'} Active
                </span>
              </div>

              <div className={`grid ${gridColsClass} gap-2`}>
                {enabledMethods.map((m) => {
                  const isSelected = activeMethod?.id === m.id;
                  const isJazz = m.name.toLowerCase().includes('jazz');
                  const isEasy = m.name.toLowerCase().includes('easy');
                  const isCrypto = isCryptoMethod(m.name);

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethodId(m.id)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 relative ${
                        isSelected
                          ? 'border-peach-500 bg-peach-50/80 text-peach-900 shadow-xs ring-2 ring-peach-400/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {isCrypto && <Coins className="w-3.5 h-3.5 text-teal-600" />}
                        {isJazz && <Smartphone className="w-3.5 h-3.5 text-amber-500" />}
                        {isEasy && <Smartphone className="w-3.5 h-3.5 text-emerald-600" />}
                        {!isCrypto && !isJazz && !isEasy && <Landmark className="w-3.5 h-3.5 text-aqua-800" />}
                        <span className="truncate max-w-[90px] font-black">{m.name}</span>
                      </div>

                      {isJazz && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-500 text-white rounded-md">
                          JazzCash
                        </span>
                      )}
                      {isEasy && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-600 text-white rounded-md">
                          Easypaisa
                        </span>
                      )}
                      {isCrypto && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-teal-600 text-white rounded-md">
                          USDT (TRC20)
                        </span>
                      )}
                      {!isJazz && !isEasy && !isCrypto && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-aqua-800 text-white rounded-md">
                          {m.name.split(' ')[0]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount in KWD */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Deposit Amount (KWD)</label>
                <span className="text-[11px] text-slate-400 font-medium">
                  Min: {typeof activeMethod?.minDeposit === 'number' && activeMethod.minDeposit > 0 ? activeMethod.minDeposit : (typeof settings.minDepositKwd === 'number' ? settings.minDepositKwd : 30)} | Max: {typeof settings.maxDepositKwd === 'number' ? settings.maxDepositKwd : 5000} {settings.currencySymbol}
                </span>
              </div>
              <div className="relative">
                <input
                  id="deposit-amount-input"
                  type="number"
                  step="any"
                  min={typeof activeMethod?.minDeposit === 'number' && activeMethod.minDeposit > 0 ? activeMethod.minDeposit : (typeof settings.minDepositKwd === 'number' ? settings.minDepositKwd : 30)}
                  value={amountKwd}
                  onChange={(e) => setAmountKwd(e.target.value)}
                  placeholder="Enter KWD amount"
                  className="w-full pl-4 pr-16 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-aqua-500 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">
                  {settings.currencySymbol}
                </span>
              </div>

              {/* Quick Amount Pills */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmountKwd(q.toString())}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                      amountKwd === q.toString()
                        ? 'bg-aqua-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    +{q} {settings.currencySymbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Live Conversion Box */}
            {isCurrentCrypto ? (
              <div className="bg-teal-50/90 p-3.5 rounded-2xl border border-teal-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-teal-900 block text-[11px] font-bold">
                    You Transfer In USDT (TRC20 / Crypto)
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-base font-black text-teal-700">{calculatedUsdt} USDT</span>
                    <span className="text-[10px] text-teal-600 font-semibold">
                      (1 KWD ≈ 3.25 USDT • {calculatedPkr.toLocaleString()} PKR)
                    </span>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-teal-600 font-black text-white shadow-xs text-[11px] tracking-wider">
                  TRC20
                </div>
              </div>
            ) : (
              <div className="bg-aqua-50 p-3.5 rounded-2xl border border-aqua-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-aqua-800 block text-[11px] font-medium">
                    You Pay In PKR (1 KWD = {rate} PKR)
                  </span>
                  <span className="text-base font-black text-peach-600">{calculatedPkr.toLocaleString()} PKR</span>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-white font-black text-aqua-800 shadow-xs border border-aqua-100 text-[11px]">
                  Live Rate
                </div>
              </div>
            )}

            {/* Account Details Box */}
            {activeMethod && (
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">
                    {isCurrentCrypto ? 'Vault / Account Title:' : 'Account Title:'}
                  </span>
                  <span className="font-bold text-slate-800">
                    {activeMethod.accountTitle || (isCurrentCrypto ? 'WEALTHERA Liquidity Vault' : 'WEALTHERA OFFICIAL')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">
                    {isCurrentCrypto ? 'USDT Wallet Address:' : 'Deposit Number / Account:'}
                  </span>
                  <div className="flex items-center gap-1.5 max-w-[65%]">
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] truncate select-all">
                      {activeMethod.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeMethod.accountNumber, isCurrentCrypto ? 'USDT Address' : 'Account number')}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors shrink-0 cursor-pointer"
                      title="Copy to clipboard"
                    >
                      {copiedField === (isCurrentCrypto ? 'USDT Address' : 'Account number') ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                {activeMethod.instructions ? (
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/70 leading-relaxed">
                    {activeMethod.instructions}
                  </p>
                ) : isCurrentCrypto ? (
                  <p className="text-[11px] text-teal-700 pt-1 border-t border-slate-200/70 leading-relaxed">
                    Transfer USDT via TRC20 network only. Paste your TxID / Hash below after sending.
                  </p>
                ) : null}
              </div>
            )}

            {/* Transaction ID / TID or TxHash */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isCurrentCrypto ? 'Transaction Hash (TxID / Hash)' : 'Transaction ID (TID)'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="deposit-tid-input"
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder={
                  isCurrentCrypto
                    ? 'Paste your TRC20 transaction hash (e.g. 8a4f9b...)'
                    : 'e.g. 11/12-digit TID from SMS receipt'
                }
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aqua-500 transition-all"
              />
            </div>

            {/* Sender Account / Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isCurrentCrypto ? 'Sender Wallet / Exchange' : 'Sender Account / Mobile'}{' '}
                  <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="deposit-sender-account-input"
                  type="text"
                  value={senderAccount}
                  onChange={(e) => setSenderAccount(e.target.value)}
                  placeholder={isCurrentCrypto ? 'e.g. Binance / TrustWallet' : 'e.g. 03001234567'}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aqua-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Date <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="deposit-payment-date-input"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-aqua-500 transition-all"
                />
              </div>
            </div>

            {/* Optional Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deposit Note / Remark <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="deposit-note-input"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  isCurrentCrypto
                    ? 'e.g. Sent via Binance TRC20 withdrawal'
                    : 'e.g. Sent via JazzCash mobile app'
                }
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aqua-500 transition-all"
              />
            </div>

            {/* Screenshot / Payment Proof Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Upload Receipt Screenshot <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-aqua-400 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-[11px] text-slate-600 font-semibold">Click or drop payment proof</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG up to 8MB</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>

                {proofPreview && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 relative group shrink-0">
                    <img src={proofPreview} alt="Proof" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setProofPreview(null)}
                      className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold transition-opacity cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="deposit-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl font-black text-sm text-white bg-peach-500 hover:bg-peach-600 active:scale-[0.99] transition-all shadow-md shadow-peach-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Deposit...</span>
                  </>
                ) : (
                  <>
                    <span>
                      Confirm Deposit ({numAmount} {settings.currencySymbol}
                      {isCurrentCrypto ? ` / ${calculatedUsdt} USDT` : ` / ${calculatedPkr.toLocaleString()} PKR`})
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

