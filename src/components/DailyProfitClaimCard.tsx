import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import { Sparkles, Clock, CheckCircle2, AlertCircle, ArrowRight, Loader2, Coins, BellRing } from 'lucide-react';

interface DailyProfitClaimCardProps {
  onOpenPlans?: () => void;
  className?: string;
}

export const DailyProfitClaimCard: React.FC<DailyProfitClaimCardProps> = ({ onOpenPlans, className = '' }) => {
  const {
    user,
    settings,
    userInvestments,
    claimSecondsLeft,
    claimCountdownText,
    isClaimAvailable,
    dailyProfitPotential,
    claimDailyProfit,
    addToast,
  } = useApp();

  const [claiming, setClaiming] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<{
    type: 'success' | 'already_added' | null;
    title: string;
    description: string;
  } | null>(null);

  if (!user) return null;

  const activeInvestments = (userInvestments || []).filter((i) => i.status === 'active');
  const hasActivePlan = activeInvestments.length > 0 || !!user.activePlanId;

  const pkrRate = settings.pkrRate || settings.depositRatePkr || 911;
  const pkrAmount = Math.round(dailyProfitPotential * pkrRate);

  // When user clicks the button
  const handleButtonClick = async () => {
    // Case 1: No active plan
    if (!hasActivePlan) {
      if (onOpenPlans) onOpenPlans();
      return;
    }

    // Case 2: In 24-hour cooldown (Already Added)
    if (claimSecondsLeft > 0 || !isClaimAvailable) {
      const alreadyAddedMsg = `Today's daily cycle earning is already added! You can only claim once every 24 hours. Next cycle unlocks in: ${claimCountdownText}.`;
      setNoticeMessage({
        type: 'already_added',
        title: 'Already Added! ⏳',
        description: alreadyAddedMsg,
      });
      addToast('Already Added! ⏳', alreadyAddedMsg, 'info');

      // Auto dismiss banner after 6s
      setTimeout(() => {
        setNoticeMessage((prev) => (prev?.type === 'already_added' ? null : prev));
      }, 6000);
      return;
    }

    // Case 3: Available to claim - Run Cycle Now
    setClaiming(true);
    try {
      await claimDailyProfit();
      const successMsg = `Daily earning added! +${dailyProfitPotential.toFixed(2)} ${settings.currencySymbol} has been credited to your available balance. 24-hour cycle has started.`;
      setNoticeMessage({
        type: 'success',
        title: 'Earning Added! ⚡',
        description: successMsg,
      });
      // Auto clear after 8s
      setTimeout(() => {
        setNoticeMessage((prev) => (prev?.type === 'success' ? null : prev));
      }, 8000);
    } catch (err: any) {
      // If error indicates already claimed
      if (err?.message && (err.message.includes('already') || err.message.includes('24'))) {
        setNoticeMessage({
          type: 'already_added',
          title: 'Already Added! ⏳',
          description: `Today's earning is already added! Next claim unlocks in: ${claimCountdownText}.`,
        });
      }
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div
      id="daily-profit-claim-card"
      className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 border transition-all shadow-md ${
        !hasActivePlan
          ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700'
          : isClaimAvailable
          ? 'bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-900 text-white border-emerald-500/50 shadow-emerald-950/40 ring-2 ring-emerald-500/30'
          : 'bg-gradient-to-br from-slate-900 via-aqua-950 to-slate-900 text-white border-slate-800 shadow-slate-950/30'
      } ${className}`}
    >
      {/* Ambient background accent */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      {/* Card Header & Status Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              !hasActivePlan
                ? 'bg-slate-800 text-slate-400'
                : isClaimAvailable
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            <Coins className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 truncate">
              Daily Profit Engine
            </h4>
            <span className="text-[10px] text-slate-400 font-medium block truncate">
              24-Hour Automated Dividend Cycle
            </span>
          </div>
        </div>

        {/* Dynamic Status Pill */}
        {!hasActivePlan ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
            No Active Plan
          </span>
        ) : isClaimAvailable ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 shadow-sm animate-pulse shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
            READY TO CLAIM
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
            <Clock className="w-3 h-3" />
            24h Cooldown
          </span>
        )}
      </div>

      {/* Main Metric Section */}
      <div className="my-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[11px] font-medium text-slate-400 block truncate">
            {hasActivePlan ? "Today's Cycle Dividends" : 'Potential Daily Returns'}
          </span>
          <div className="flex flex-wrap items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              +{dailyProfitPotential > 0 ? dailyProfitPotential.toFixed(2) : '0.00'}
            </span>
            <span className="text-xs font-bold text-peach-400">{settings.currencySymbol}</span>
            {dailyProfitPotential > 0 && (
              <span className="text-[11px] font-semibold text-slate-300">
                (≈ {pkrAmount.toLocaleString()} PKR)
              </span>
            )}
          </div>
        </div>

        {/* Right side status / countdown */}
        <div className="text-right shrink-0">
          {hasActivePlan ? (
            claimSecondsLeft > 0 ? (
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400/90 block">
                  Next Cycle In
                </span>
                <span className="text-xs sm:text-sm font-black font-mono text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded-lg border border-amber-500/30 inline-block">
                  {claimCountdownText}
                </span>
              </div>
            ) : (
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 block">
                  Active Plans
                </span>
                <span className="text-xs sm:text-sm font-black text-emerald-300">
                  {activeInvestments.length} Running
                </span>
              </div>
            )
          ) : (
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Status</span>
              <span className="text-xs font-bold text-slate-300">Inactive</span>
            </div>
          )}
        </div>
      </div>

      {/* Notice Banner (Earning Added OR Already Added) */}
      {noticeMessage && (
        <div
          id="run-cycle-notice-banner"
          className={`mb-3 p-3 rounded-2xl border flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 ${
            noticeMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-amber-950/80 border-amber-500/50 text-amber-200'
          }`}
        >
          {noticeMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <h5 className="text-xs font-black tracking-wide uppercase">
              {noticeMessage.title}
            </h5>
            <p className="text-[11px] leading-relaxed mt-0.5 text-slate-300 font-medium">
              {noticeMessage.description}
            </p>
          </div>
          <button
            onClick={() => setNoticeMessage(null)}
            className="text-slate-400 hover:text-white p-1 -mr-1 -mt-1 rounded-md text-xs font-bold"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Explanatory text */}
      <p className="text-[11px] text-slate-300/80 mb-3 leading-relaxed">
        {!hasActivePlan
          ? 'Activate an investment plan to start generating daily 24-hour dividends.'
          : isClaimAvailable
          ? 'Your 24-hour cycle is ready! Click "Run Cycle Now" below to credit your wallet.'
          : 'Dividends can be claimed once every 24 hours. Multiple clicks will show "Already Added" status.'}
      </p>

      {/* Main Action Button - Mobile optimized with min-h-[48px] */}
      {!hasActivePlan ? (
        <button
          id="claim-activate-plan-btn"
          type="button"
          onClick={handleButtonClick}
          className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-gradient-to-r from-peach-500 to-peach-600 hover:from-peach-600 hover:to-peach-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer select-none"
        >
          <span>Activate Investment Plan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : isClaimAvailable ? (
        <button
          id="run-cycle-now-btn"
          type="button"
          onClick={handleButtonClick}
          disabled={claiming}
          className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 active:scale-[0.98] transition-all cursor-pointer select-none"
        >
          {claiming ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
              <span>Running Cycle & Adding Earning...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 fill-slate-950 shrink-0" />
              <span className="truncate">
                ⚡ Run Cycle Now (+{dailyProfitPotential.toFixed(2)} {settings.currencySymbol})
              </span>
            </>
          )}
        </button>
      ) : (
        /* Cooldown Button: Clickable so multiple clicks show "Already Added" notice as requested */
        <button
          id="run-cycle-already-added-btn"
          type="button"
          onClick={handleButtonClick}
          className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 active:bg-slate-700/90 border border-amber-500/40 text-amber-200 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer select-none"
          title="Click to view already added notice and remaining cycle countdown"
        >
          <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span className="truncate">
            ⏳ Already Added • Run Cycle (Next: {claimCountdownText})
          </span>
        </button>
      )}

      {/* Helper footer hint */}
      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
        <span className="flex items-center gap-1">
          <BellRing className="w-3 h-3 text-peach-400" />
          <span>Notice alerts on every click</span>
        </span>
        <span>Strict 24h cycle rule</span>
      </div>
    </div>
  );
};
