import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.js';
import { Logo } from '../components/Logo.js';
import {
  Layers,
  History,
  Receipt,
  Users,
  Headphones,
  Bell,
  LogOut,
  ChevronRight,
  User,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  X,
  ShieldCheck,
  Mail,
  Phone,
  Edit3,
} from 'lucide-react';

interface MoreMenuViewProps {
  onNavigate: (view: string) => void;
}

export const MoreMenuView: React.FC<MoreMenuViewProps> = ({ onNavigate }) => {
  const { user, settings, logoutUser, isImpersonating, stopImpersonating, changeUserPassword, updateUserProfile, addToast } = useApp();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Profile Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setEditEmail(user.email || '');
      setEditPhone(user.phone || '');
      setEditFullName(user.fullName || '');
    }
  }, [user]);

  if (!user) return null;

  const commissionPercent = settings?.referralCommissionPercent ?? 10;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmail.trim()) {
      addToast('Validation Error', 'Email address cannot be empty', 'error');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail.trim())) {
      addToast('Validation Error', 'Please enter a valid email address', 'error');
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateUserProfile({
        email: editEmail.trim(),
        phone: editPhone.trim(),
        fullName: editFullName.trim(),
      });
      setShowProfileModal(false);
    } catch (err: any) {
      addToast('Profile Update Failed', err.message || 'Could not update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim()) {
      addToast('Validation Error', 'Please enter your current password.', 'error');
      return;
    }
    if (!newPassword.trim()) {
      addToast('Validation Error', 'Please enter a new password.', 'error');
      return;
    }
    if (newPassword.trim().length < 6) {
      addToast('Validation Error', 'New password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Validation Error', 'New password and confirmation do not match.', 'error');
      return;
    }
    if (oldPassword === newPassword) {
      addToast('Validation Error', 'New password cannot be identical to current password.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await changeUserPassword(oldPassword.trim(), newPassword.trim());
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast('Failed to Change Password', err.message || 'Incorrect password or update error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const menuSections = [
    {
      title: 'Portfolio & Growth',
      items: [
        {
          id: 'plans',
          label: 'Investment Plans',
          desc: 'Explore daily dividend cycles & active portfolios',
          icon: <Layers className="w-5 h-5 text-peach-500" />,
          action: () => onNavigate('plans'),
        },
        {
          id: 'transactions',
          label: 'Financial Ledger',
          desc: 'Audit logs of deposits, profits & withdrawals',
          icon: <History className="w-5 h-5 text-aqua-700" />,
          action: () => onNavigate('transactions'),
        },
        {
          id: 'history',
          label: 'Deposit & Withdrawal History',
          desc: 'Track pending, approved, and rejected payment status',
          icon: <Receipt className="w-5 h-5 text-peach-600" />,
          action: () => onNavigate('history'),
        },
        {
          id: 'team',
          label: 'Affiliate & Team',
          desc: `Invite associates and earn ${commissionPercent}% commission dividends`,
          icon: <Users className="w-5 h-5 text-peach-500" />,
          action: () => onNavigate('team'),
        },
      ],
    },
    {
      title: 'Security & Access',
      items: [
        {
          id: 'edit-profile',
          label: 'Edit Profile & Email',
          desc: 'Update your registered email address and contact details',
          icon: <User className="w-5 h-5 text-aqua-700" />,
          action: () => setShowProfileModal(true),
        },
        {
          id: 'change-password',
          label: 'Change Account Password',
          desc: 'Update your personal login password securely',
          icon: <Lock className="w-5 h-5 text-emerald-600" />,
          action: () => setShowPasswordModal(true),
        },
      ],
    },
    {
      title: 'Support & Communications',
      items: [
        {
          id: 'support',
          label: 'Customer Service Concierge',
          desc: 'Telegram, WhatsApp & Official Help Desk',
          icon: <Headphones className="w-5 h-5 text-aqua-700" />,
          action: () => onNavigate('support'),
        },
        {
          id: 'notifications',
          label: 'Notifications & Alerts',
          desc: 'System news, approvals, and dividend broadcasts',
          icon: <Bell className="w-5 h-5 text-peach-500" />,
          action: () => onNavigate('notifications'),
        },
      ],
    },
  ];

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* User Profile Mini Banner */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-aqua-950 p-[2px] shadow-sm">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-black text-aqua-900 text-lg uppercase">
              {(user?.username || user?.fullName || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm">@{user?.username || 'user'}</h3>
            <p className="text-xs text-slate-400">{user?.email || 'No email'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Phone: {user?.phone || user?.mobile || 'No phone'}</p>
          </div>
        </div>

        <div className="text-right flex flex-col items-end gap-1.5">
          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-peach-50 text-peach-700 border border-peach-200">
            Verified Investor
          </span>
          <button
            type="button"
            onClick={() => {
              setEditEmail(user.email || '');
              setEditPhone(user.phone || '');
              setEditFullName(user.fullName || '');
              setShowProfileModal(true);
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-aqua-800 hover:text-aqua-950 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Menu groups */}
      {menuSections.map((sec, idx) => (
        <div key={idx} className="space-y-1.5">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-2">
            {sec.title}
          </h4>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {sec.items.map((item) => (
              <button
                key={item.id}
                id={`more-menu-btn-${item.id}`}
                onClick={item.action}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">{item.label}</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Logout Action */}
      <div className="pt-2">
        {isImpersonating ? (
          <button
            id="more-stop-impersonate-btn"
            onClick={stopImpersonating}
            className="w-full py-3.5 rounded-2xl bg-peach-50 hover:bg-peach-100 border border-peach-200 text-peach-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Impersonation & Return to Admin</span>
          </button>
        ) : (
          <button
            id="more-logout-btn"
            onClick={logoutUser}
            className="w-full py-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of WEALTHERA</span>
          </button>
        )}
      </div>

      {/* Modal: Edit Profile & Email */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-aqua-50 border border-aqua-200 flex items-center justify-center text-aqua-900">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Edit Profile & Email</h3>
                <p className="text-xs text-slate-400">Update your verified contact records</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  id="profile-fullname-input"
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-aqua-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="profile-email-input"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-aqua-800 focus:outline-hidden font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <input
                    id="profile-phone-input"
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-aqua-800 focus:outline-hidden font-medium"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-emerald-800 leading-relaxed">
                  Your updated email will synchronize across your account and the administrator console in real-time.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  id="cancel-profile-modal-btn"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-profile-btn"
                  disabled={isSavingProfile}
                  className="flex-1 py-2.5 rounded-xl bg-aqua-900 hover:bg-aqua-950 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900">Change Password</h4>
                  <p className="text-[11px] text-slate-400">Protect your investment account</p>
                </div>
              </div>
              <button
                id="close-password-modal-btn"
                onClick={() => {
                  setShowPasswordModal(false);
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    id="user-current-password-input"
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-aqua-800 focus:outline-hidden pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  New Password <span className="text-[10px] text-slate-400 font-normal">(min 6 characters)</span>
                </label>
                <div className="relative">
                  <input
                    id="user-new-password-input"
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-aqua-800 focus:outline-hidden pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    id="user-confirm-password-input"
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-aqua-800 focus:outline-hidden pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {newPassword && confirmPassword && (
                <div className="text-[11px] flex items-center gap-1.5 pt-1">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-rose-500 font-semibold">Passwords do not match</span>
                  )}
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  id="cancel-password-modal-btn"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-user-password-btn"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-aqua-900 hover:bg-aqua-950 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branded Footer */}
      <div className="pt-4 flex flex-col items-center justify-center gap-1.5 opacity-70">
        <Logo variant="full" size="sm" />
        <p className="text-[10px] text-slate-400 font-medium">Official Kuwait Investment Portal • 256-Bit Encrypted</p>
      </div>
    </div>
  );
};

