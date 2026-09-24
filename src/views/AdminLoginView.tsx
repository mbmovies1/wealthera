import React, { useState } from 'react';
import { Logo } from '../components/Logo.js';
import { useApp } from '../context/AppContext.js';
import { ArrowLeft, ShieldCheck, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

interface AdminLoginViewProps {
  onBackToUserLogin: () => void;
  onSuccess: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onBackToUserLogin, onSuccess }) => {
  const { loginAdmin } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both Admin username and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await loginAdmin(username.trim(), password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Admin authentication rejected');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-aqua-100">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-aqua-100 relative z-10">
        {/* Back button */}
        <button
          id="admin-login-back-btn"
          onClick={onBackToUserLogin}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to user login</span>
        </button>

        {/* Official Brand Logo */}
        <div className="flex justify-center mb-5">
          <Logo variant="full" size="lg" />
        </div>

        {/* Admin Portal Badge & Heading */}
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-aqua-950 text-white text-[11px] font-bold shadow-xs mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-peach-400" />
            <span>Super Admin Portal</span>
          </span>
          <p className="text-xs text-slate-500">Authorized Root Management Console</p>
        </div>

        {error && (
          <div
            id="admin-login-error"
            className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium leading-relaxed"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Admin Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="w-4 h-4 text-aqua-700" />
              </div>
              <input
                id="admin-username-input"
                type="text"
                name="admin_login_user_field"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Admin Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                name="admin_login_pass_field"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-11 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent transition-all"
              />
              <button
                id="admin-toggle-password-btn"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-black text-sm text-white bg-aqua-900 hover:bg-aqua-950 active:scale-[0.99] transition-all shadow-md shadow-aqua-950/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Admin...</span>
                </>
              ) : (
                'Access Admin Console'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
