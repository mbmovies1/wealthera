import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import { Users, Copy, Check, Share2, Award, ArrowUpRight, TrendingUp } from 'lucide-react';

export const TeamView: React.FC = () => {
  const { user, stats, settings, teamMembers, transactions, addToast } = useApp();
  const [copied, setCopied] = useState(false);

  const [copiedCode, setCopiedCode] = useState(false);

  if (!user) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://wealthera.app';
  const referralCode = user.referralCode || user.username;
  const referralLink = `${currentHost}/register?ref=${encodeURIComponent(referralCode)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      addToast('Referral link copied', `Share link to invite partners and earn ${settings.referralCommissionPercent}% direct commission`, 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      addToast('Copy failed', 'Please copy manually', 'error');
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      addToast('Referral code copied', `Your referral code is ${referralCode}`, 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      addToast('Copy failed', 'Please copy manually', 'error');
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Join WEALTHERA with me! Start investing and earning daily dividends. Sign up using my referral link: ${referralLink}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const referralEarningsList = (transactions || []).filter((t) => t.type === 'referral_commission');

  const commissionTriggerText =
    settings.referralCommissionMode === 'deposit'
      ? 'deposits and the deposit is approved by administrator'
      : settings.referralCommissionMode === 'both'
      ? 'deposits or activates any investment plan'
      : 'activates any investment plan';

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* Referral Link & Commission Banner */}
      <div className="bg-aqua-950 border border-aqua-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-aqua-200 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-peach-400" />
            <span>Referral Program</span>
          </span>
          <span className="text-xs font-black bg-peach-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
            {settings.referralCommissionPercent}% Direct Commission
          </span>
        </div>

        <p className="relative z-10 text-xs text-aqua-100 mt-2 leading-relaxed">
          Earn instant <strong className="text-peach-300 font-black">{settings.referralCommissionPercent}%</strong> cash commission credited immediately to your balance whenever your invited member {commissionTriggerText}!
        </p>

        {/* Code & Link box */}
        <div className="relative z-10 mt-4 space-y-2.5">
          {/* Referral Code Row */}
          <div className="flex items-center justify-between bg-aqua-900/40 border border-aqua-800/60 rounded-xl px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-aqua-300 uppercase tracking-wider font-semibold">Your Referral Code:</span>
              <span className="font-mono font-black text-white text-sm tracking-wider">{referralCode}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-aqua-100 flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Full Link Row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-aqua-900/60 border border-aqua-800/60 rounded-xl px-3 py-2 text-xs font-mono text-aqua-100 truncate select-all">
              {referralLink}
            </div>
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs ${
                copied ? 'bg-emerald-600 text-white' : 'bg-peach-500 hover:bg-peach-600 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleWhatsAppShare}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share via WhatsApp / Social</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Team Size</span>
          <span className="text-lg font-black text-slate-900">{stats.teamSize}</span>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Team Invest</span>
          <span className="text-lg font-black text-slate-900">{stats.teamInvestment.toFixed(2)}</span>
          <span className="text-[9px] font-bold text-slate-400 block">{settings.currencySymbol}</span>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Bonus Earned</span>
          <span className="text-lg font-black text-peach-600">+{stats.referralEarnings.toFixed(2)}</span>
          <span className="text-[9px] font-bold text-peach-500 block">{settings.currencySymbol}</span>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-aqua-700" />
            <span>Direct Referrals ({teamMembers.length})</span>
          </h4>
        </div>

        {(!teamMembers || teamMembers.length === 0) ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No referrals yet. Share your link to start building your wealth network!
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {(teamMembers || []).map((member) => (
              <div key={member.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-aqua-50 text-aqua-800 flex items-center justify-center font-bold text-xs">
                    {(member.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">@{member.username || 'user'}</p>
                    <p className="text-[10px] text-slate-400">
                      Joined: {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                  {member.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commission Ledger */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>Referral Commission History</span>
        </h4>

        {referralEarningsList.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No commissions credited yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {referralEarningsList.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{item.description}</p>
                  <p className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <span className="font-black text-emerald-600">
                  +{item.amount.toFixed(2)} {settings.currencySymbol}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
