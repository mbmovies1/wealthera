import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import { Layers, CheckCircle2, Clock, ArrowRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface PlansViewProps {
  onOpenDeposit: () => void;
}

export const PlansView: React.FC<PlansViewProps> = ({ onOpenDeposit }) => {
  const { user, plans, userInvestments, settings, activatePlan, refreshData } = useApp();
  const [activeTab, setActiveTab] = useState<'available' | 'my-investments'>('available');
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  if (!user) return null;

  const activePlans = (plans || []).filter((p) => p.status === 'active');
  const userActiveInvestments = (userInvestments || []).filter((i) => i.status === 'active');

  const handleActivate = async (planId: string) => {
    setError(null);
    const targetPlan = plans.find((p) => p.id === planId);
    if (!targetPlan) return;

    const userBal = Number(user?.balance) || 0;
    const planAmt = Number(targetPlan.amount) || 0;
    if (userBal < planAmt) {
      const needMore = Number(planAmt - userBal).toFixed(2);
      setError(`Insufficient balance. You need ${needMore} ${settings.currencySymbol} more to activate ${targetPlan.name}. Please deposit capital.`);
      return;
    }

    setPurchasingPlanId(planId);
    try {
      await activatePlan(planId);
      setActiveTab('my-investments');
    } catch (err: any) {
      setError(err.message || 'Activation failed');
    } finally {
      setPurchasingPlanId(null);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* Tab Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'available' ? 'bg-white text-aqua-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Investment Plans ({activePlans.length})
        </button>
        <button
          onClick={() => setActiveTab('my-investments')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'my-investments' ? 'bg-white text-aqua-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          My Active Plans ({userActiveInvestments.length})
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Available Plans Tab */}
      {activeTab === 'available' && (
        <div className="space-y-3">
          {activePlans.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-400 text-xs">
              No investment plans currently available. Check back soon.
            </div>
          ) : (
            activePlans.map((plan) => {
              const alreadyActive = userInvestments.some(
                (i) => i.planId === plan.id && i.status === 'active'
              );
              const userBal = Number(user?.balance) || 0;
              const planAmt = Number(plan.amount) || 0;
              const canAfford = userBal >= planAmt;
              const duration = plan.durationDays || 45;
              const totalProfit =
                plan.totalProfit ?? Math.round(plan.dailyProfit * duration * 100) / 100;

              return (
                <div
                  key={plan.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-aqua-300 transition-all space-y-3.5"
                >
                  {/* Plan Name & Amount */}
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <h4 className="text-base font-black text-slate-900">{plan.name}</h4>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-black text-aqua-950">
                        {Number(plan.amount || 0).toFixed(2)}{' '}
                        <span className="text-xs font-bold text-slate-500">{settings.currencySymbol}</span>
                      </span>
                    </div>
                  </div>

                  {/* 3 Metrics: Daily Profit, Total Profit, Duration */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-center">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                        Daily Profit
                      </span>
                      <span className="text-xs font-black text-peach-600 block">
                        +{Number(plan.dailyProfit || 0).toFixed(2)} {settings.currencySymbol}
                      </span>
                    </div>

                    <div className="space-y-0.5 border-x border-slate-200 px-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                        Total Profit
                      </span>
                      <span className="text-xs font-black text-aqua-900 block">
                        +{Number(totalProfit || 0).toFixed(2)} {settings.currencySymbol}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                        Duration
                      </span>
                      <span className="text-xs font-black text-slate-800 block">
                        {duration} Days
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-1">
                    {alreadyActive ? (
                      <div className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Plan Currently Active</span>
                      </div>
                    ) : !canAfford ? (
                      <div className="w-full flex items-center justify-between gap-2">
                        <span className="text-[11px] text-rose-500 font-semibold">
                          Need {Number(planAmt - userBal).toFixed(2)} {settings.currencySymbol} more
                        </span>
                        <button
                          onClick={onOpenDeposit}
                          className="px-4 py-2 rounded-xl bg-peach-500 hover:bg-peach-600 text-white font-bold text-xs transition-colors shadow-xs"
                        >
                          Deposit Capital
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleActivate(plan.id)}
                        disabled={purchasingPlanId === plan.id}
                        className="w-full py-3 rounded-2xl font-black text-xs text-white bg-peach-500 hover:bg-peach-600 active:scale-[0.99] transition-all shadow-md shadow-peach-500/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {purchasingPlanId === plan.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Activating Plan...</span>
                          </>
                        ) : (
                          <>
                            <span>Activate Plan Now</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* My Active Plans Tab */}
      {activeTab === 'my-investments' && (
        <div className="space-y-3">
          {userInvestments.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-400 text-xs">
              You do not have any active investment plans yet. Activate one to begin earning daily dividends!
            </div>
          ) : (
            userInvestments.map((inv) => {
              const progressPercent = Math.min(100, Math.round((inv.daysElapsed / inv.durationDays) * 100));
              const isCompleted = inv.status === 'completed';

              return (
                <div
                  key={inv.id}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-slate-900 text-sm">{inv.planName}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCompleted ? 'bg-slate-100 text-slate-600' : 'bg-aqua-100 text-aqua-900'
                          }`}
                        >
                          {isCompleted ? 'Matured' : 'Active & Earning'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Started: {inv.startDate ? new Date(inv.startDate).toLocaleDateString() : 'Active'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900">
                        {Number(inv.amount || 0).toFixed(2)} {settings.currencySymbol}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>
                        Day {inv.daysElapsed} of {inv.durationDays}
                      </span>
                      <span>{progressPercent}% Elapsed</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-aqua-600 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Daily Dividend:</span>
                      <span className="font-bold text-slate-800">
                        +{Number(inv.dailyProfit || 0).toFixed(2)} {settings.currencySymbol}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Total Earned So Far:</span>
                      <span className="font-extrabold text-peach-600">
                        +{Number(inv.totalEarned || 0).toFixed(2)} {settings.currencySymbol}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
