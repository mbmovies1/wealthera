import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.js';
import { Logo } from '../components/Logo.js';
import {
  AdminOverviewStats,
  DepositRecord,
  WithdrawalRecord,
  User,
  InvestmentPlan,
  DepositMethodConfig,
  WithdrawalNetworkConfig,
  PlatformSettings,
  CustomerSupportLink,
} from '../types.js';
import {
  ShieldCheck,
  Ban,
  Users,
  CreditCard,
  ArrowUpRight,
  Layers,
  Sparkles,
  Loader2,
  Settings,
  Bell,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Edit2,
  Lock,
  Plus,
  Minus,
  Key,
  Unlock,
  UserCheck,
  Trash2,
  RefreshCw,
  LogOut,
  ExternalLink,
  ChevronRight,
  Filter,
  X,
  Menu,
  LayoutDashboard,
  ArrowDownLeft,
  Wallet,
  TrendingUp,
  Copy,
  Check,
  AlertTriangle,
  Shuffle,
  Phone,
  Mail,
  MessageCircle,
  UserCog,
  MessageSquare,
  Headphones,
  Send,
  UserPlus,
  Zap,
} from 'lucide-react';

interface AdminPanelViewProps {
  onBackToUserDashboard?: () => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({ onBackToUserDashboard }) => {
  const {
    admin,
    logoutAdmin,
    adminData,
    refreshAdminData,
    approveDeposit,
    rejectDeposit,
    deleteDeposit,
    approveWithdrawal,
    rejectWithdrawal,
    deleteWithdrawal,
    triggerProfitCycle,
    resetUserDailyCycle,
    resetAllDailyCycles,
    impersonateUser,
    createUserByAdmin,
    updateUserByAdmin,
    deleteUserByAdmin,
    adjustUserBalance,
    deleteTransaction,
    createTransactionByAdmin,
    deleteNotification,
    clearAllNotifications,
    notifications,
    updatePlan,
    createPlan,
    deletePlan,
    plans: contextPlans,
    settings: contextSettings,
    updatePlatformSettings,
    depositMethods: contextDepositMethods,
    depositRequests: contextDepositRequests,
    withdrawalRequests: contextWithdrawalRequests,
    withdrawalNetworks: contextWithdrawalNetworks,
    updateDepositMethod,
    createDepositMethod,
    deleteDepositMethod,
    updateWithdrawalNetwork,
    createWithdrawalNetwork,
    deleteWithdrawalNetwork,
    supportLinks,
    createSupportLink,
    updateSupportLink,
    deleteSupportLink,
    broadcastNotification,
    addToast,
    changeAdminPassword,
    adminResetUserPassword,
  } = useApp();

  const [currentAdminPass, setCurrentAdminPass] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');
  const [showCurrentAdminPass, setShowCurrentAdminPass] = useState(false);
  const [showNewAdminPass, setShowNewAdminPass] = useState(false);
  const [showConfirmAdminPass, setShowConfirmAdminPass] = useState(false);
  const [showResetUserPass, setShowResetUserPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [processingDepositId, setProcessingDepositId] = useState<string | null>(null);
  const [processingWithdrawId, setProcessingWithdrawId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'users'
    | 'transactions'
    | 'deposits'
    | 'withdrawals'
    | 'plans'
    | 'profit_engine'
    | 'gateways'
    | 'settings'
    | 'notifications'
    | 'audit'
    | 'support'
  >('overview');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isRunningProfitCycle, setIsRunningProfitCycle] = useState(false);

  const handleRunProfitCycle = async () => {
    if (isRunningProfitCycle) return;
    setIsRunningProfitCycle(true);
    try {
      await triggerProfitCycle();
    } catch {
      // toast is already handled in triggerProfitCycle
    } finally {
      setIsRunningProfitCycle(false);
    }
  };

  // User Deletion state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // User Creation state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    balance: '',
    assignedPlanId: '',
    status: 'active' as 'active' | 'suspended',
    referredBy: '',
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);

  // Transaction Ledger tab filters & search
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [transactionSearch, setTransactionSearch] = useState<string>('');

  // Transaction Manual Add & Delete states
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [newTxData, setNewTxData] = useState({
    userId: '',
    amount: '',
    type: 'balance_adjustment' as 'deposit' | 'withdrawal' | 'daily_profit' | 'referral_commission' | 'plan_activation' | 'balance_adjustment',
    description: '',
    status: 'completed' as 'completed' | 'pending' | 'rejected',
  });
  const [isCreatingTx, setIsCreatingTx] = useState(false);
  const [addTxError, setAddTxError] = useState<string | null>(null);
  const [txToDelete, setTxToDelete] = useState<any | null>(null);
  const [isDeletingTx, setIsDeletingTx] = useState(false);

  // Notification management states
  const [isDeletingNotifId, setIsDeletingNotifId] = useState<string | null>(null);
  const [isClearingNotifs, setIsClearingNotifs] = useState(false);

  // Modals state
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; type: 'deposit' | 'withdrawal' } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // User Action Modals
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingUserNewPassword, setEditingUserNewPassword] = useState('');
  const [editingUserBalance, setEditingUserBalance] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [balanceAdjustUser, setBalanceAdjustUser] = useState<User | null>(null);
  const [balanceAdjustType, setBalanceAdjustType] = useState<'add' | 'deduct'>('add');
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState('');
  const [balanceAdjustReason, setBalanceAdjustReason] = useState('');
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // User search & filters
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');

  // Deposits & Withdrawals tab filters
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Plan Edit/Create modal
  const [editingPlan, setEditingPlan] = useState<Partial<InvestmentPlan> | null>(null);

  // Gateway Edit/Create modal
  const [editingGateway, setEditingGateway] = useState<Partial<DepositMethodConfig> | null>(null);

  // Network Edit/Create modal
  const [editingNetwork, setEditingNetwork] = useState<Partial<WithdrawalNetworkConfig> | null>(null);

  // Support Link Management state
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [editingSupportLink, setEditingSupportLink] = useState<CustomerSupportLink | null>(null);
  const [supportForm, setSupportForm] = useState<{
    title: string;
    type: CustomerSupportLink['type'];
    value: string;
    link: string;
    enabled: boolean;
    description: string;
    badge: string;
    order: number;
  }>({
    title: '',
    type: 'telegram',
    value: '',
    link: '',
    enabled: true,
    description: '',
    badge: '24/7 Support',
    order: 1,
  });
  const [supportSaving, setSupportSaving] = useState(false);
  const [supportToDelete, setSupportToDelete] = useState<CustomerSupportLink | null>(null);
  const [supportDeleting, setSupportDeleting] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<PlatformSettings | null>(null);
  const settingsFormDirtyRef = useRef(false);

  const updateSettingsField = (patch: Partial<PlatformSettings>) => {
    settingsFormDirtyRef.current = true;
    setSettingsForm((prev) => (prev ? { ...prev, ...patch } : null));
  };

  // Broadcast state
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | string>('all');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'success' | 'warning'>('info');

  // In-app Delete & Action Confirmation Modal (replaces browser confirm)
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    dangerText?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await refreshAdminData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleQuickApproveDeposit = async (id: string) => {
    setProcessingDepositId(id);
    try {
      await approveDeposit(id);
    } catch (err: any) {
      addToast('Approval Failed', err?.message || 'Could not approve deposit', 'error');
    } finally {
      setProcessingDepositId(null);
    }
  };

  const handleQuickRejectDeposit = async (id: string) => {
    setProcessingDepositId(id);
    try {
      await rejectDeposit(id, 'Declined by Admin');
    } catch (err: any) {
      addToast('Rejection Failed', err?.message || 'Could not reject deposit', 'error');
    } finally {
      setProcessingDepositId(null);
    }
  };

  const handleQuickApproveWithdrawal = async (id: string) => {
    setProcessingWithdrawId(id);
    try {
      await approveWithdrawal(id);
    } catch (err: any) {
      addToast('Approval Failed', err?.message || 'Could not approve withdrawal', 'error');
    } finally {
      setProcessingWithdrawId(null);
    }
  };

  const handleQuickRejectWithdrawal = async (id: string) => {
    setProcessingWithdrawId(id);
    try {
      await rejectWithdrawal(id, 'Declined by Admin (Refunded)');
    } catch (err: any) {
      addToast('Rejection Failed', err?.message || 'Could not reject withdrawal', 'error');
    } finally {
      setProcessingWithdrawId(null);
    }
  };

  useEffect(() => {
    refreshAdminData();

    // 1. Instant cross-device server event sync via SSE
    const handleServerEvent = (ev: Event) => {
      const type = (ev as CustomEvent)?.detail?.type;
      if (
        !type ||
        type === 'deposits_updated' ||
        type === 'withdrawals_updated' ||
        type === 'plans_updated' ||
        type === 'settings_updated' ||
        type === 'users_updated' ||
        type === 'balance_updated' ||
        type === 'user_registered'
      ) {
        refreshAdminData();
      }
    };
    window.addEventListener('wealthera:server-event', handleServerEvent);

    // 2. Fallback interval
    const interval = setInterval(() => {
      refreshAdminData();
    }, 10000);

    return () => {
      window.removeEventListener('wealthera:server-event', handleServerEvent);
      clearInterval(interval);
    };
  }, [refreshAdminData]);

  const users = adminData?.users || [];
  const deposits = adminData?.allDeposits || adminData?.deposits || contextDepositRequests || [];
  const withdrawals = adminData?.allWithdrawals || adminData?.withdrawals || contextWithdrawalRequests || [];
  const allTransactions = adminData?.allTransactions || adminData?.transactions || [];
  const plans = (contextPlans && contextPlans.length > 0) ? contextPlans : (adminData?.plans || []);
  const settings = (contextSettings && Object.keys(contextSettings).length > 0) ? contextSettings : (adminData?.settings || {});
  const depositMethods = (contextDepositMethods && contextDepositMethods.length > 0) ? contextDepositMethods : (adminData?.depositMethods || []);
  const withdrawalNetworks = (contextWithdrawalNetworks && contextWithdrawalNetworks.length > 0) ? contextWithdrawalNetworks : (adminData?.withdrawalNetworks || []);
  const auditLogs = adminData?.auditLogs || [];

  const overview = adminData?.overview || {
    totalUsers: users.length,
    activeUsers: users.filter((u: any) => u.status === 'active').length,
    suspendedUsers: users.filter((u: any) => u.status === 'suspended').length,
    bannedUsers: users.filter((u: any) => u.status === 'blocked').length,
    totalPlatformBalance: users.reduce((sum: number, u: any) => sum + (u.balance || 0), 0),
    totalDeposits: deposits.filter((d: any) => d.status === 'approved').reduce((sum: number, d: any) => sum + (d.amountKwd || 0), 0),
    pendingDepositsCount: deposits.filter((d: any) => d.status === 'pending').length,
    pendingDepositsValue: deposits.filter((d: any) => d.status === 'pending').reduce((sum: number, d: any) => sum + (d.amountKwd || 0), 0),
    totalWithdrawals: withdrawals.filter((w: any) => w.status === 'approved').reduce((sum: number, w: any) => sum + (w.amountKwd || 0), 0),
    pendingWithdrawalsCount: withdrawals.filter((w: any) => w.status === 'pending').length,
    pendingWithdrawalsValue: withdrawals.filter((w: any) => w.status === 'pending').reduce((sum: number, w: any) => sum + (w.amountKwd || 0), 0),
    totalActiveInvestments: 0,
    totalInvestmentCapital: 0,
    totalProfitsDistributed: 0,
    totalReferralCommissions: 0,
  };

  // Sync settingsForm once loaded or updated (only if admin is not actively editing it)
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0 && !settingsFormDirtyRef.current) {
      const jc = depositMethods.find((m: any) => (m.name || '').toLowerCase().includes('jazzcash'));
      const ep = depositMethods.find((m: any) => (m.name || '').toLowerCase().includes('easypaisa'));
      const us = depositMethods.find((m: any) => (m.name || '').toLowerCase().includes('usdt') || (m.name || '').toLowerCase().includes('trc20'));
      setSettingsForm({
        ...settings,
        jazzcashNumber: (settings as any).jazzcashNumber || jc?.accountNumber || '',
        jazzcashTitle: (settings as any).jazzcashTitle || jc?.accountTitle || '',
        easypaisaNumber: (settings as any).easypaisaNumber || ep?.accountNumber || '',
        easypaisaTitle: (settings as any).easypaisaTitle || ep?.accountTitle || '',
        usdtAddress: (settings as any).usdtAddress || us?.accountNumber || '',
        usdtTitle: (settings as any).usdtTitle || us?.accountTitle || '',
      } as any);
    }
  }, [JSON.stringify(settings), JSON.stringify(depositMethods)]);

  // Filtered lists
  const filteredUsers = (users || []).filter((u: any) => {
    const matchesSearch =
      u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredDeposits = (deposits || []).filter((d: any) => {
    if (depositFilter === 'all') return true;
    return d.status === depositFilter;
  });

  const filteredWithdrawals = (withdrawals || []).filter((w: any) => {
    if (withdrawalFilter === 'all') return true;
    return w.status === withdrawalFilter;
  });

  const filteredTransactions = (allTransactions || []).filter((tx: any) => {
    const matchesFilter = transactionFilter === 'all' || tx.type === transactionFilter;
    const matchesSearch =
      !transactionSearch.trim() ||
      tx.username?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      tx.referenceId?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      tx.description?.toLowerCase().includes(transactionSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // User Deletion Handler
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setIsDeletingUser(true);
      await deleteUserByAdmin(userToDelete.id);
      setUserToDelete(null);
    } catch (err: any) {
      addToast('User Deletion Failed', err.message, 'error');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Rejection handler
  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    try {
      if (rejectModal.type === 'deposit') {
        await rejectDeposit(rejectModal.id, rejectReason);
      } else {
        await rejectWithdrawal(rejectModal.id, rejectReason);
      }
      setRejectModal(null);
      setRejectReason('');
    } catch (err: any) {
      addToast('Action Failed', err.message, 'error');
    }
  };

  // User Balance Adjust
  const handleConfirmBalanceAdjust = async () => {
    if (!balanceAdjustUser) return;
    const amount = parseFloat(balanceAdjustAmount);
    if (isNaN(amount) || amount <= 0) {
      addToast('Invalid Amount', 'Please enter a valid positive number.', 'error');
      return;
    }
    if (!balanceAdjustReason.trim()) {
      addToast('Reason Required', 'Mandatory note required for audit purposes.', 'error');
      return;
    }
    try {
      await adjustUserBalance(balanceAdjustUser.id, amount, balanceAdjustType, balanceAdjustReason);
      setBalanceAdjustUser(null);
      setBalanceAdjustAmount('');
      setBalanceAdjustReason('');
      await refreshAdminData();
    } catch (err: any) {
      addToast('Balance Adjust Failed', err.message, 'error');
    }
  };

  // User Password Reset
  const handleConfirmPasswordReset = async () => {
    if (!resetPasswordUser || !newPassword.trim()) {
      addToast('Missing Password', 'Please enter a new password.', 'error');
      return;
    }
    if (newPassword.trim().length < 6) {
      addToast('Password Too Short', 'Password must be at least 6 characters long.', 'error');
      return;
    }
    try {
      await adminResetUserPassword(resetPasswordUser.id, newPassword.trim());
      setResetPasswordUser(null);
      setNewPassword('');
      await refreshAdminData();
    } catch (err: any) {
      addToast('Password Reset Failed', err.message || 'Failed to update user password', 'error');
    }
  };

  // Block / Unblock User Toggle
  const handleToggleBlockUser = async (u: User) => {
    const isBlocked = u.status === 'blocked' || u.status === 'suspended';
    const nextStatus = isBlocked ? 'active' : 'blocked';
    try {
      await updateUserByAdmin(u.id, {
        status: nextStatus,
        failedLoginAttempts: nextStatus === 'active' ? 0 : u.failedLoginAttempts,
        lockedUntil: nextStatus === 'active' ? null : u.lockedUntil,
      });
      addToast(
        nextStatus === 'blocked' ? 'User Blocked' : 'User Unblocked',
        `User @${u.username} has been ${nextStatus === 'blocked' ? 'blocked from platform access' : 'unblocked and restored to active'}.`,
        'success'
      );
      await refreshAdminData();
    } catch (err: any) {
      addToast('Status Change Failed', err.message || 'Could not update user status', 'error');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    try {
      settingsFormDirtyRef.current = false;
      await updatePlatformSettings(settingsForm);
      addToast('Platform Settings Saved', 'All numbers, limits, and contacts updated and synchronized across all devices in real-time.', 'success');
    } catch (err: any) {
      settingsFormDirtyRef.current = true;
      addToast('Settings Save Failed', err.message, 'error');
    }
  };

  // Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    try {
      await broadcastNotification({
        userId: broadcastTarget === 'all' ? undefined : broadcastTarget,
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        type: broadcastType,
      });
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err: any) {
      addToast('Broadcast Failed', err.message, 'error');
    }
  };

  const openNewSupportModal = () => {
    setEditingSupportLink(null);
    setSupportForm({
      title: '',
      type: 'telegram',
      value: '',
      link: '',
      enabled: true,
      description: '',
      badge: '24/7 Fast Response',
      order: (supportLinks?.length || 0) + 1,
    });
    setShowSupportModal(true);
  };

  const openEditSupportModal = (link: CustomerSupportLink) => {
    setEditingSupportLink(link);
    setSupportForm({
      title: link.title || '',
      type: link.type || 'telegram',
      value: link.value || '',
      link: link.link || '',
      enabled: link.enabled !== false,
      description: link.description || '',
      badge: link.badge || '',
      order: link.order ?? 1,
    });
    setShowSupportModal(true);
  };

  const handleSaveSupportLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportForm.title.trim() || !supportForm.link.trim()) {
      addToast('Validation Error', 'Title and link URL are required.', 'error');
      return;
    }
    setSupportSaving(true);
    try {
      if (editingSupportLink) {
        await updateSupportLink(editingSupportLink.id, {
          title: supportForm.title.trim(),
          type: supportForm.type,
          value: supportForm.value.trim() || supportForm.link.trim(),
          link: supportForm.link.trim(),
          enabled: supportForm.enabled,
          description: supportForm.description.trim() || undefined,
          badge: supportForm.badge.trim() || undefined,
          order: Number(supportForm.order) || 1,
        });
      } else {
        await createSupportLink({
          title: supportForm.title.trim(),
          type: supportForm.type,
          value: supportForm.value.trim() || supportForm.link.trim(),
          link: supportForm.link.trim(),
          enabled: supportForm.enabled,
          description: supportForm.description.trim() || undefined,
          badge: supportForm.badge.trim() || undefined,
          order: Number(supportForm.order) || 1,
        });
      }
      setShowSupportModal(false);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to save support link', 'error');
    } finally {
      setSupportSaving(false);
    }
  };

  const handleToggleSupportLink = async (link: CustomerSupportLink) => {
    try {
      await updateSupportLink(link.id, { enabled: !link.enabled });
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to toggle status', 'error');
    }
  };

  const handleConfirmDeleteSupport = async () => {
    if (!supportToDelete) return;
    setSupportDeleting(true);
    try {
      await deleteSupportLink(supportToDelete.id);
      setSupportToDelete(null);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to delete support link', 'error');
    } finally {
      setSupportDeleting(false);
    }
  };

  const drawerMenuItems = [
    {
      key: 'overview',
      label: 'Admin Overview',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      key: 'users',
      label: 'Members & Users',
      icon: <Users className="w-5 h-5" />,
      badgeCount: users.length,
    },
    {
      key: 'transactions',
      label: 'Live Financial Ledger',
      icon: <FileText className="w-5 h-5" />,
      badgeCount: allTransactions.length,
    },
    {
      key: 'plans',
      label: 'Investment Plans',
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      key: 'deposits',
      label: 'Deposits Review',
      icon: <ArrowDownLeft className="w-5 h-5" />,
      badgeCount: overview.pendingDepositsCount,
    },
    {
      key: 'withdrawals',
      label: 'Withdrawals Review',
      icon: <ArrowUpRight className="w-5 h-5" />,
      badgeCount: overview.pendingWithdrawalsCount,
    },
    {
      key: 'profit_engine',
      label: 'Profit Engine & Cycles',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      key: 'gateways',
      label: 'Payment Gateways & Methods',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      key: 'support',
      label: 'Help Center & Support Desk',
      icon: <Headphones className="w-5 h-5" />,
      badgeCount: (supportLinks || []).length,
    },
    {
      key: 'settings',
      label: 'Website & Platform Settings',
      icon: <Settings className="w-5 h-5" />,
    },
    {
      key: 'notifications',
      label: 'Broadcast Announcements',
      icon: <Bell className="w-5 h-5" />,
    },
    {
      key: 'audit',
      label: 'Audit Trail & Logs',
      icon: <ShieldCheck className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 selection:bg-aqua-100">
      {/* 3-Line Slideout Admin Portal Drawer (Matching Web Dashboard Aqua & Peach Theme) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-aqua-950/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Sidebar Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] bg-aqua-950 text-white h-full shadow-2xl border-r border-aqua-900 flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Header: Logo + "Admin Portal" + username + Close X */}
            <div className="p-5 flex items-center justify-between border-b border-aqua-900 bg-[#031d17]">
              <div className="flex items-center gap-3">
                <Logo variant="icon" size="md" className="shrink-0" />
                <div>
                  <h2 className="text-base font-black text-white tracking-tight leading-tight">Admin Portal</h2>
                  <p className="text-xs font-bold text-peach-400">@{admin?.username || 'admin'}</p>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl text-aqua-300 hover:text-white hover:bg-aqua-900/80 transition-colors cursor-pointer"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subheader: ADMIN MANAGEMENT + LIVE DB */}
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <span className="text-[11px] font-black tracking-wider text-aqua-200/90 uppercase">
                ADMIN MANAGEMENT
              </span>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-aqua-900 text-aqua-300 border border-aqua-700/60 flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-peach-400 animate-pulse"></span>
                LIVE DB
              </span>
            </div>

            {/* Menu Items List with Chevrons and Web Aqua & Peach Colors */}
            <div className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-aqua-900">
              {drawerMenuItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActiveTab(item.key as any);
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-peach-500 text-white shadow-lg shadow-peach-950/40 font-black'
                        : 'text-aqua-100/75 hover:text-white hover:bg-aqua-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-white' : 'text-peach-400'}>
                        {item.icon}
                      </span>
                      <span className="tracking-tight">{item.label}</span>
                      {item.badgeCount && item.badgeCount > 0 ? (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-black shadow-xs ${
                            isActive ? 'bg-white text-peach-600' : 'bg-peach-500 text-white'
                          }`}
                        >
                          {item.badgeCount}
                        </span>
                      ) : null}
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isActive ? 'text-white translate-x-0.5' : 'text-aqua-400/60'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-aqua-900 bg-[#031d17] space-y-2">
              {onBackToUserDashboard && (
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onBackToUserDashboard();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-aqua-900 hover:bg-aqua-800 text-aqua-100 text-xs font-bold flex items-center justify-center gap-2 border border-aqua-800 transition-colors cursor-pointer"
                >
                  <span>Switch to User Dashboard</span>
                </button>
              )}
              <button
                onClick={logoutAdmin}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Admin Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Admin Navigation Header - styled with WEALTHERA Aqua & Peach colors */}
      <header className="sticky top-0 z-30 bg-aqua-950 text-white shadow-md border-b border-aqua-900">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 3-line Hamburger Menu Button */}
            <button
              id="admin-menu-toggle"
              onClick={() => setIsDrawerOpen(true)}
              className="px-3 py-2 rounded-2xl bg-aqua-900 hover:bg-aqua-800 text-white border border-aqua-700/60 flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs"
              title="Open Admin Navigation Menu"
            >
              <Menu className="w-5 h-5 text-peach-400 stroke-[2.5]" />
              <span className="text-xs font-black text-white">Menu</span>
            </button>

            {/* Brand Emblem */}
            <Logo variant="icon" size="md" className="shrink-0" />

            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>WEALTHERA Control Center</span>
                <span className="text-[10px] bg-peach-500/20 text-peach-300 font-bold px-2 py-0.5 rounded-full border border-peach-400/30">
                  Super Admin
                </span>
              </h1>
              <p className="text-[11px] text-aqua-300/80">
                Authenticated: <span className="font-semibold text-white">@{admin?.username || 'admin'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              className={`p-2 rounded-xl bg-aqua-900 hover:bg-aqua-800 text-aqua-200 border border-aqua-800 transition-all cursor-pointer ${
                refreshing ? 'animate-spin text-peach-400' : ''
              }`}
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {onBackToUserDashboard && (
              <button
                onClick={onBackToUserDashboard}
                className="px-3 py-1.5 rounded-xl bg-aqua-900 hover:bg-aqua-800 text-xs font-bold text-aqua-100 border border-aqua-800 transition-colors cursor-pointer"
              >
                User App View
              </button>
            )}

            <button
              onClick={logoutAdmin}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Active Section Context Bar with 3-Line Switch Button */}
        <div className="bg-white rounded-2xl p-3.5 px-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-peach-500 animate-pulse"></div>
            <span className="font-semibold text-slate-500">Current Section:</span>
            <span className="font-black text-aqua-950 uppercase tracking-wide bg-aqua-50 px-3 py-1 rounded-xl border border-aqua-200 text-xs">
              {drawerMenuItems.find((m) => m.key === activeTab)?.label || activeTab}
            </span>
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-peach-500 hover:bg-peach-600 text-white text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Open Menu</span>
          </button>
        </div>
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Quick Alert Banner for Pending Requests */}
            {(overview.pendingDepositsCount > 0 || overview.pendingWithdrawalsCount > 0) && (
              <div className="bg-amber-500/10 border border-amber-300 text-amber-900 rounded-3xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-sm">Action Items Pending Approval</h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      {overview.pendingDepositsCount || 0} pending deposit(s) totaling {(overview.pendingDepositsValue ?? 0).toFixed(2)} KWD and {overview.pendingWithdrawalsCount || 0} pending withdrawal(s) totaling {(overview.pendingWithdrawalsValue ?? 0).toFixed(2)} KWD require verification.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('deposits')}
                    className="px-3 py-1.5 rounded-xl bg-peach-500 hover:bg-peach-600 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    Review Deposits
                  </button>
                  <button
                    onClick={() => setActiveTab('withdrawals')}
                    className="px-3 py-1.5 rounded-xl bg-aqua-950 hover:bg-aqua-900 text-white text-xs font-bold transition-colors"
                  >
                    Review Withdrawals
                  </button>
                </div>
              </div>
            )}

            {/* Direct 1-Click Pending Approvals Quick Hub on Overview */}
            {((deposits || []).some((d: any) => d.status === 'pending') ||
              (withdrawals || []).some((w: any) => w.status === 'pending')) && (
              <div className="bg-white rounded-3xl p-6 border border-amber-200/90 shadow-md space-y-5 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs text-base">
                      ⚡
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 text-sm tracking-tight">
                          Direct 1-Click Action Queue
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                          {((deposits || []).filter((d: any) => d.status === 'pending').length +
                            (withdrawals || []).filter((w: any) => w.status === 'pending').length)}{' '}
                          Action Required
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Instant 1-click verification. Approved deposits immediately credit user balances; approved withdrawals complete payout; rejected withdrawals refund balances instantly.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pending Deposits Section */}
                {(deposits || []).filter((d: any) => d.status === 'pending').length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Pending Deposits ({(deposits || []).filter((d: any) => d.status === 'pending').length})
                      </span>
                      <button
                        onClick={() => setActiveTab('deposits')}
                        className="text-[11px] font-bold text-peach-600 hover:text-peach-700 cursor-pointer"
                      >
                        All Deposits Tab →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(deposits || [])
                        .filter((d: any) => d.status === 'pending')
                        .slice(0, 6)
                        .map((dep: any) => (
                          <div
                            key={dep.id}
                            className="bg-slate-50/90 hover:bg-slate-50 rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-black text-slate-900 text-xs block">
                                  @{dep.username || 'user'}
                                </span>
                                <span className="text-[11px] font-bold text-slate-700">
                                  {dep.methodName}
                                </span>
                                <span className="block font-mono text-[10px] text-slate-500 select-all">
                                  TID: {dep.transactionId}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-black text-emerald-600 block">
                                  +{dep.amountKwd.toFixed(2)} KWD
                                </span>
                                <span className="text-[10px] text-slate-400 block font-medium">
                                  ≈ {(dep.amountPkr || Math.round(dep.amountKwd * (settings?.depositRatePkr || 911))).toLocaleString()} PKR
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 gap-2">
                              {dep.proofUrl ? (
                                <button
                                  onClick={() => setSelectedProofUrl(dep.proofUrl)}
                                  className="text-[11px] font-bold text-aqua-800 hover:text-aqua-950 flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Proof</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">No screenshot</span>
                              )}

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleQuickApproveDeposit(dep.id)}
                                  disabled={processingDepositId === dep.id}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                                  title="1-Click Instant Approve Deposit"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{processingDepositId === dep.id ? 'Approving...' : '1-Click Approve'}</span>
                                </button>
                                <button
                                  onClick={() => handleQuickRejectDeposit(dep.id)}
                                  disabled={processingDepositId === dep.id}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                                  title="1-Click Instant Reject Deposit"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Pending Withdrawals Section */}
                {(withdrawals || []).filter((w: any) => w.status === 'pending').length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        Pending Withdrawals ({(withdrawals || []).filter((w: any) => w.status === 'pending').length})
                      </span>
                      <button
                        onClick={() => setActiveTab('withdrawals')}
                        className="text-[11px] font-bold text-peach-600 hover:text-peach-700 cursor-pointer"
                      >
                        All Withdrawals Tab →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(withdrawals || [])
                        .filter((w: any) => w.status === 'pending')
                        .slice(0, 6)
                        .map((w: any) => (
                          <div
                            key={w.id}
                            className="bg-slate-50/90 hover:bg-slate-50 rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-black text-slate-900 text-xs block">
                                  @{w.username || 'user'}
                                </span>
                                <span className="text-[11px] font-bold text-slate-700">
                                  {w.type === 'USDT'
                                    ? `USDT (${w.network || 'TRC20'})`
                                    : `${w.bankOrWalletName || 'Bank/Wallet'} - ${w.accountTitle || ''}`}
                                </span>
                                <span className="block font-mono text-[10px] text-slate-600 select-all truncate max-w-[200px]">
                                  {w.type === 'USDT' ? w.walletAddress : w.accountNumber}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-black text-rose-600 block">
                                  {w.amountKwd.toFixed(2)} KWD
                                </span>
                                <span className="text-[10px] text-slate-500 block font-medium">
                                  Net: {w.netAmountKwd?.toFixed(2) || w.amountKwd.toFixed(2)} KWD (≈ {(w.amountPkr || Math.round(w.amountKwd * (settings?.withdrawalRatePkr || 911))).toLocaleString()} PKR)
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-end pt-2 border-t border-slate-200/60 gap-1.5">
                              <button
                                onClick={() => handleQuickApproveWithdrawal(w.id)}
                                disabled={processingWithdrawId === w.id}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                                title="1-Click Instant Approve Withdrawal"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{processingWithdrawId === w.id ? 'Approving...' : '1-Click Approve'}</span>
                              </button>
                              <button
                                onClick={() => handleQuickRejectWithdrawal(w.id)}
                                disabled={processingWithdrawId === w.id}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                                title="1-Click Instant Reject and Refund Withdrawal"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject & Refund</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Users */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Registered Users</span>
                  <div className="w-8 h-8 rounded-xl bg-aqua-50 text-aqua-800 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{overview.totalUsers || 0}</div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="text-emerald-600 font-bold">{overview.activeUsers || 0} Active</span>
                  <span>•</span>
                  <span className="text-amber-600 font-bold">{overview.suspendedUsers || 0} Suspended</span>
                  <span>•</span>
                  <span className="text-rose-600 font-bold">{overview.bannedUsers || 0} Banned</span>
                </div>
              </div>

              {/* Platform Balance */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Platform Balances</span>
                  <div className="w-8 h-8 rounded-xl bg-aqua-50 text-aqua-800 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {(overview.totalPlatformBalance ?? 0).toFixed(2)} <span className="text-sm font-bold text-slate-400">KWD</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  ≈ {Math.round((overview.totalPlatformBalance ?? 0) * (settings?.depositRatePkr || 911)).toLocaleString()} PKR
                </div>
              </div>

              {/* Total Deposits */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Deposits</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-600">
                  {(overview.totalDeposits ?? 0).toFixed(2)} <span className="text-sm font-bold text-emerald-700">KWD</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Pending: {overview.pendingDepositsCount || 0} ({(overview.pendingDepositsValue ?? 0).toFixed(2)} KWD)
                </div>
              </div>

              {/* Total Withdrawals */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Withdrawals</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {(overview.totalWithdrawals ?? 0).toFixed(2)} <span className="text-sm font-bold text-slate-400">KWD</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Pending: {overview.pendingWithdrawalsCount || 0} ({(overview.pendingWithdrawalsValue ?? 0).toFixed(2)} KWD)
                </div>
              </div>

              {/* Active Investments */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Active Investments</span>
                  <div className="w-8 h-8 rounded-xl bg-peach-50 text-peach-700 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{overview.totalActiveInvestments || 0} Plans</div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Capital: {(overview.totalInvestmentCapital ?? 0).toFixed(2)} KWD
                </div>
              </div>

              {/* Distributed Profits */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Profits Distributed</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-600">
                  +{(overview.totalProfitsDistributed ?? 0).toFixed(2)} <span className="text-sm font-bold text-emerald-700">KWD</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Manual physical dividend cycles
                </div>
              </div>

              {/* Referral Commissions */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Referral Commissions</span>
                  <div className="w-8 h-8 rounded-xl bg-peach-50 text-peach-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {(overview.totalReferralCommissions ?? 0).toFixed(2)} <span className="text-sm font-bold text-slate-400">KWD</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-500 font-semibold">
                    Current Rate: <span className="text-peach-600 font-black">{settings?.referralCommissionPercent}%</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="text-[11px] font-black text-aqua-800 hover:text-aqua-950 underline cursor-pointer"
                  >
                    Edit Commission →
                  </button>
                </div>
              </div>

              {/* Profit Engine Quick Trigger */}
              <div className="bg-aqua-950 border border-aqua-900 rounded-3xl p-5 text-white shadow-md space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-peach-400">Manual Profit Cycle</span>
                  <h4 className="text-base font-black text-white mt-1">Daily Profit Cycle</h4>
                  <p className="text-[11px] text-aqua-200">Distribute genuine dividends across all real active investments</p>
                </div>
                <button
                  onClick={handleRunProfitCycle}
                  disabled={isRunningProfitCycle}
                  className="w-full py-2.5 rounded-xl bg-peach-500 text-white hover:bg-peach-600 text-xs font-black transition-transform active:scale-95 shadow-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {isRunningProfitCycle ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Distributing...</span>
                    </>
                  ) : (
                    <span>Run Cycle Now</span>
                  )}
                </button>
              </div>
            </div>

            {/* Recent Real Transactions on Overview */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-aqua-800" />
                  <h3 className="font-extrabold text-sm text-slate-900">Recent Financial Activity</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Real-time Ledger
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs font-black text-peach-600 hover:text-peach-700 transition-colors cursor-pointer"
                >
                  View Complete Ledger ({allTransactions.length}) →
                </button>
              </div>

              {allTransactions.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Zero Dummy Data in Ledger</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Real physical transactions will populate this ledger as genuine users submit deposits, activate plans, earn dividends, or withdraw.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Reference</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allTransactions.slice(0, 5).map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-[11px] text-slate-500 font-mono">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            @{tx.username || 'user'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {tx.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                            {tx.referenceId}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-black ${
                            tx.amount > 0 ? 'text-emerald-600' : 'text-slate-800'
                          }`}>
                            {tx.amount > 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} KWD
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700">
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Search and Filters Bar */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by username, email, or phone..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aqua-400"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-aqua-400"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                  <option value="banned">Banned Only</option>
                </select>

                <button
                  type="button"
                  id="admin-add-new-user-btn"
                  onClick={() => {
                    setNewUserData({
                      username: '',
                      fullName: '',
                      email: '',
                      phone: '',
                      password: '',
                      balance: '',
                      assignedPlanId: '',
                      status: 'active',
                      referredBy: '',
                    });
                    setAddUserError(null);
                    setShowAddUserModal(true);
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-aqua-900 hover:bg-aqua-950 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add User</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Registered Contact (Mobile & Email)</th>
                      <th className="py-3.5 px-4">Balance</th>
                      <th className="py-3.5 px-4">Invested / Withdrawn</th>
                      <th className="py-3.5 px-4">Referral Info</th>
                      <th className="py-3.5 px-4">Status & Security</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">
                          No users found matching query.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-aqua-100 text-aqua-900 flex items-center justify-center font-bold text-sm shadow-2xs">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-black text-slate-900 text-xs">@{u.username}</p>
                                  {u.fullName && (
                                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {u.fullName}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[9px] text-slate-400 font-mono">ID: {u.id.slice(0, 12)}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(u.id);
                                      addToast('Copied', 'User ID copied to clipboard', 'success');
                                    }}
                                    title="Copy User ID"
                                    className="text-slate-400 hover:text-slate-600 p-0.5"
                                  >
                                    <Copy className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1.5 min-w-[210px]">
                              {/* Registered Mobile / WhatsApp */}
                              <div className="flex items-center justify-between gap-1.5 bg-emerald-50/90 border border-emerald-200/90 rounded-xl px-2.5 py-1.5 shadow-2xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                    <Phone className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-800 block leading-none">
                                      Registered Number
                                    </span>
                                    <span className="font-mono font-black text-xs text-slate-900 select-all block leading-tight">
                                      {u.phone || (u as any).mobile || 'No phone'}
                                    </span>
                                  </div>
                                </div>
                                {(u.phone || (u as any).mobile) && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => {
                                        const phoneNum = u.phone || (u as any).mobile;
                                        navigator.clipboard.writeText(phoneNum);
                                        addToast('Copied', `Phone number ${phoneNum} copied to clipboard`, 'success');
                                      }}
                                      title="Copy Phone Number"
                                      className="p-1 hover:bg-emerald-200/70 text-emerald-800 rounded-md transition-colors"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                    <a
                                      href={`https://wa.me/${(u.phone || (u as any).mobile).replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Chat on WhatsApp"
                                      className="p-1 hover:bg-emerald-200/70 text-emerald-800 rounded-md transition-colors"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Email Address */}
                              <div className="flex items-center justify-between gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 shadow-2xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-slate-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                    <Mail className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 block leading-none">
                                      Registered Email
                                    </span>
                                    <span className="font-semibold text-xs text-slate-800 truncate block leading-tight select-all">
                                      {u.email}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(u.email);
                                    addToast('Copied', `Email ${u.email} copied to clipboard`, 'success');
                                  }}
                                  title="Copy Email Address"
                                  className="p-1 hover:bg-slate-200 text-slate-600 rounded-md transition-colors shrink-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-black text-slate-900 text-sm">
                              {(u.balance ?? 0).toFixed(2)} KWD
                            </span>
                            <span className="block text-[10px] text-emerald-600 font-bold">
                              Profit: +{(u.totalProfit ?? 0).toFixed(2)} KWD
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <p className="text-slate-700 font-semibold">Inv: {(u.totalInvested ?? 0).toFixed(2)} KWD</p>
                            <p className="text-[10px] text-slate-400">Wd: {(u.totalWithdrawn ?? 0).toFixed(2)} KWD</p>
                            <span className="inline-block mt-1 text-[10px] font-extrabold text-aqua-950 bg-aqua-100/70 border border-aqua-200/60 px-1.5 py-0.5 rounded-md">
                              {u.activePlanName && u.activePlanName !== 'None' ? `Plan: ${u.activePlanName}` : 'No Plan'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-mono text-slate-700 font-bold">{u.referralCode}</p>
                            <p className="text-[10px] text-slate-400">
                              By: {u.referredBy ? `@${u.referredBy}` : 'Direct'}
                            </p>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                                    u.status === 'active'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : u.status === 'suspended'
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-rose-50 text-rose-700'
                                  }`}
                                >
                                  {u.status}
                                </span>
                                {(() => {
                                  const lastClaim = u.lastProfitClaimDate || (u as any).lastEarningClaimAt || (u as any).lastDailyProfitClaim;
                                  if (!lastClaim) {
                                    return (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded-md">
                                        ⚡ Cycle Ready
                                      </span>
                                    );
                                  }
                                  const lastTime = new Date(lastClaim).getTime();
                                  const diffHours = (Date.now() - lastTime) / (1000 * 3600);
                                  if (diffHours >= 24) {
                                    return (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded-md">
                                        ⚡ Cycle Ready
                                      </span>
                                    );
                                  }
                                  const hoursLeft = Math.ceil(24 - diffHours);
                                  return (
                                    <span
                                      className="inline-flex items-center gap-1 text-[9px] font-black text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded-md"
                                      title={`Claimed on ${new Date(lastClaim).toLocaleString()}`}
                                    >
                                      ⏳ In Cycle (~{hoursLeft}h)
                                    </span>
                                  );
                                })()}
                              </div>
                              {u.lockedUntil && new Date(u.lockedUntil) > new Date() && (
                                <span className="text-[9px] text-rose-600 font-bold">Locked Out (10 fails)</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Open / Reset 24h Daily Cycle */}
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    title: `Open Daily Cycle for @${u.username}`,
                                    message: `Reset and unlock the 24-hour daily earning cycle for @${u.username}? This will allow the user to immediately click "Run Cycle Now" and receive their earnings.`,
                                    dangerText: '⚡ Open Cycle Now',
                                    onConfirm: async () => {
                                      await resetUserDailyCycle(u.id);
                                    },
                                  });
                                }}
                                title="Open / Unlock 24h Daily Cycle (Allow user to claim immediately)"
                                className="p-1.5 rounded-lg bg-amber-500/15 text-amber-800 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer"
                              >
                                <Zap className="w-3.5 h-3.5" />
                              </button>

                              {/* Impersonate */}
                              <button
                                onClick={() => impersonateUser(u)}
                                title="Impersonate Dashboard"
                                className="p-1.5 rounded-lg bg-aqua-50 text-aqua-800 hover:bg-aqua-100 transition-colors"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>

                              {/* Adjust Balance */}
                              <button
                                onClick={() => setBalanceAdjustUser(u)}
                                title="Adjust Balance (Add/Deduct)"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => setResetPasswordUser(u)}
                                title="Reset Password Directly"
                                className="p-1.5 rounded-lg bg-aqua-50 text-aqua-800 hover:bg-aqua-100 transition-colors"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              {/* 1-Click Block / Unblock Account */}
                              <button
                                onClick={() => handleToggleBlockUser(u)}
                                title={u.status === 'blocked' || u.status === 'suspended' ? 'Unblock User Account' : 'Block User Account'}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  u.status === 'blocked' || u.status === 'suspended'
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                                    : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'
                                }`}
                              >
                                {u.status === 'blocked' || u.status === 'suspended' ? (
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                ) : (
                                  <Ban className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Unlock account if locked */}
                              {(u.failedLoginAttempts > 0 || u.lockedUntil) && (
                                <button
                                  onClick={() =>
                                    updateUserByAdmin(u.id, { failedLoginAttempts: 0, lockedUntil: null })
                                  }
                                  title="Reset Lockout & Failed Attempts"
                                  className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Edit Profile */}
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setEditingUserNewPassword('');
                                  setEditingUserBalance((u.balance ?? 0).toString());
                                }}
                                title="Edit All User Details (Phone, Email, Balance, Password, Status)"
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete User */}
                              <button
                                onClick={() => setUserToDelete(u)}
                                title="Permanently Delete User"
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Touch-Friendly User Cards (Visible on screens < 768px) */}
            <div className="block md:hidden space-y-3">
              {filteredUsers.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
                  No users found matching query.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const lastClaim = u.lastProfitClaimDate || (u as any).lastEarningClaimAt || (u as any).lastDailyProfitClaim;
                  const isCycleReady = !lastClaim || (Date.now() - new Date(lastClaim).getTime()) >= 24 * 3600 * 1000;
                  const hoursLeft = lastClaim ? Math.max(1, Math.ceil(24 - (Date.now() - new Date(lastClaim).getTime()) / (3600 * 1000))) : 0;

                  return (
                    <div
                      key={u.id}
                      className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3"
                    >
                      {/* User Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-aqua-100 text-aqua-900 flex items-center justify-center font-black text-sm shrink-0">
                            {(u.username || u.fullName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-black text-slate-900 text-sm truncate">@{u.username}</p>
                              <button
                                type="button"
                                onClick={() => handleToggleBlockUser(u)}
                                title={u.status === 'blocked' || u.status === 'suspended' ? 'Click to unblock user' : 'Click to block user'}
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer ${
                                  u.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-800'
                                    : 'bg-rose-100 text-rose-800 hover:bg-emerald-100 hover:text-emerald-800'
                                }`}
                              >
                                {u.status === 'blocked' || u.status === 'suspended' ? (
                                  <>
                                    <Ban className="w-2.5 h-2.5 text-rose-600" />
                                    <span>Blocked (Tap to Unblock)</span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Active</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{u.fullName || 'No display name'}</p>
                          </div>
                        </div>

                        {/* 24h Cycle Badge */}
                        <div className="shrink-0">
                          {isCycleReady ? (
                            <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-1 rounded-lg flex items-center gap-1">
                              ⚡ Cycle Ready
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-1 rounded-lg flex items-center gap-1">
                              ⏳ Cooldown ({hoursLeft}h)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Contact & Balance Info */}
                      <div className="p-3 bg-slate-50 rounded-2xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Registered Mobile:</span>
                          <span className="font-mono font-black text-slate-900 select-all">
                            {u.phone || (u as any).mobile || 'None'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Wallet Balance:</span>
                          <span className="font-mono font-black text-emerald-700">
                            {(u.balance || 0).toFixed(2)} KWD
                          </span>
                        </div>
                      </div>

                      {/* Mobile Main Action Button: Open 24h Cycle Now */}
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmModal({
                            title: `Open Daily Cycle for @${u.username}`,
                            message: `Reset and open the 24-hour daily earning cycle for @${u.username}? This will remove their cooldown so they can immediately click "Run Cycle Now".`,
                            dangerText: '⚡ Open Cycle Now',
                            onConfirm: async () => {
                              await resetUserDailyCycle(u.id);
                            },
                          });
                        }}
                        className="w-full min-h-[44px] py-2.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                      >
                        <Zap className="w-4 h-4 fill-white" />
                        <span>⚡ Open 24h Daily Cycle (Allow Claim Now)</span>
                      </button>

                      {/* Mobile User Administrative Action Controls */}
                      <div className="space-y-1.5 pt-1">
                        <div className="grid grid-cols-3 gap-1.5">
                          {/* Balance Adjust (Add/Cut) */}
                          <button
                            type="button"
                            onClick={() => setBalanceAdjustUser(u)}
                            className="min-h-[40px] py-2 px-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Add / Cut User Balance"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Balance</span>
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => setResetPasswordUser(u)}
                            className="min-h-[40px] py-2 px-1 rounded-xl bg-aqua-50 hover:bg-aqua-100 text-aqua-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Reset User Password Directly"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Password</span>
                          </button>

                          {/* Block / Unblock 1-Click */}
                          <button
                            type="button"
                            onClick={() => handleToggleBlockUser(u)}
                            className={`min-h-[40px] py-2 px-1 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                              u.status === 'blocked' || u.status === 'suspended'
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                            }`}
                            title={u.status === 'blocked' || u.status === 'suspended' ? 'Unblock User' : 'Block User'}
                          >
                            {u.status === 'blocked' || u.status === 'suspended' ? (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Unblock</span>
                              </>
                            ) : (
                              <>
                                <Ban className="w-3.5 h-3.5" />
                                <span>Block</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          {/* Impersonate / Login as User */}
                          <button
                            type="button"
                            onClick={() => impersonateUser(u)}
                            className="min-h-[38px] py-1.5 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Impersonate Dashboard"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Login</span>
                          </button>

                          {/* Edit Full Profile */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(u);
                              setEditingUserNewPassword('');
                              setEditingUserBalance((u.balance ?? 0).toString());
                            }}
                            className="min-h-[38px] py-1.5 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Edit Full Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* Delete User Account */}
                          <button
                            type="button"
                            onClick={() => setUserToDelete(u)}
                            className="min-h-[38px] py-1.5 px-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Permanently Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB: LIVE FINANCIAL LEDGER & TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Header & Metrics */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                  <h3 className="font-extrabold text-base text-slate-900">Real-Time Financial Ledger</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  100% genuine physical transactions recorded on WEALTHERA. No automated or test fixtures.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-2xl bg-aqua-50 border border-aqua-200 text-xs text-aqua-950 font-bold">
                  Total Ledger Records: <span className="text-peach-600 font-black">{allTransactions.length}</span>
                </div>
                <button
                  type="button"
                  id="admin-add-ledger-entry-btn"
                  onClick={() => {
                    setNewTxData({
                      userId: users[0]?.id || '',
                      amount: '',
                      type: 'balance_adjustment',
                      description: '',
                      status: 'completed',
                    });
                    setAddTxError(null);
                    setShowAddTxModal(true);
                  }}
                  className="px-3.5 py-2 rounded-2xl bg-aqua-900 hover:bg-aqua-950 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Ledger Entry</span>
                </button>
              </div>
            </div>

            {/* Filter Chips & Search Bar */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  placeholder="Filter by user, reference ID, or description..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aqua-400"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'All Records' },
                  { id: 'deposit', label: 'Deposits' },
                  { id: 'withdrawal', label: 'Withdrawals' },
                  { id: 'plan_activation', label: 'Plans' },
                  { id: 'daily_profit', label: 'Dividends' },
                  { id: 'referral_commission', label: 'Referrals' },
                  { id: 'balance_adjustment', label: 'Adjustments' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTransactionFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      transactionFilter === f.id
                        ? 'bg-aqua-950 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Reference / Description</th>
                      <th className="py-3.5 px-4 text-right">Amount (KWD)</th>
                      <th className="py-3.5 px-4 text-right">Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-16 text-slate-400">
                          <div className="max-w-sm mx-auto space-y-2">
                            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="font-bold text-slate-700">No Physical Transactions Found</p>
                            <p className="text-[11px] text-slate-400">
                              {transactionSearch || transactionFilter !== 'all'
                                ? 'No transactions match the selected filters.'
                                : 'The live ledger is completely pristine. As real users make deposits, activate plans, receive dividends, or withdraw, transactions will appear here.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx: any) => {
                        const isCredit = tx.amount > 0;
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-800">
                                {new Date(tx.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {new Date(tx.createdAt).toLocaleTimeString()}
                              </p>
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-aqua-100 text-aqua-800 font-bold flex items-center justify-center text-[10px]">
                                  {(tx.username || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-extrabold text-slate-900 block">
                                    @{tx.username || 'user'}
                                  </span>
                                  {tx.userId && (
                                    <span className="text-[9px] text-slate-400 font-mono">
                                      ID: {tx.userId.slice(0, 8)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  tx.type === 'deposit'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : tx.type === 'withdrawal'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : tx.type === 'daily_profit'
                                    ? 'bg-aqua-50 text-aqua-800 border border-aqua-200'
                                    : tx.type === 'referral_commission'
                                    ? 'bg-peach-50 text-peach-700 border border-peach-200'
                                    : tx.type === 'plan_activation'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {tx.type.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>

                            <td className="py-3 px-4 max-w-xs">
                              <p className="font-mono text-[10px] font-bold text-slate-700 truncate">
                                {tx.referenceId}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {tx.description || 'System processed entry'}
                              </p>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <span
                                className={`font-black text-sm block ${
                                  isCredit ? 'text-emerald-600' : 'text-slate-900'
                                }`}
                              >
                                {isCredit ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} KWD
                              </span>
                              <span className="text-[10px] text-slate-400 block font-medium">
                                ≈ {Math.round(Math.abs(tx.amount) * (settings?.depositRatePkr || 911)).toLocaleString()} PKR
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  tx.status === 'completed' || tx.status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : tx.status === 'pending'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setTxToDelete(tx)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer inline-flex items-center justify-center border border-rose-100"
                                title="Delete Transaction Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DEPOSITS MANAGEMENT */}
        {activeTab === 'deposits' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDepositFilter(tab)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    depositFilter === tab
                      ? 'bg-aqua-950 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab} Deposits
                </button>
              ))}
            </div>

            {/* Deposits Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Gateway & TID</th>
                      <th className="py-3.5 px-4">Receipt Proof</th>
                      <th className="py-3.5 px-4">Date & Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDeposits.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          No deposit requests found.
                        </td>
                      </tr>
                    ) : (
                      filteredDeposits.map((dep) => (
                        <tr key={dep.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">@{dep.username}</td>
                          <td className="py-3 px-4">
                            <span className="font-black text-slate-900 text-sm">
                              {dep.amountKwd.toFixed(2)} KWD
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              ≈ {dep.amountPkr.toLocaleString()} PKR
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800">{dep.methodName || dep.methodTitle || 'Deposit Gateway'}</span>
                            <span className="block font-mono text-[10px] text-slate-600 select-all font-bold">
                              TID: {dep.transactionId}
                            </span>
                            {dep.senderAccount && (
                              <span className="block text-[10px] text-slate-500">
                                <span className="font-bold text-slate-700">Sender:</span> {dep.senderAccount}
                              </span>
                            )}
                            {dep.paymentDate && (
                              <span className="block text-[10px] text-slate-400">
                                <span className="font-medium">Paid on:</span> {dep.paymentDate}
                              </span>
                            )}
                            {dep.note && (
                              <span className="block text-[10px] text-amber-800 italic bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 max-w-[220px] truncate" title={dep.note}>
                                Note: &ldquo;{dep.note}&rdquo;
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {dep.proofUrl ? (
                              <button
                                onClick={() => setSelectedProofUrl(dep.proofUrl || null)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-aqua-50 text-aqua-800 hover:bg-aqua-100 font-bold text-[11px] transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Receipt</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">No screenshot</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                dep.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : dep.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {dep.status}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {new Date(dep.createdAt).toLocaleString()}
                            </span>
                            {dep.rejectionReason && (
                              <span className="block text-[10px] text-rose-600 max-w-[150px] truncate font-medium mt-0.5" title={dep.rejectionReason}>
                                Reason: {dep.rejectionReason}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {dep.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleQuickApproveDeposit(dep.id)}
                                    disabled={processingDepositId === dep.id}
                                    title="1-Click Instant Approve"
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{processingDepositId === dep.id ? 'Approving...' : 'Approve'}</span>
                                  </button>
                                  <button
                                    onClick={() => handleQuickRejectDeposit(dep.id)}
                                    disabled={processingDepositId === dep.id}
                                    title="1-Click Instant Reject"
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                  <button
                                    onClick={() => setRejectModal({ id: dep.id, type: 'deposit' })}
                                    title="Reject with custom reason note"
                                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium text-xs flex items-center transition-colors cursor-pointer"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">Processed</span>
                              )}
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    title: 'Delete Deposit Record',
                                    message: `Permanently delete deposit record of @${dep.username} (${(dep.amountKwd || 0).toFixed(2)} KWD)? This will remove it from all audit ledgers.`,
                                    dangerText: 'Delete Record',
                                    onConfirm: () => deleteDeposit(dep.id),
                                  });
                                }}
                                title="Delete Deposit Record"
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WITHDRAWALS MANAGEMENT */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setWithdrawalFilter(tab)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    withdrawalFilter === tab
                      ? 'bg-aqua-950 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab} Withdrawals
                </button>
              ))}
            </div>

            {/* Withdrawals Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Requested & Net</th>
                      <th className="py-3.5 px-4">Method & Destination</th>
                      <th className="py-3.5 px-4">Fee Deducted</th>
                      <th className="py-3.5 px-4">Date & Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWithdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          No withdrawal requests found.
                        </td>
                      </tr>
                    ) : (
                      filteredWithdrawals.map((wd) => (
                        <tr key={wd.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">@{wd.username}</td>
                          <td className="py-3 px-4">
                            <span className="font-black text-slate-900 text-sm">
                              {wd.amountKwd.toFixed(2)} KWD
                            </span>
                            <span className="block text-[10px] text-aqua-800 font-bold">
                              Net: {wd.netAmountKwd.toFixed(2)} KWD
                              {wd.netAmountPkr && ` (${wd.netAmountPkr.toLocaleString()} PKR)`}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800">{wd.type}</span>
                            {wd.type === 'USDT' ? (
                              <div className="font-mono text-[10px] text-slate-500 select-all">
                                <span className="font-bold text-aqua-800">[{wd.network}]</span> {wd.walletAddress}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-500">
                                <span className="font-bold text-slate-700">{wd.bankOrWalletName}:</span> {wd.accountNumber} ({wd.accountTitle})
                              </div>
                            )}
                            {wd.note && (
                              <span className="block text-[10px] text-amber-800 italic bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 max-w-[220px] truncate" title={wd.note}>
                                Note: &ldquo;{wd.note}&rdquo;
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {wd.feeKwd.toFixed(2)} KWD
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                wd.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : wd.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {wd.status}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {new Date(wd.createdAt).toLocaleString()}
                            </span>
                            {wd.rejectionReason && (
                              <span className="block text-[10px] text-rose-600 max-w-[150px] truncate font-medium mt-0.5" title={wd.rejectionReason}>
                                Reason: {wd.rejectionReason}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {wd.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleQuickApproveWithdrawal(wd.id)}
                                    disabled={processingWithdrawId === wd.id}
                                    title="1-Click Instant Approve"
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{processingWithdrawId === wd.id ? 'Approving...' : 'Approve'}</span>
                                  </button>
                                  <button
                                    onClick={() => handleQuickRejectWithdrawal(wd.id)}
                                    disabled={processingWithdrawId === wd.id}
                                    title="1-Click Instant Reject & Refund"
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                  <button
                                    onClick={() => setRejectModal({ id: wd.id, type: 'withdrawal' })}
                                    title="Reject with custom reason note"
                                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium text-xs flex items-center transition-colors cursor-pointer"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">Processed</span>
                              )}
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    title: 'Delete Withdrawal Request',
                                    message: `Permanently delete withdrawal request of @${wd.username} (${(wd.amountKwd || 0).toFixed(2)} KWD)?${wd.status === 'pending' ? ' Note: The pending amount will be refunded to user balance.' : ''}`,
                                    dangerText: 'Delete Request',
                                    onConfirm: () => deleteWithdrawal(wd.id, wd.status === 'pending'),
                                  });
                                }}
                                title="Delete Withdrawal Request"
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: INVESTMENT PLANS MANAGEMENT */}
        {activeTab === 'plans' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Investment Plans Management</h3>
                <p className="text-xs text-slate-500">Create, edit, toggle, or retire investment portfolio plans</p>
              </div>
              <button
                onClick={() =>
                  setEditingPlan({
                    name: '',
                    amount: 50,
                    dailyProfit: 3.5,
                    durationDays: 45,
                    description: '',
                    status: 'active',
                  })
                }
                className="px-4 py-2.5 rounded-2xl bg-peach-500 hover:bg-peach-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Plan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((p) => {
                const totalProfit =
                  p.totalProfit ?? Math.round(p.dailyProfit * (p.durationDays || 45) * 100) / 100;
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3.5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                            p.status === 'active'
                              ? 'bg-aqua-100 text-aqua-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.status.toUpperCase()}
                        </span>
                        <span className="text-base font-black text-aqua-950">
                          {p.amount.toFixed(2)} KWD
                        </span>
                      </div>

                      <h4 className="text-base font-black text-slate-900">{p.name}</h4>

                      {/* 3 Metrics: Daily Profit, Total Profit, Duration */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-2xl text-center text-xs">
                        <div className="space-y-0.5">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Daily Profit</span>
                          <span className="font-black text-peach-600">+{p.dailyProfit.toFixed(2)} KWD</span>
                        </div>
                        <div className="space-y-0.5 border-x border-slate-200 px-1">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Profit</span>
                          <span className="font-black text-aqua-800">+{totalProfit.toFixed(2)} KWD</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Duration</span>
                          <span className="font-black text-slate-800">{p.durationDays || 45} Days</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() =>
                          updatePlan(p.id, { status: p.status === 'active' ? 'disabled' : 'active' })
                        }
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                          p.status === 'active'
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {p.status === 'active' ? 'Disable' : 'Enable'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingPlan(p)}
                          className="p-2 rounded-xl bg-aqua-50 hover:bg-aqua-100 text-aqua-800 transition-colors"
                          title="Edit Plan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmModal({
                              title: 'Delete Investment Plan',
                              message: `Are you sure you want to delete "${p.name}"? This plan will no longer be visible or purchasable by members.`,
                              dangerText: 'Delete Plan',
                              onConfirm: () => deletePlan(p.id),
                            });
                          }}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: PROFIT ENGINE & MANUAL TRIGGER */}
        {activeTab === 'profit_engine' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Global Distribution & Cycle Engine */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Manual Dividend & 24h Daily Cycle Engine</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Control global dividend execution and 24-hour cycle timers. You can run profit distribution for active plans or unlock 24-hour cooldown cycles so users can click &quot;Run Cycle Now&quot; immediately.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleRunProfitCycle}
                    disabled={isRunningProfitCycle}
                    className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-peach-500 hover:bg-peach-600 text-white font-black text-xs flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isRunningProfitCycle ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Distributing Earnings...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Run Daily Profit Cycle Now</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setConfirmModal({
                        title: 'Unlock 24h Cycles for ALL Users',
                        message: 'Reset 24-hour daily cycle cooldowns for ALL members on the platform? Every user with an active investment will be able to immediately click "Run Cycle Now" and receive their earnings.',
                        dangerText: '⚡ Unlock All Cycles',
                        onConfirm: async () => {
                          await resetAllDailyCycles();
                        },
                      });
                    }}
                    className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    <span>⚡ Unlock Cycles for ALL Users</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                <div className="p-3.5 bg-slate-50 rounded-2xl">
                  <span className="text-[11px] text-slate-400 block font-medium">Active Investments</span>
                  <span className="text-lg font-black text-slate-900">{overview.totalActiveInvestments}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl">
                  <span className="text-[11px] text-slate-400 block font-medium">Total Capital Working</span>
                  <span className="text-lg font-black text-slate-900">{overview.totalInvestmentCapital.toFixed(2)} KWD</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl">
                  <span className="text-[11px] text-slate-400 block font-medium">Lifetime Dividends Paid</span>
                  <span className="text-lg font-black text-emerald-600">+{overview.totalProfitsDistributed.toFixed(2)} KWD</span>
                </div>
              </div>
            </div>

            {/* Quick 1-Click User Cycle Unlocker */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">1-Click User Cycle Unlock Tool</h4>
                  <p className="text-xs text-slate-500">Quickly unlock a specific member&apos;s daily earning cycle so they can claim again</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {users.slice(0, 9).map((u) => {
                  const lastClaim = u.lastProfitClaimDate || (u as any).lastEarningClaimAt || (u as any).lastDailyProfitClaim;
                  const isCycleReady = !lastClaim || (Date.now() - new Date(lastClaim).getTime()) >= 24 * 3600 * 1000;
                  const hoursLeft = lastClaim ? Math.max(1, Math.ceil(24 - (Date.now() - new Date(lastClaim).getTime()) / (3600 * 1000))) : 0;

                  return (
                    <div
                      key={u.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 text-xs truncate">@{u.username}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{u.phone || 'No phone'}</p>
                        </div>
                        {isCycleReady ? (
                          <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                            ⚡ Ready
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                            ⏳ ~{hoursLeft}h left
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          await resetUserDailyCycle(u.id);
                        }}
                        className="w-full min-h-[38px] py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Open 24h Cycle</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: PAYMENT GATEWAYS & CRYPTO NETWORKS */}
        {activeTab === 'gateways' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Deposit Gateways */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Deposit Payment Gateways</h3>
                  <p className="text-xs text-slate-500">Configure bank accounts, JazzCash, Easypaisa and USDT deposit addresses</p>
                </div>
                <button
                  onClick={() =>
                    setEditingGateway({
                      name: '',
                      accountTitle: '',
                      accountNumber: '',
                      instructions: '',
                      enabled: true,
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-peach-500 hover:bg-peach-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Gateway</span>
                </button>
              </div>

              {depositMethods.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
                  <p className="text-sm font-black text-slate-800">No Deposit Gateways Found</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No payment methods are currently active. Click &quot;Add Gateway&quot; above to create JazzCash, Easypaisa, or USDT TRC20 gateways.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {depositMethods.map((m) => (
                    <div key={m.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{m.name}</span>
                          {m.name.toLowerCase().includes('jazz') && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white">JazzCash</span>
                          )}
                          {m.name.toLowerCase().includes('easy') && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500 text-white">Easypaisa</span>
                          )}
                          {(m.name.toLowerCase().includes('usdt') || m.name.toLowerCase().includes('trc') || m.name.toLowerCase().includes('crypto')) && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-teal-600 text-white">USDT TRC20</span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            m.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {m.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            {m.name.toLowerCase().includes('usdt') || m.name.toLowerCase().includes('crypto') ? 'Vault / Account Title' : 'Account Title'}
                          </span>
                          <span className="font-bold text-slate-800">{m.accountTitle || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            {m.name.toLowerCase().includes('usdt') || m.name.toLowerCase().includes('crypto') ? 'USDT Wallet Address' : 'Deposit Number / Account'}
                          </span>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="font-mono font-black text-slate-900 text-xs bg-white px-2 py-1 rounded-lg border border-slate-200 select-all truncate max-w-[200px]">
                              {m.accountNumber}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(m.accountNumber);
                                addToast('Copied', `${m.name} address copied`, 'info');
                              }}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                              title="Copy number"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {m.minDeposit && (
                          <p className="text-[10px] text-slate-500">
                            <span className="font-bold">Min Deposit:</span> {m.minDeposit} KWD
                          </p>
                        )}
                        {m.instructions && (
                          <p className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60 leading-relaxed">
                            {m.instructions}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => updateDepositMethod(m.id, { enabled: !m.enabled })}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            m.enabled
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {m.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingGateway(m)}
                            className="p-1.5 rounded-lg bg-aqua-50 text-aqua-800 hover:bg-aqua-100 transition-colors cursor-pointer"
                            title="Edit Gateway"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmModal({
                                title: 'Delete Deposit Gateway',
                                message: `Permanently delete deposit gateway "${m.name}"? This will immediately remove it from user deposit and withdrawal options across all devices.`,
                                dangerText: 'Delete Gateway',
                                onConfirm: async () => {
                                  await deleteDepositMethod(m.id);
                                },
                              });
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Delete Gateway"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Withdrawal Crypto Networks */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Withdrawal Crypto Networks</h3>
                  <p className="text-xs text-slate-500">Allowed USDT blockchain withdrawal networks</p>
                </div>
                <button
                  onClick={() => setEditingNetwork({ name: '', enabled: true })}
                  className="px-3.5 py-2 rounded-xl bg-aqua-900 hover:bg-aqua-950 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Network</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {withdrawalNetworks.map((net) => (
                  <div key={net.id} className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">{net.name}</h5>
                      <span className="text-[10px] text-slate-400">
                        {net.enabled ? 'Available' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateWithdrawalNetwork(net.id, { enabled: !net.enabled })}
                        className={`text-xs font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                          net.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {net.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button
                        onClick={() => setEditingNetwork(net)}
                        className="p-1 rounded text-slate-400 hover:text-aqua-700 transition-colors cursor-pointer"
                        title="Edit Network"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setConfirmModal({
                            title: 'Delete Withdrawal Network',
                            message: `Delete withdrawal network "${net.name}"? Members will no longer be able to select this network for USDT payouts.`,
                            dangerText: 'Delete Network',
                            onConfirm: () => deleteWithdrawalNetwork(net.id),
                          });
                        }}
                        className="p-1 rounded text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Network"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: PLATFORM SETTINGS */}
        {activeTab === 'settings' && settingsForm && (
          <div className="max-w-2xl bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-lg font-black text-slate-900">Global Platform Parameters</h3>
              <p className="text-xs text-slate-500">Exchange rates, limits, commission rates and executive support links</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={settingsForm.currencySymbol}
                    onChange={(e) => updateSettingsField({ currencySymbol: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={settingsForm.currency}
                    onChange={(e) => updateSettingsField({ currency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deposit Rate (1 KWD = X PKR)</label>
                  <input
                    type="number"
                    value={settingsForm.depositRatePkr}
                    onChange={(e) => updateSettingsField({ depositRatePkr: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Withdrawal Rate (1 KWD = X PKR)</label>
                  <input
                    type="number"
                    value={settingsForm.withdrawalRatePkr}
                    onChange={(e) => updateSettingsField({ withdrawalRatePkr: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Deposit (KWD)</label>
                  <input
                    type="number"
                    value={settingsForm.minDepositKwd}
                    onChange={(e) => updateSettingsField({ minDepositKwd: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Deposit (KWD)</label>
                  <input
                    type="number"
                    value={settingsForm.maxDepositKwd || 5000}
                    onChange={(e) => updateSettingsField({ maxDepositKwd: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Withdrawal (KWD)</label>
                  <input
                    type="number"
                    value={settingsForm.minWithdrawalKwd}
                    onChange={(e) => updateSettingsField({ minWithdrawalKwd: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Withdrawal (KWD)</label>
                  <input
                    type="number"
                    value={settingsForm.maxWithdrawalKwd || 2000}
                    onChange={(e) => updateSettingsField({ maxWithdrawalKwd: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Withdrawal Fee (%)</label>
                <input
                  type="number"
                  value={settingsForm.withdrawalFeePercent}
                  onChange={(e) => updateSettingsField({ withdrawalFeePercent: parseFloat(e.target.value) || 0 })}
                  className="w-full sm:w-1/3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>

              {/* Referral Commission System Settings */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-black text-amber-950">Referral Commission Rate (%)</label>
                    <p className="text-[11px] text-amber-700/90">Percentage credited to the upliner when referred member invests</p>
                  </div>
                  <span className="text-sm font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-xl">
                    {settingsForm.referralCommissionPercent}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={settingsForm.referralCommissionPercent}
                    onChange={(e) => updateSettingsField({ referralCommissionPercent: parseFloat(e.target.value) || 0 })}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-black text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex gap-1">
                    {[5, 10, 15, 20].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => updateSettingsField({ referralCommissionPercent: preset })}
                        className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                          settingsForm.referralCommissionPercent === preset
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/60">
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">Commission Trigger Mode</label>
                  <select
                    value={settingsForm.referralCommissionMode || 'plan_activation'}
                    onChange={(e) => updateSettingsField({ referralCommissionMode: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-slate-800"
                  >
                    <option value="plan_activation">When Member Activates Investment Plan (Default & Recommended)</option>
                    <option value="deposit">When Member's Deposit is Verified & Approved by Admin</option>
                    <option value="both">Both (On Deposit Approval & Plan Activation)</option>
                  </select>
                  <span className="text-[10px] text-amber-700 mt-1 block">
                    Modifications update instantly in real-time for all active members and new signups.
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Support Links & Contact Numbers</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Mobile Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +92 300 1234567 or +965 9999 8888"
                      value={settingsForm.whatsappNumber || ''}
                      onChange={(e) => {
                        settingsFormDirtyRef.current = true;
                        const num = e.target.value;
                        const cleanNum = num.replace(/[^0-9]/g, '');
                        setSettingsForm({
                          ...settingsForm,
                          whatsappNumber: num,
                          whatsappUrl: settingsForm.whatsappUrl && !settingsForm.whatsappUrl.includes('wa.me')
                            ? settingsForm.whatsappUrl
                            : (cleanNum ? `https://wa.me/${cleanNum}` : settingsForm.whatsappUrl),
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Visible to all users under Customer Care</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Customer Care Helpline / Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +965 2200 1100"
                      value={settingsForm.supportPhone || ''}
                      onChange={(e) => {
                        settingsFormDirtyRef.current = true;
                        setSettingsForm({ ...settingsForm, supportPhone: e.target.value });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Direct phone helpline card on Support screen</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">WhatsApp URL</label>
                  <input
                    type="text"
                    value={settingsForm.whatsappUrl || ''}
                    onChange={(e) => {
                      settingsFormDirtyRef.current = true;
                      setSettingsForm({ ...settingsForm, whatsappUrl: e.target.value });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Telegram Support URL</label>
                  <input
                    type="text"
                    value={settingsForm.telegramUrl || ''}
                    onChange={(e) => {
                      settingsFormDirtyRef.current = true;
                      setSettingsForm({ ...settingsForm, telegramUrl: e.target.value });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Telegram Community Group URL</label>
                  <input
                    type="text"
                    value={settingsForm.telegramGroupUrl || ''}
                    onChange={(e) => {
                      settingsFormDirtyRef.current = true;
                      setSettingsForm({ ...settingsForm, telegramGroupUrl: e.target.value });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Support Email Address</label>
                  <input
                    type="email"
                    value={settingsForm.supportEmail || ''}
                    onChange={(e) => {
                      settingsFormDirtyRef.current = true;
                      setSettingsForm({ ...settingsForm, supportEmail: e.target.value });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Official support email displayed to all members</span>
                </div>
              </div>

              {/* Direct Deposit Numbers & Addresses */}
              <div className="space-y-3 pt-3 border-t border-slate-100 bg-slate-50/70 p-4 rounded-2xl border">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Deposit Numbers & Wallet Addresses (Quick Gateway Sync)
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Auto-Syncs Gateways
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Updating these numbers instantly synchronizes the Deposit modal for all users globally.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* JazzCash */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="text-[11px] font-black text-slate-800">JazzCash Account</div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Account Number / Mobile</label>
                      <input
                        type="text"
                        placeholder="e.g. 03001234567"
                        value={(settingsForm as any).jazzcashNumber || ''}
                        onChange={(e) => {
                          settingsFormDirtyRef.current = true;
                          setSettingsForm({ ...settingsForm, jazzcashNumber: e.target.value } as any);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Account Holder Name / Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Wealthera Official"
                        value={(settingsForm as any).jazzcashTitle || ''}
                        onChange={(e) => {
                          settingsFormDirtyRef.current = true;
                          setSettingsForm({ ...settingsForm, jazzcashTitle: e.target.value } as any);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Easypaisa */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="text-[11px] font-black text-slate-800">Easypaisa Account</div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Account Number / Mobile</label>
                      <input
                        type="text"
                        placeholder="e.g. 03451234567"
                        value={(settingsForm as any).easypaisaNumber || ''}
                        onChange={(e) => {
                          settingsFormDirtyRef.current = true;
                          setSettingsForm({ ...settingsForm, easypaisaNumber: e.target.value } as any);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Account Holder Name / Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Wealthera Official"
                        value={(settingsForm as any).easypaisaTitle || ''}
                        onChange={(e) => {
                          settingsFormDirtyRef.current = true;
                          setSettingsForm({ ...settingsForm, easypaisaTitle: e.target.value } as any);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* USDT TRC20 */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 sm:col-span-2">
                    <div className="text-[11px] font-black text-slate-800">USDT (TRC20) Crypto Gateway</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Wallet / Deposit Address</label>
                        <input
                          type="text"
                          placeholder="e.g. T..."
                          value={(settingsForm as any).usdtAddress || ''}
                          onChange={(e) => {
                            settingsFormDirtyRef.current = true;
                            setSettingsForm({ ...settingsForm, usdtAddress: e.target.value } as any);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Account Title / Network</label>
                        <input
                          type="text"
                          placeholder="e.g. Official Wealthera TRC20"
                          value={(settingsForm as any).usdtTitle || ''}
                          onChange={(e) => {
                            settingsFormDirtyRef.current = true;
                            setSettingsForm({ ...settingsForm, usdtTitle: e.target.value } as any);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-aqua-900 hover:bg-aqua-950 text-white font-black text-xs shadow-sm transition-all cursor-pointer"
                >
                  Save Platform Configuration
                </button>
                <button
                  type="button"
                  onClick={() => {
                    settingsFormDirtyRef.current = false;
                    if (settings) setSettingsForm(settings);
                    addToast('Reset to Live', 'Restored live values from database', 'info');
                  }}
                  className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Reset to Live Values
                </button>
              </div>
            </form>

            {/* Admin Security & Credentials Card */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Admin Security & Password</h3>
                <p className="text-xs text-slate-500">Update master administrator authentication credentials</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Admin Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentAdminPass ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={currentAdminPass}
                      onChange={(e) => setCurrentAdminPass(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentAdminPass(!showCurrentAdminPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Admin Password</label>
                    <div className="relative">
                      <input
                        type={showNewAdminPass ? 'text' : 'password'}
                        placeholder="Minimum 6 characters"
                        value={newAdminPass}
                        onChange={(e) => setNewAdminPass(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewAdminPass(!showNewAdminPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmAdminPass ? 'text' : 'password'}
                        placeholder="Repeat new password"
                        value={confirmAdminPass}
                        onChange={(e) => setConfirmAdminPass(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmAdminPass(!showConfirmAdminPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={changingPass}
                    onClick={async () => {
                      if (!currentAdminPass || !newAdminPass) {
                        addToast('Missing Fields', 'Please enter both current and new password', 'error');
                        return;
                      }
                      if (newAdminPass.length < 6) {
                        addToast('Weak Password', 'New password must be at least 6 characters long', 'error');
                        return;
                      }
                      if (newAdminPass !== confirmAdminPass) {
                        addToast('Mismatch', 'New password confirmation does not match', 'error');
                        return;
                      }
                      setChangingPass(true);
                      try {
                        await changeAdminPassword(currentAdminPass, newAdminPass);
                        addToast('Success', 'Admin password changed successfully', 'success');
                        setCurrentAdminPass('');
                        setNewAdminPass('');
                        setConfirmAdminPass('');
                      } catch (err: any) {
                        addToast('Password Change Failed', err.message || 'Failed to update password', 'error');
                      } finally {
                        setChangingPass(false);
                      }
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs shadow-sm transition-all cursor-pointer"
                  >
                    {changingPass ? 'Updating Credentials...' : 'Update Admin Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: BROADCAST NOTIFICATIONS & MANAGEMENT */}
        {activeTab === 'notifications' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in items-start">
            {/* Left: Broadcast Form */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Broadcast Notification</h3>
                <p className="text-xs text-slate-500">Dispatch push notices to all investors or target a specific user</p>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={broadcastTarget}
                    onChange={(e) => setBroadcastTarget(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  >
                    <option value="all">All Users Platform-Wide ({users.length} users)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        Single User: @{u.username} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notification Title</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. System Maintenance or New Investment Tier"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Message Body</label>
                  <textarea
                    rows={3}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Write message details..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notice Style</label>
                  <div className="flex gap-2">
                    {(['info', 'success', 'warning'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setBroadcastType(t)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                          broadcastType === t
                            ? 'bg-aqua-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-aqua-900 hover:bg-aqua-950 text-white font-black text-xs shadow-sm cursor-pointer"
                  >
                    Send Broadcast Notice
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Active Notices List & Delete / Clear All */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Active Notices ({notifications.length})</h3>
                  <p className="text-xs text-slate-500">Manage, review, and remove notices sent to users</p>
                </div>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    disabled={isClearingNotifs}
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to permanently clear all notifications for all users?')) {
                        setIsClearingNotifs(true);
                        try {
                          await clearAllNotifications();
                          addToast('Notices Cleared', 'All broadcast notifications have been deleted', 'success');
                        } catch (err: any) {
                          addToast('Error', err.message || 'Failed to clear notifications', 'error');
                        } finally {
                          setIsClearingNotifs(false);
                        }
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isClearingNotifs ? 'Clearing...' : 'Clear All'}
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Bell className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">No Active Notifications</p>
                  <p className="text-[11px] text-slate-400">Broadcast notices sent to investors will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {notifications.map((notif) => {
                    const targetUser = notif.userId ? users.find((u) => u.id === notif.userId) : null;
                    return (
                      <div
                        key={notif.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                notif.type === 'success'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : notif.type === 'warning'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-aqua-100 text-aqua-900'
                              }`}
                            >
                              {notif.type}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString()}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {notif.userId ? `@${targetUser?.username || 'user'}` : 'Platform-Wide'}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-slate-800 truncate">{notif.title}</h4>
                          <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">{notif.message}</p>
                        </div>
                        <button
                          type="button"
                          disabled={isDeletingNotifId === notif.id}
                          onClick={async () => {
                            setIsDeletingNotifId(notif.id);
                            try {
                              await deleteNotification(notif.id);
                              addToast('Notice Deleted', 'Notification removed successfully', 'success');
                            } catch (err: any) {
                              addToast('Error', err.message || 'Failed to delete notification', 'error');
                            } finally {
                              setIsDeletingNotifId(null);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 transition-colors cursor-pointer shrink-0"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 10: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <h3 className="text-base font-black text-slate-900">Administrative Audit Trail</h3>
              <p className="text-xs text-slate-500">Immutable ledger of all administrative interventions</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">No audit logs recorded yet.</div>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="p-4 flex items-start justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-aqua-800 font-mono">[{log.action}]</span>
                          <span className="font-bold text-slate-800">By @{log.adminUsername}</span>
                          {log.targetUsername && (
                            <span className="text-slate-500">→ Target: @{log.targetUsername}</span>
                          )}
                        </div>
                        <p className="text-slate-600 mt-1">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: HELP CENTER / CUSTOMER SUPPORT LINKS */}
        {activeTab === 'support' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header / Action Banner */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-base font-black text-slate-900">Help Center & Support Desk</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Manage live communication channels, official helplines, Telegram groups, and WhatsApp links shown in user Help Center.
                </p>
              </div>

              <button
                id="admin-add-support-link-btn"
                onClick={openNewSupportModal}
                className="px-4 py-2.5 rounded-2xl bg-peach-500 hover:bg-peach-600 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-peach-500/20 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Support Link</span>
              </button>
            </div>

            {/* Support Links Grid */}
            <div className="space-y-3">
              {(supportLinks || []).length === 0 ? (
                <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-peach-50 text-peach-600 flex items-center justify-center mx-auto">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Support Channels Configured</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Add Telegram, WhatsApp, phone, or email links to allow your users to connect with platform concierge.
                  </p>
                  <button
                    onClick={openNewSupportModal}
                    className="mt-2 px-4 py-2 rounded-xl bg-aqua-950 hover:bg-aqua-900 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Add First Channel
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(supportLinks || [])
                    .slice()
                    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`bg-white rounded-3xl p-5 border transition-all shadow-xs flex flex-col justify-between gap-4 ${
                          item.enabled !== false
                            ? 'border-slate-200/80 hover:border-slate-300'
                            : 'border-slate-200/60 bg-slate-50/60 opacity-75'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Top Row: Icon + Type + Status + Order */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-aqua-50 border border-aqua-100 flex items-center justify-center text-aqua-900 font-bold shrink-0">
                                {item.type === 'telegram' ? (
                                  <Send className="w-5 h-5 text-aqua-700" />
                                ) : item.type === 'telegram_group' ? (
                                  <Users className="w-5 h-5 text-aqua-800" />
                                ) : item.type === 'whatsapp' ? (
                                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                                ) : item.type === 'phone' ? (
                                  <Phone className="w-5 h-5 text-emerald-600" />
                                ) : item.type === 'email' ? (
                                  <Mail className="w-5 h-5 text-peach-500" />
                                ) : (
                                  <Headphones className="w-5 h-5 text-aqua-700" />
                                )}
                              </div>
                              <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-aqua-700 bg-aqua-50/80 px-2 py-0.5 rounded-md border border-aqua-200/50">
                                  {item.type.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] text-slate-400 ml-2 font-mono">
                                  Order #{item.order ?? 1}
                                </span>
                              </div>
                            </div>

                            {/* Enable/Disable Toggle Badge */}
                            <button
                              type="button"
                              onClick={() => handleToggleSupportLink(item)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-black border transition-all cursor-pointer ${
                                item.enabled !== false
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {item.enabled !== false ? 'Active in App' : 'Disabled'}
                            </button>
                          </div>

                          {/* Title & Badge */}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-slate-900">{item.title}</h4>
                              {item.badge && (
                                <span className="text-[10px] font-bold text-peach-700 bg-peach-50 border border-peach-200 px-2 py-0.5 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                            )}
                          </div>

                          {/* Value / Link Display */}
                          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-medium">Handle / Value:</span>
                              <span className="font-mono font-bold text-slate-700">{item.value}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/40">
                              <span className="text-slate-400 font-medium">Target URL:</span>
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-aqua-700 hover:underline truncate max-w-[200px] inline-flex items-center gap-1"
                              >
                                <span>{item.link}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => openEditSupportModal(item)}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setSupportToDelete(item)}
                            className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-rose-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Screenshot Proof Viewer */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900">Payment Receipt Screenshot</h4>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-100">
              <img src={selectedProofUrl} alt="Receipt Proof" className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Rejection Reason */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="font-black text-sm text-slate-900">
              Confirm Rejection ({rejectModal.type.toUpperCase()})
            </h4>
            <p className="text-xs text-slate-500">
              Provide an optional explanation to the user explaining why this request could not be verified.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['Invalid TID', 'Amount not received in account', 'Incorrect account number / title', 'Duplicate TID request', 'Screenshot unreadable'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRejectReason(preset)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid TID, receipt screenshot unreadable, or incorrect amount"
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-rose-400"
            ></textarea>
            <div className="flex gap-2">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Adjust User Balance */}
      {balanceAdjustUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div>
              <h4 className="font-black text-sm text-slate-900">
                Adjust Balance for @{balanceAdjustUser.username}
              </h4>
              <p className="text-xs text-slate-500">Current Balance: {Number(balanceAdjustUser.balance || 0).toFixed(2)} KWD</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBalanceAdjustType('add')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  balanceAdjustType === 'add' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                + Add Balance
              </button>
              <button
                type="button"
                onClick={() => setBalanceAdjustType('deduct')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  balanceAdjustType === 'deduct' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                - Deduct Balance
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount (KWD)</label>
              <input
                type="number"
                step="any"
                value={balanceAdjustAmount}
                onChange={(e) => setBalanceAdjustAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Audit Reason / Note *</label>
              <input
                type="text"
                value={balanceAdjustReason}
                onChange={(e) => setBalanceAdjustReason(e.target.value)}
                placeholder="Reason for administrative ledger correction"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setBalanceAdjustUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBalanceAdjust}
                className="flex-1 py-2.5 rounded-xl bg-aqua-900 hover:bg-aqua-950 text-white text-xs font-bold"
              >
                Confirm Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Direct Password Reset */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900">
                    Direct Password Reset for @{resetPasswordUser.username}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Set a new password directly without old credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetPasswordUser(null);
                  setNewPassword('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">User Account Details</span>
                <span className="font-bold text-slate-800">
                  {resetPasswordUser.fullName ? `${resetPasswordUser.fullName} • ` : ''}
                  {resetPasswordUser.phone || resetPasswordUser.email}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-aqua-100 text-aqua-900 capitalize">
                {resetPasswordUser.status}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">New Password (min 6 characters)</label>
                <button
                  type="button"
                  onClick={() => {
                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
                    let gen = '';
                    for (let i = 0; i < 10; i++) {
                      gen += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    setNewPassword(gen);
                    setShowResetUserPass(true);
                  }}
                  className="text-[11px] font-bold text-aqua-700 hover:text-aqua-900 flex items-center gap-1 cursor-pointer"
                >
                  <Shuffle className="w-3 h-3" /> Auto-Generate
                </button>
              </div>
              <div className="relative">
                <input
                  type={showResetUserPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new secure password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {newPassword && (
                    <button
                      type="button"
                      title="Copy Password"
                      onClick={() => {
                        navigator.clipboard?.writeText(newPassword);
                        addToast('Copied', 'Password copied to clipboard', 'info');
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowResetUserPass(!showResetUserPass)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
                  >
                    {showResetUserPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setResetPasswordUser(null);
                  setNewPassword('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPasswordReset}
                className="flex-1 py-2.5 rounded-xl bg-aqua-900 hover:bg-aqua-950 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Save New Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit User Details */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8 border border-slate-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-aqua-100 text-aqua-900 flex items-center justify-center font-bold text-base shadow-2xs">
                  {editingUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900">
                    Edit User Profile: @{editingUser.username}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">ID: {editingUser.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Registered Phone & Email - HIGHLIGHTED BOX */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-emerald-800 font-black text-[11px] uppercase tracking-wider">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Registered Contact Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Registered Mobile Number <span className="text-emerald-700">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="tel"
                        value={editingUser.phone}
                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                        placeholder="e.g. 030384899975"
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Used for user login & WhatsApp contact</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Registered Email <span className="text-emerald-700">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        placeholder="user@gmail.com"
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Primary email address for login/alerts</span>
                  </div>
                </div>
              </div>

              {/* Identity Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingUser.fullName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                    placeholder="Full Display Name"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Financial Balance & Account Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Wallet Balance (KWD)
                  </label>
                  <div className="relative">
                    <Wallet className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingUserBalance}
                      onChange={(e) => setEditingUserBalance(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-black text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Directly change user account balance</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                  >
                    <option value="active">Active (Full Access)</option>
                    <option value="suspended">Suspended (Temporary)</option>
                    <option value="blocked">Blocked (Security Lockout)</option>
                    <option value="banned">Banned (Permanent)</option>
                  </select>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Control login & withdrawal rights</span>
                </div>
              </div>

              {/* Assigned Investment Plan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Active Investment Plan
                </label>
                <select
                  value={editingUser.activePlanId || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, activePlanId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                >
                  <option value="">None (No Active Plan)</option>
                  {(plans || []).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.amount} KWD - {p.dailyProfit} KWD/day - {p.durationDays || 45}d)
                    </option>
                  ))}
                </select>
                <span className="text-[9px] text-slate-500 block mt-0.5">Assign or change user's active investment plan directly</span>
              </div>

              {/* 24-Hour Daily Earning Cycle Unlock Control */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 font-black text-[11px] uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>24-Hour Daily Earning Cycle</span>
                  </div>
                  {(() => {
                    const lastClaim = editingUser.lastProfitClaimDate || (editingUser as any).lastEarningClaimAt || (editingUser as any).lastDailyProfitClaim;
                    const isReady = !lastClaim || (Date.now() - new Date(lastClaim).getTime()) >= 24 * 3600 * 1000;
                    return isReady ? (
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ⚡ Ready to Claim
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                        ⏳ 24h Cooldown Active
                      </span>
                    );
                  })()}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Unlock this user&apos;s daily earning cycle so they can immediately click &quot;Run Cycle Now&quot; on their dashboard and collect dividends without waiting 24 hours.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await resetUserDailyCycle(editingUser.id);
                    setEditingUser({
                      ...editingUser,
                      lastProfitClaimDate: undefined,
                      lastEarningClaimAt: undefined,
                      lastDailyProfitClaim: undefined,
                    } as any);
                  }}
                  className="w-full min-h-[42px] py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>⚡ Unlock / Open 24h Cycle Now</span>
                </button>
              </div>

              {/* Direct Password Reset */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">
                  Change Password (Optional)
                </label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    value={editingUserNewPassword}
                    onChange={(e) => setEditingUserNewPassword(e.target.value)}
                    placeholder="Leave empty to keep current password, or enter 6+ chars to change"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Referral Info & Sponsor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Referral Code</label>
                  <input
                    type="text"
                    value={editingUser.referralCode || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, referralCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Referred By Sponsor</label>
                  <input
                    type="text"
                    value={editingUser.referredBy || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, referredBy: e.target.value })}
                    placeholder="None (Direct Registration)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Lockout reset if any */}
              {(editingUser.failedLoginAttempts > 0 || editingUser.lockedUntil) && (
                <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                  <div>
                    <p className="font-bold text-[11px]">Security Lockout Active</p>
                    <p className="text-[10px] text-amber-700">Failed attempts: {editingUser.failedLoginAttempts}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser({
                        ...editingUser,
                        failedLoginAttempts: 0,
                        lockedUntil: null,
                        status: 'active',
                      });
                      addToast('Lockout Cleared', 'Failed attempts reset to 0 and status set to Active', 'info');
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] transition-colors"
                  >
                    Reset & Unlock
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingUser}
                onClick={async () => {
                  if (!editingUser.username || !editingUser.username.trim()) {
                    addToast('Validation Error', 'Username is required', 'error');
                    return;
                  }
                  if (!editingUser.email || !editingUser.email.trim()) {
                    addToast('Validation Error', 'Email address is required', 'error');
                    return;
                  }
                  if (!editingUser.phone || !editingUser.phone.trim()) {
                    addToast('Validation Error', 'Registered phone number is required', 'error');
                    return;
                  }
                  if (editingUserNewPassword.trim() && editingUserNewPassword.trim().length < 6) {
                    addToast('Validation Error', 'New password must be at least 6 characters', 'error');
                    return;
                  }

                  setIsSavingUser(true);
                  try {
                    await updateUserByAdmin(editingUser.id, {
                      username: editingUser.username.trim(),
                      fullName: editingUser.fullName ? editingUser.fullName.trim() : '',
                      email: editingUser.email.trim(),
                      phone: editingUser.phone.trim(),
                      mobile: editingUser.phone.trim(),
                      status: editingUser.status,
                      balance: !isNaN(Number(editingUserBalance)) ? Number(editingUserBalance) : editingUser.balance,
                      referralCode: editingUser.referralCode ? editingUser.referralCode.trim() : undefined,
                      referredBy: editingUser.referredBy !== undefined ? (editingUser.referredBy ? editingUser.referredBy.trim() : null) : undefined,
                      failedLoginAttempts: editingUser.failedLoginAttempts,
                      lockedUntil: editingUser.lockedUntil,
                      activePlanId: editingUser.activePlanId !== undefined ? editingUser.activePlanId : undefined,
                      password: editingUserNewPassword.trim() || undefined,
                    });
                    setEditingUser(null);
                    setEditingUserNewPassword('');
                    addToast('User Updated', `Changes for @${editingUser.username} saved and synchronized successfully`, 'success');
                  } catch (err: any) {
                    addToast('Update Failed', err.message, 'error');
                  } finally {
                    setIsSavingUser(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-aqua-900 hover:bg-aqua-950 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                {isSavingUser ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <span>Save All Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Plan Edit/Create */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-base text-slate-900">
                {editingPlan.id ? 'Edit Investment Plan' : 'Create Investment Plan'}
              </h4>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  value={editingPlan.name || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  placeholder="e.g. Starter Yield Plan"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:bg-white focus:border-aqua-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (KWD)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingPlan.amount ?? ''}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, amount: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="30"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-aqua-950 focus:bg-white focus:border-aqua-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Daily Profit (KWD)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingPlan.dailyProfit ?? ''}
                    onChange={(e) => {
                      const dp = parseFloat(e.target.value) || 0;
                      const dur = editingPlan.durationDays || 45;
                      setEditingPlan({
                        ...editingPlan,
                        dailyProfit: dp,
                        totalProfit: Math.round(dp * dur * 100) / 100,
                      });
                    }}
                    placeholder="1.20"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-peach-600 focus:bg-white focus:border-aqua-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={editingPlan.durationDays ?? 45}
                    onChange={(e) => {
                      const dur = parseInt(e.target.value) || 45;
                      const dp = editingPlan.dailyProfit || 0;
                      setEditingPlan({
                        ...editingPlan,
                        durationDays: dur,
                        totalProfit: Math.round(dp * dur * 100) / 100,
                      });
                    }}
                    placeholder="45"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:border-aqua-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Profit (KWD)</label>
                  <input
                    type="number"
                    step="any"
                    value={
                      editingPlan.totalProfit ??
                      Math.round(
                        (editingPlan.dailyProfit || 0) * (editingPlan.durationDays || 45) * 100
                      ) / 100
                    }
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        totalProfit: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="54"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-aqua-800 focus:bg-white focus:border-aqua-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Plan Status</label>
                <select
                  value={editingPlan.status || 'active'}
                  onChange={(e) => setEditingPlan({ ...editingPlan, status: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:border-aqua-600 outline-none"
                >
                  <option value="active">Active (Visible to users)</option>
                  <option value="disabled">Disabled (Hidden from users)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingPlan(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!editingPlan.name || !editingPlan.amount) {
                      addToast('Validation Error', 'Please enter Plan Name and Amount', 'error');
                      return;
                    }
                    const totalProfit =
                      editingPlan.totalProfit ??
                      Math.round(
                        (editingPlan.dailyProfit || 0) * (editingPlan.durationDays || 45) * 100
                      ) / 100;
                    const payload = {
                      ...editingPlan,
                      totalProfit,
                      status: editingPlan.status || 'active',
                    };
                    if (editingPlan.id) {
                      await updatePlan(editingPlan.id, payload);
                    } else {
                      await createPlan(payload);
                    }
                    setEditingPlan(null);
                  } catch (err: any) {
                    addToast('Plan Save Failed', err.message, 'error');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-peach-500 hover:bg-peach-600 text-white text-xs font-black transition-colors shadow-sm"
              >
                {editingPlan.id ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Gateway Edit/Create (JazzCash, EasyPaisa, USDT, etc.) */}
      {editingGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-sm text-slate-900">
                {editingGateway.id ? 'Edit Deposit Gateway' : 'Add Deposit Gateway'}
              </h4>
              <button
                onClick={() => setEditingGateway(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets Quick Fill */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">Quick Fill Template:</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setEditingGateway({
                      ...editingGateway,
                      name: 'JazzCash',
                      instructions: 'Send PKR to this JazzCash mobile account and enter the 12-digit TID from SMS.',
                    })
                  }
                  className="py-1 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-black"
                >
                  JazzCash
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingGateway({
                      ...editingGateway,
                      name: 'Easypaisa',
                      instructions: 'Send PKR to this Easypaisa mobile account and enter the TRX/TID ID.',
                    })
                  }
                  className="py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-[11px] font-black"
                >
                  Easypaisa
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingGateway({
                      ...editingGateway,
                      name: 'USDT (TRC20)',
                      instructions: 'Transfer USDT TRC20 to this wallet address and upload transaction hash / proof.',
                    })
                  }
                  className="py-1 px-2 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 text-[11px] font-black"
                >
                  USDT TRC20
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gateway Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingGateway.name || ''}
                  onChange={(e) => setEditingGateway({ ...editingGateway, name: e.target.value })}
                  placeholder="e.g. JazzCash, Easypaisa, or USDT TRC20"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:border-aqua-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Title / Receiver Name
                </label>
                <input
                  type="text"
                  value={editingGateway.accountTitle || ''}
                  onChange={(e) => setEditingGateway({ ...editingGateway, accountTitle: e.target.value })}
                  placeholder="e.g. Muhammad Ali (JazzCash Verified)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:border-aqua-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deposit / Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingGateway.accountNumber || ''}
                  onChange={(e) => setEditingGateway({ ...editingGateway, accountNumber: e.target.value })}
                  placeholder="03XXXXXXXXX or USDT TRC20 Address"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-black text-slate-900 focus:bg-white focus:border-aqua-600 outline-none select-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Deposit (KWD)</label>
                <input
                  type="number"
                  step="any"
                  value={editingGateway.minDeposit ?? 30}
                  onChange={(e) => setEditingGateway({ ...editingGateway, minDeposit: parseFloat(e.target.value) || 0 })}
                  placeholder="30"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-aqua-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions for User</label>
                <textarea
                  rows={2}
                  value={editingGateway.instructions || ''}
                  onChange={(e) => setEditingGateway({ ...editingGateway, instructions: e.target.value })}
                  placeholder="e.g. Send PKR via JazzCash app and enter Transaction ID (TID)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-aqua-600 outline-none"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="gateway-enabled-chk"
                  checked={editingGateway.enabled ?? true}
                  onChange={(e) => setEditingGateway({ ...editingGateway, enabled: e.target.checked })}
                  className="rounded text-aqua-600 focus:ring-aqua-500"
                />
                <label htmlFor="gateway-enabled-chk" className="text-xs font-bold text-slate-700">
                  Enable this gateway for user deposits
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingGateway(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!editingGateway.name?.trim() || !editingGateway.accountNumber?.trim()) {
                      addToast('Required Fields', 'Please enter Gateway Name and Deposit Number', 'error');
                      return;
                    }
                    if (editingGateway.id) {
                      await updateDepositMethod(editingGateway.id, editingGateway);
                    } else {
                      await createDepositMethod(editingGateway);
                    }
                    setEditingGateway(null);
                  } catch (err: any) {
                    addToast('Gateway Save Failed', err.message, 'error');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-aqua-900 hover:bg-aqua-950 text-white text-xs font-bold shadow-sm transition-colors"
              >
                Save Gateway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Withdrawal Network Edit/Create */}
      {editingNetwork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-sm text-slate-900">
                {editingNetwork.id ? 'Edit Crypto Network' : 'Add Crypto Network'}
              </h4>
              <button
                onClick={() => setEditingNetwork(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Network Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingNetwork.name || ''}
                  onChange={(e) => setEditingNetwork({ ...editingNetwork, name: e.target.value })}
                  placeholder="e.g. TRC20, BEP20, Polygon, Solana"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:border-aqua-600 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="network-enabled-chk"
                  checked={editingNetwork.enabled ?? true}
                  onChange={(e) => setEditingNetwork({ ...editingNetwork, enabled: e.target.checked })}
                  className="rounded text-aqua-600 focus:ring-aqua-500"
                />
                <label htmlFor="network-enabled-chk" className="text-xs font-bold text-slate-700">
                  Allow users to select this network for withdrawals
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingNetwork(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!editingNetwork.name?.trim()) {
                      addToast('Validation', 'Please enter Network Name', 'error');
                      return;
                    }
                    if (editingNetwork.id) {
                      await updateWithdrawalNetwork(editingNetwork.id, editingNetwork);
                    } else {
                      await createWithdrawalNetwork(editingNetwork);
                    }
                    setEditingNetwork(null);
                  } catch (err: any) {
                    addToast('Network Save Failed', err.message, 'error');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-aqua-900 hover:bg-aqua-950 text-white text-xs font-bold shadow-sm transition-colors"
              >
                Save Network
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete User Confirmation */}
      {/* Action / Delete Confirmation In-App Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-slate-900">{confirmModal.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await action();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-colors shadow-sm cursor-pointer"
              >
                {confirmModal.dangerText || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-black text-base text-slate-900">Permanently Delete User?</h4>
              <p className="text-xs text-slate-500">
                You are about to delete user <span className="font-extrabold text-slate-800">@{userToDelete.username}</span>.
              </p>
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-[11px] text-rose-700 text-left mt-2">
                <strong>Permanent Removal:</strong> This will cascade and delete all associated records (deposit requests, investments, withdrawals, transactions, and notifications) for this user.
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                disabled={isDeletingUser}
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeletingUser}
                onClick={handleConfirmDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingUser ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create / Edit Help Center Support Link */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-peach-50 text-peach-600 flex items-center justify-center font-bold">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900">
                    {editingSupportLink ? 'Edit Support Link' : 'Add Support Link'}
                  </h4>
                  <p className="text-[11px] text-slate-500">Global Customer Help Center Channel</p>
                </div>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupportLink} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Channel Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Official Telegram Support"
                  value={supportForm.title}
                  onChange={(e) => setSupportForm({ ...supportForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Channel Type / Category</label>
                  <select
                    value={supportForm.type}
                    onChange={(e) => setSupportForm({ ...supportForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-aqua-500 focus:outline-none bg-white"
                  >
                    <option value="telegram">Telegram (1-on-1)</option>
                    <option value="telegram_group">Telegram Community</option>
                    <option value="whatsapp">WhatsApp Business</option>
                    <option value="phone">Phone Helpline</option>
                    <option value="email">Email Concierge</option>
                    <option value="other">Other Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={supportForm.order}
                    onChange={(e) => setSupportForm({ ...supportForm, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Destination URL / Action Link *</label>
                  <span className="text-[10px] text-slate-400 font-medium">Auto-formatted for user clicks</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder={
                    supportForm.type === 'email'
                      ? 'e.g. support@example.com or mailto:support@example.com'
                      : supportForm.type === 'phone'
                      ? 'e.g. +96599887766 or tel:+96599887766'
                      : supportForm.type === 'whatsapp'
                      ? 'e.g. +96599887766 or https://wa.me/96599887766'
                      : supportForm.type === 'telegram' || supportForm.type === 'telegram_group'
                      ? 'e.g. @HelpDesk or https://t.me/yourgroup'
                      : 'https://...'
                  }
                  value={supportForm.link}
                  onChange={(e) => setSupportForm({ ...supportForm, link: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-aqua-500 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Users who click will directly open their email client, phone dialer, WhatsApp chat, or Telegram group.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Display Handle / Contact Value</label>
                <input
                  type="text"
                  placeholder="e.g. @WealtheraVIP or +965 9988 7766"
                  value={supportForm.value}
                  onChange={(e) => setSupportForm({ ...supportForm, value: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Badge Tag (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 24/7 Live, VIP"
                    value={supportForm.badge}
                    onChange={(e) => setSupportForm({ ...supportForm, badge: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={supportForm.enabled}
                      onChange={(e) => setSupportForm({ ...supportForm, enabled: e.target.checked })}
                      className="rounded text-peach-500 focus:ring-peach-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-700">Active in User App</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Brief helper guidance displayed under channel title"
                  value={supportForm.description}
                  onChange={(e) => setSupportForm({ ...supportForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-aqua-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={supportSaving}
                  className="flex-1 py-2.5 rounded-xl bg-peach-500 hover:bg-peach-600 text-white text-xs font-black shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {supportSaving ? 'Saving...' : editingSupportLink ? 'Update Channel' : 'Publish Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Support Link Confirmation */}
      {supportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-black text-base text-slate-900">Remove Support Channel?</h4>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove <span className="font-bold text-slate-800">"{supportToDelete.title}"</span>?
              </p>
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-[11px] text-rose-700 text-left mt-2">
                This channel will immediately be removed from all customer apps globally.
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                disabled={supportDeleting}
                onClick={() => setSupportToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={supportDeleting}
                onClick={handleConfirmDeleteSupport}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {supportDeleting ? 'Removing...' : 'Delete Channel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create New User Account by Admin */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-aqua-50 text-aqua-800 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900">Create New Investor Account</h4>
                  <p className="text-[11px] text-slate-500">Manually provision a user profile with credentials & balance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {addUserError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{addUserError}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAddUserError(null);
                if (!newUserData.username.trim()) {
                  setAddUserError('Username is required.');
                  return;
                }
                if (!newUserData.email.trim()) {
                  setAddUserError('Email address is required.');
                  return;
                }
                if (!newUserData.phone.trim()) {
                  setAddUserError('Phone number is required.');
                  return;
                }
                if (!newUserData.password || newUserData.password.length < 6) {
                  setAddUserError('Password must be at least 6 characters.');
                  return;
                }

                setIsCreatingUser(true);
                try {
                  await createUserByAdmin({
                    username: newUserData.username.trim(),
                    fullName: newUserData.fullName.trim() || undefined,
                    email: newUserData.email.trim(),
                    phone: newUserData.phone.trim(),
                    password: newUserData.password,
                    balance: newUserData.balance ? parseFloat(newUserData.balance) : 0,
                    assignedPlanId: newUserData.assignedPlanId || undefined,
                    status: newUserData.status,
                    referredBy: newUserData.referredBy.trim() || undefined,
                  });
                  addToast('User Created', `Account @${newUserData.username} created successfully!`, 'success');
                  setShowAddUserModal(false);
                } catch (err: any) {
                  setAddUserError(err.message || 'Failed to create user account');
                } finally {
                  setIsCreatingUser(false);
                }
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. farhan_trader"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Farhan Al-Ahmad"
                    value={newUserData.fullName}
                    onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+92 300 1234567"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Login Password * (Min 6 chars)</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Initial Balance (KWD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newUserData.balance}
                    onChange={(e) => setNewUserData({ ...newUserData, balance: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-aqua-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assign Investment Plan</label>
                  <select
                    value={newUserData.assignedPlanId}
                    onChange={(e) => setNewUserData({ ...newUserData, assignedPlanId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                  >
                    <option value="">No Active Plan</option>
                    {contextPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.amount || 0} KWD)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Account Status</label>
                  <select
                    value={newUserData.status}
                    onChange={(e) => setNewUserData({ ...newUserData, status: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                  >
                    <option value="active">Active (Full Access)</option>
                    <option value="suspended">Suspended (Restricted)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Referred By (Optional Sponsor Username / Code)</label>
                <input
                  type="text"
                  placeholder="e.g. admin or username"
                  value={newUserData.referredBy}
                  onChange={(e) => setNewUserData({ ...newUserData, referredBy: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="flex-1 py-2.5 rounded-xl bg-aqua-900 hover:bg-aqua-950 text-white text-xs font-black shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingUser ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Manual Ledger Transaction */}
      {showAddTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-aqua-50 text-aqua-800 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900">Record Ledger Transaction</h4>
                  <p className="text-[11px] text-slate-500">Insert an audited financial entry directly into the live ledger</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTxModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {addTxError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{addTxError}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAddTxError(null);
                if (!newTxData.userId) {
                  setAddTxError('Please select a target user.');
                  return;
                }
                const amt = parseFloat(newTxData.amount);
                if (isNaN(amt) || amt === 0) {
                  setAddTxError('Please enter a valid non-zero amount.');
                  return;
                }

                setIsCreatingTx(true);
                try {
                  await createTransactionByAdmin({
                    userId: newTxData.userId,
                    amount: amt,
                    type: newTxData.type,
                    description: newTxData.description.trim() || undefined,
                    status: newTxData.status,
                  });
                  addToast('Transaction Added', 'Manual ledger entry created successfully!', 'success');
                  setShowAddTxModal(false);
                } catch (err: any) {
                  setAddTxError(err.message || 'Failed to record transaction');
                } finally {
                  setIsCreatingTx(false);
                }
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Investor *</label>
                <select
                  value={newTxData.userId}
                  onChange={(e) => setNewTxData({ ...newTxData, userId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                  required
                >
                  <option value="">-- Choose User --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      @{u.username} ({u.email}) - Bal: {u.balance.toFixed(2)} KWD
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Type *</label>
                  <select
                    value={newTxData.type}
                    onChange={(e) => setNewTxData({ ...newTxData, type: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                  >
                    <option value="balance_adjustment">Balance Adjustment</option>
                    <option value="deposit">Deposit Credit</option>
                    <option value="withdrawal">Withdrawal Debit</option>
                    <option value="daily_profit">Daily Dividend Profit</option>
                    <option value="referral_commission">Referral Commission</option>
                    <option value="plan_activation">Plan Activation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Amount (KWD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 50.00 or -25.00"
                    value={newTxData.amount}
                    onChange={(e) => setNewTxData({ ...newTxData, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-aqua-500 focus:outline-none font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description / Memo</label>
                <input
                  type="text"
                  placeholder="e.g. Manual ledger compensation or correction"
                  value={newTxData.description}
                  onChange={(e) => setNewTxData({ ...newTxData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Transaction Status</label>
                <select
                  value={newTxData.status}
                  onChange={(e) => setNewTxData({ ...newTxData, status: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                >
                  <option value="completed">Completed (Applied to balance if adjustment)</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTxModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTx}
                  className="flex-1 py-2.5 rounded-xl bg-aqua-900 hover:bg-aqua-950 text-white text-xs font-black shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingTx ? 'Recording Entry...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Transaction Confirmation */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-black text-base text-slate-900">Delete Ledger Record?</h4>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete transaction <span className="font-mono font-bold text-slate-800">{txToDelete.referenceId}</span>?
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-[11px] text-slate-700 text-left mt-2 space-y-1">
                <div><strong>User:</strong> @{txToDelete.username || 'user'}</div>
                <div><strong>Amount:</strong> {txToDelete.amount} KWD</div>
                <div><strong>Type:</strong> {txToDelete.type}</div>
                <div className="text-rose-600 font-bold pt-1 border-t border-slate-200">
                  This transaction will be purged from ledger and user activity logs.
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                disabled={isDeletingTx}
                onClick={() => setTxToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeletingTx}
                onClick={async () => {
                  setIsDeletingTx(true);
                  try {
                    await deleteTransaction(txToDelete.id);
                    addToast('Deleted', 'Ledger record removed successfully', 'success');
                    setTxToDelete(null);
                  } catch (err: any) {
                    addToast('Error', err.message || 'Failed to delete transaction', 'error');
                  } finally {
                    setIsDeletingTx(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingTx ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
