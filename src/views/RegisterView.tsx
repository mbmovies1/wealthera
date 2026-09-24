import React, { useState, useEffect } from 'react';
import { Logo } from '../components/Logo.js';
import { useApp } from '../context/AppContext.js';
import { User, AtSign, Mail, Phone, Lock, Eye, EyeOff, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';

interface RegisterViewProps {
  onNavigateLogin: () => void;
  onBackToHome?: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigateLogin }) => {
  const { registerUser } = useApp();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read URL query parameter for referral code (e.g. ?ref=huma123) and localStorage backup
  useEffect(() => {
    let ref = '';
    try {
      const params = new URLSearchParams(window.location.search);
      ref = params.get('ref') || params.get('referral') || '';
      if (!ref && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        const hashParams = new URLSearchParams(hashQuery);
        ref = hashParams.get('ref') || hashParams.get('referral') || '';
      }
    } catch {}

    if (ref && ref.trim()) {
      const clean = ref.trim();
      setReferralCode(clean);
      try {
        localStorage.setItem('wealthera_ref_code', clean);
      } catch {}
    } else {
      try {
        const saved = localStorage.getItem('wealthera_ref_code');
        if (saved && saved.trim()) {
          setReferralCode(saved.trim());
        }
      } catch {}
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !phone.trim() || !password) {
      setError('Please complete all required fields.');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await registerUser({
        fullName: fullName.trim() || undefined,
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        referralCode: referralCode.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-peach-100">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 relative z-10">
        {/* Brand Logo full identity */}
        <div className="flex justify-center mb-5">
          <Logo variant="full" size="lg" />
        </div>

        {/* Heading & Subtitle */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Create your account</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Begin your wealth journey today.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            id="register-error-message"
            className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium leading-relaxed"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">
              Full name <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="register-fullname-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full legal name"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/90 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* 1. Username */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Username *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <AtSign className="w-4 h-4" />
              </div>
              <input
                id="register-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose username"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/90 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* 2. Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="register-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/90 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* 3. Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Phone number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="register-phone-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter mobile or WhatsApp number"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/90 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* 4. Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password"
                className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/90 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent transition-all"
              />
              <button
                id="register-toggle-password-btn"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 5. Referral Code - Optional */}
          <div>
            <div className="flex items-center justify-between mb-1 ml-1">
              <label className="block text-xs font-bold text-slate-700">
                Referral code <span className="font-normal text-slate-400">(optional)</span>
              </label>
              {referralCode && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Sponsor Verified</span>
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserPlus className="w-4 h-4" />
              </div>
              <input
                id="register-referral-input"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Referral username or sponsor code"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/80 border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  referralCode ? 'border-emerald-400 focus:ring-emerald-500 bg-emerald-50/20' : 'border-slate-200/90 focus:ring-aqua-500'
                }`}
              />
            </div>
            {referralCode && (
              <p className="text-[11px] text-emerald-700 mt-1 ml-1 font-medium">
                You will join affiliate team led by <strong>@{referralCode}</strong>.
              </p>
            )}
          </div>

          {/* Create Account Button */}
          <div className="pt-3">
            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-black text-sm text-white bg-peach-500 hover:bg-peach-600 active:scale-[0.99] transition-all shadow-md shadow-peach-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>

        {/* Already registered? Sign in */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <button
              id="register-to-login-btn"
              type="button"
              onClick={onNavigateLogin}
              className="font-black text-peach-600 hover:text-peach-700 transition-colors cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
