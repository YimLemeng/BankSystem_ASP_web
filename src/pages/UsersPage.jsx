import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Search,
  RotateCcw,
  Eye,
  Copy,
  Check,
  Filter,
  UserCog,
  Smartphone,
  Mail,
  Calendar,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useLoading } from '../context/LoadingContext';
import { userService } from '../services/api';
import Modal from '../components/Modal';

export default function UsersPage() {
  const { t } = useLanguage();
  const { showLoading } = useLoading();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // View User Profile Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const fetchUsers = async (isManual = false) => {
    if (isManual) {
      showLoading('Refreshing System Users...', 'Retrieving staff and administrative accounts...', 600);
    }
    setIsLoading(true);
    try {
      const res = await userService.getAll();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch system users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenViewModal = (user) => {
    showLoading('Loading User Profile...', 'Fetching user credentials and permissions...', 250);
    setSelectedUser(user);
    setIsViewModalOpen(true);
    setCopiedId(false);
  };

  const handleCopyId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Helper for Role representation
  const formatRole = (role) => {
    if (role === 'Admin' || role === 2) return 'Admin';
    if (role === 'Teller' || role === 1) return 'Teller';
    return role || 'Staff';
  };

  const formatStatus = (status) => {
    if (status === 'Active' || status === 1) return 'Active';
    if (status === 'Inactive' || status === 2) return 'Inactive';
    if (status === 'Suspended' || status === 3) return 'Suspended';
    if (status === 'LockedOut' || status === 4) return 'LockedOut';
    return status || 'Active';
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const roleStr = formatRole(u.role).toLowerCase();
    const statusStr = formatStatus(u.status).toLowerCase();

    if (roleFilter && roleStr !== roleFilter.toLowerCase()) return false;
    if (statusFilter && statusStr !== statusFilter.toLowerCase()) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phoneNumber && u.phoneNumber.toLowerCase().includes(q))
    );
  });

  // Analytics Stats
  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => formatRole(u.role) === 'Admin').length;
  const totalTellers = users.filter((u) => formatRole(u.role) === 'Teller').length;
  const total2FA = users.filter((u) => u.totpEnabled).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white font-sans">
              {t('users.title') || 'System User Directory'}
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {t('users.adminOnlyBadge') || 'Admin Restricted'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t('users.subtitle') || 'Review registered staff, teller accounts, and administrative roles'}
          </p>
        </div>

        <button
          onClick={() => fetchUsers(true)}
          disabled={isLoading}
          className="self-start sm:self-auto py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>{t('users.refresh') || 'Refresh'}</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('users.totalUsers') || 'Total Users'}
            </div>
            <div className="text-2xl font-black text-white mt-1 font-mono">{totalUsers}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Core System Accounts</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('users.totalAdmins') || 'Administrators'}
            </div>
            <div className="text-2xl font-black text-purple-400 mt-1 font-mono">{totalAdmins}</div>
            <div className="text-[10px] text-purple-400/70 mt-0.5">Full System Access</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
            <UserCog className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('users.totalTellers') || 'Tellers'}
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{totalTellers}</div>
            <div className="text-[10px] text-amber-400/70 mt-0.5">Front Desk Operations</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('users.totpProtected') || '2FA Protected'}
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{total2FA}</div>
            <div className="text-[10px] text-emerald-400/70 mt-0.5">Google Authenticator</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('users.searchPlaceholder') || 'Search by username, full name, or email...'}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter:</span>
          </div>

          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                showLoading(
                  e.target.value ? `Filtering ${e.target.value}s...` : 'Showing All Roles...',
                  'Filtering user directory by role...',
                  250
                );
              }}
              className="appearance-none py-2 pl-3.5 pr-8 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm hover:border-slate-600 transition-colors font-medium"
            >
              <option value="">{t('users.allRoles') || 'All Roles'}</option>
              <option value="Admin">Admin</option>
              <option value="Teller">Teller</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-emerald-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                showLoading(
                  e.target.value ? `Filtering ${e.target.value}...` : 'Showing All Statuses...',
                  'Filtering user directory by status...',
                  250
                );
              }}
              className="appearance-none py-2 pl-3.5 pr-8 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm hover:border-slate-600 transition-colors font-medium"
            >
              <option value="">{t('users.allStatuses') || 'All Statuses'}</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-emerald-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">{t('users.nameAndUsername') || 'User & Username'}</th>
                <th className="py-3 px-4">{t('users.email') || 'Email'}</th>
                <th className="py-3 px-4">{t('users.role') || 'Role'}</th>
                <th className="py-3 px-4">{t('users.security2fa') || 'Security (2FA)'}</th>
                <th className="py-3 px-4">{t('users.status') || 'Status'}</th>
                <th className="py-3 px-4">{t('users.createdAt') || 'Registered At'}</th>
                <th className="py-3 px-4 text-right">{t('users.actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RotateCcw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Loading user directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    {t('users.noUsers') || 'No users found matching your search.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleName = formatRole(u.role);
                  const statusName = formatStatus(u.status);
                  const isAdmin = roleName === 'Admin';

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                              isAdmin
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {(u.fullName || u.username || 'U')[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">{u.fullName || '—'}</div>
                            <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                        {u.email || '—'}
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isAdmin
                              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isAdmin ? <UserCog className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          <span>{roleName}</span>
                        </span>
                      </td>

                      {/* 2FA Status */}
                      <td className="py-3 px-4">
                        {u.totpEnabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Enabled</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            <Lock className="w-3 h-3" />
                            <span>Password only</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            statusName === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {statusName}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '—'}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenViewModal(u)}
                          className="py-1 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                          title="View user details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t('users.viewDetails') || 'View'}</span>
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

      {/* VIEW USER DETAILS MODAL (Read-Only Form for Admin View) */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={t('users.modalTitle') || 'User Profile Form (View Only)'}
        maxWidth="max-w-lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base uppercase shrink-0 ${
                    formatRole(selectedUser.role) === 'Admin'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {(selectedUser.fullName || selectedUser.username || 'U')[0]}
                </div>
                <div>
                  <div className="font-bold text-white text-base">{selectedUser.fullName || '—'}</div>
                  <div className="text-xs text-slate-400 font-mono">@{selectedUser.username}</div>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                    formatRole(selectedUser.role) === 'Admin'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {formatRole(selectedUser.role)}
                </span>
              </div>
            </div>

            {/* Read-Only Form Fields */}
            <div className="space-y-3 text-xs">
              {/* User UUID */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  {t('users.userId') || 'User ID (UUID)'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedUser.id || ''}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyId(selectedUser.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    title="Copy UUID"
                  >
                    {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Grid 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    {t('users.fullName') || 'Full Name'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={selectedUser.fullName || ''}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    {t('users.username') || 'Username'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={selectedUser.username || ''}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    {t('users.emailLabel') || 'Email Address'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={selectedUser.email || '—'}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={selectedUser.phoneNumber || '—'}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    {t('users.roleLabel') || 'Role'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formatRole(selectedUser.role)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    {t('users.statusLabel') || 'Status'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formatStatus(selectedUser.status)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* 2FA Information */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">
                      {t('users.twoFactorStatus') || 'Two-Factor Authentication (2FA)'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {selectedUser.totpEnabled
                        ? t('users.twoFactorEnabled') || 'Protected with Google Authenticator TOTP'
                        : t('users.twoFactorDisabled') || 'Not configured (Password authentication only)'}
                    </div>
                  </div>
                  <div>
                    {selectedUser.totpEnabled ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>2FA Active</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        Disabled
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Registration Timestamp */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  {t('users.dateRegistered') || 'Registration Date & Time'}
                </label>
                <div className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
                  {selectedUser.createdAt
                    ? `${new Date(selectedUser.createdAt).toLocaleDateString('en-GB')} at ${new Date(selectedUser.createdAt).toLocaleTimeString()}`
                    : '—'}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                {t('users.closeBtn') || 'Close'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
