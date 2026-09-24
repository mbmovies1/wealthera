import React, { useState } from 'react';
import { Logo } from '../components/Logo.js';
import { useApp } from '../context/AppContext.js';
import {
  AtSign,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';

interface LoginViewProps {
  onNavigateRegister: () => void;
  onBackToHome?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onNavigateRegister,
}) => {
  const { loginUser, requestPasswordReset, resetPasswordWithCode, addToast } = useApp();

  // Form fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [receivedCode, setReceivedCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdent = identifier.trim();
    if (!cleanIdent || !password) {
      setError('Please enter your username/email/mobile and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loginUser(cleanIdent, password);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password step 1 (request code)
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your username, email, or registered phone.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await requestPasswordReset(forgotIdentifier.trim());
      if (res?.resetCode) {
        setReceivedCode(res.resetCode);
        setForgotCode(res.resetCode);
      }
      setForgotSuccess(res?.message || 'Verification code generated successfully.');
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err?.message || 'Could not find an account with those details.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle forgot password step 2 (complete reset)
  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotCode.trim() || !newPassword) {
      setForgotError('Please enter both the verification code and your new password.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    try {
      await resetPasswordWithCode(forgotIdentifier.trim(), forgotCode.trim(), newPassword);
      addToast('Password Updated', 'Your password has been reset. You can now login.', 'success');
      setShowForgotModal(false);
      setIdentifier(forgotIdentifier.trim());
      setPassword(newPassword);
      setForgotStep(1);
      setForgotIdentifier('');
      setForgotCode('');
      setNewPassword('');
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to reset password. Please check your verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-peach-100">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 relative z-10">
        {/* Brand Logo */}
        <div className="flex justify-center mb-5">
          <Logo variant="full" size="lg" />
        </div>

        {/* Heading & Subtitle */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Sign in to your account
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Access your investments, balance, and team rewards.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div
            id="login-error-message"
            className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium leading-relaxed flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username / Identifier */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">
              Username, Email, or Mobile
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <AtSign className="w-4 h-4" />
              </div>
              <input
                id="login-username-input"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter username, email, or mobile"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50/90 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-peach-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5 ml-1 pr-1">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <button
                id="forgot-password-trigger"
                type="button"
                onClick={() => {
                  setForgotIdentifier(identifier.trim());
                  setShowForgotModal(true);
                  setForgotStep(1);
                  setForgotError(null);
                  setForgotSuccess(null);
                }}
                className="text-xs font-semibold text-peach-600 hover:text-peach-700 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-3.5 rounded-2xl bg-slate-50/90 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-peach-500 focus:border-transparent transition-all"
              />
              <button
                id="login-toggle-password-btn"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99] bg-peach-500 hover:bg-peach-600 shadow-peach-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        {/* Registration navigation for users */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              id="login-to-register-btn"
              type="button"
              onClick={onNavigateRegister}
              className="font-black text-peach-600 hover:text-peach-700 transition-colors cursor-pointer"
            >
              Register Now
            </button>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-peach-50 flex items-center justify-center text-peach-600 font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Reset Account Password</h3>
                  <p className="text-[11px] text-slate-500">Step {forgotStep} of 2</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                {forgotSuccess}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestResetCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Username, Registered Email, or Mobile
                  </label>
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="Enter username or email"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-peach-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 rounded-2xl font-black text-sm text-white bg-peach-500 hover:bg-peach-600 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get 6-Digit Reset Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCompleteReset} className="space-y-4">
                {receivedCode && (
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between">
                    <div>
                      <span className="font-bold">Your Verification Code: </span>
                      <span className="font-mono text-sm font-black text-amber-950 tracking-wider">
                        {receivedCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForgotCode(receivedCode)}
                      className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950"
                    >
                      Use Code
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.trim())}
                    placeholder="e.g. 123456"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono text-slate-900 text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-peach-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    New Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-peach-500"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-1/3 py-3 rounded-2xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-3 rounded-2xl font-black text-sm text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
