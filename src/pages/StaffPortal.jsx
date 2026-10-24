import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLoading } from '../context/LoadingContext';
import { accountService, customerService } from '../services/api';
import Modal from '../components/Modal';
import { Users, ShieldAlert, ShieldCheck, UserPlus, RefreshCw, CheckCircle2, ChevronDown, Search, Phone, UserCog } from 'lucide-react';

export default function StaffPortal() {
  const { isStaff, isAdmin } = useAuth();
  const { t } = useLanguage();
  const { showLoading } = useLoading();

  const [customerList, setCustomerList] = useState([]);
  const [accountList, setAccountList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Customer Edit state
  const [targetCustomerId, setTargetCustomerId] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editNationalId, setEditNationalId] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // KYC update state
  const [kycStatus, setKycStatus] = useState('Pending');
  const [kycLevel, setKycLevel] = useState('1');

  // Customer Onboarding state
  const [showCreateCustModal, setShowCreateCustModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('1995-01-01');
  const [nationalId, setNationalId] = useState('');
  const [address, setAddress] = useState('');

  const getCustomerStatusString = (status) => {
    if (status === 'Verified' || status === 2) return 'Verified';
    if (status === 'Rejected' || status === 3) return 'Rejected';
    return 'Pending';
  };

  const populateCustomerForEdit = (cust) => {
    if (!cust) return;
    setTargetCustomerId(cust.id);
    setEditFirstName(cust.firstName || '');
    setEditLastName(cust.lastName || '');
    setEditPhoneNumber(cust.phoneNumber || '');
    const formattedDob = cust.dateOfBirth ? cust.dateOfBirth.split('T')[0] : '';
    setEditDob(formattedDob);
    setEditNationalId(cust.nationalIdOrPassport || '');
    setEditAddress(cust.address || '');
    setKycStatus(getCustomerStatusString(cust.kycStatus));
    setKycLevel(cust.kycLevel ? cust.kycLevel.toString() : '1');
  };

  const loadPortalData = async (resetSelection = false) => {
    setActionLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([
        customerService.getAll().catch(() => ({ data: [] })),
        accountService.getAll().catch(() => ({ data: [] })),
      ]);
      const custs = cRes?.data || [];
      const accs = aRes?.data || [];
      setCustomerList(custs);
      setAccountList(accs);
      
      if (!resetSelection && targetCustomerId) {
        const sel = custs.find((c) => c.id === targetCustomerId);
        if (sel) {
          populateCustomerForEdit(sel);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = async () => {
    showLoading('Refreshing Customer Profiles...', 'Retrieving registered clients and KYC records...', 600);
    handleSelectCustomer('');
    setMessage('');
    setError('');
    await loadPortalData(true);
  };

  const handleSelectCustomer = (id) => {
    setTargetCustomerId(id);
    if (!id) {
      setEditFirstName('');
      setEditLastName('');
      setEditPhoneNumber('');
      setEditDob('');
      setEditNationalId('');
      setEditAddress('');
      setKycStatus('Pending');
      setKycLevel('1');
      return;
    }
    const sel = customerList.find((c) => c.id === id);
    if (sel) {
      showLoading(`Loading Profile: ${sel.firstName} ${sel.lastName}...`, 'Populating KYC documents...', 300);
      populateCustomerForEdit(sel);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  if (!isStaff) {
    return (
      <div className="p-8 text-center text-slate-400">
        Access Denied. Only staff (Admin / Teller) can access this portal.
      </div>
    );
  }

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!targetCustomerId.trim()) return;
    if (!editFirstName.trim() || !editLastName.trim()) {
      setError('First Name and Last Name are required.');
      return;
    }
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      let dobIso = null;
      if (editDob) {
        try {
          dobIso = new Date(editDob).toISOString();
        } catch {
          dobIso = new Date('1990-01-01').toISOString();
        }
      } else {
        dobIso = new Date('1990-01-01').toISOString();
      }

      await customerService.updateCustomer(targetCustomerId.trim(), {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phoneNumber: editPhoneNumber.trim() || null,
        dateOfBirth: dobIso,
        nationalIdOrPassport: editNationalId.trim(),
        address: editAddress.trim(),
      });
      setMessage(`Customer "${editFirstName} ${editLastName}" profile updated successfully!`);
      await loadPortalData();
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data?.title ||
        'Failed to update customer details.';
      setError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateKyc = async (e) => {
    e.preventDefault();
    if (!targetCustomerId.trim()) return;
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      await customerService.updateKyc(targetCustomerId.trim(), kycStatus, parseInt(kycLevel, 10));
      const targetCust = customerList.find((c) => c.id === targetCustomerId);
      const name = targetCust ? `${targetCust.firstName} ${targetCust.lastName}` : targetCustomerId;
      setMessage(`KYC status for "${name}" successfully updated to "${kycStatus}" (Level ${kycLevel}).`);
      await loadPortalData();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to update KYC.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await customerService.createCustomer({
        phoneNumber: phoneNumber.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: new Date(dob).toISOString(),
        nationalIdOrPassport: nationalId.trim(),
        address: address.trim(),
      });
      setMessage(`Customer profile created! Customer Number: ${res.data?.customerNumber} (${res.data?.firstName} ${res.data?.lastName})`);
      setShowCreateCustModal(false);
      setPhoneNumber('');
      setFirstName('');
      setLastName('');
      setNationalId('');
      setAddress('');
      await loadPortalData();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to create customer profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCustomers = customerList.filter((c) => {
    const st = getCustomerStatusString(c.kycStatus);
    const matchesFilter = filterStatus === 'ALL' || st.toLowerCase() === filterStatus.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      c.firstName?.toLowerCase().includes(query) ||
      c.lastName?.toLowerCase().includes(query) ||
      c.customerNumber?.toLowerCase().includes(query) ||
      c.phoneNumber?.toLowerCase().includes(query) ||
      c.nationalIdOrPassport?.toLowerCase().includes(query) ||
      c.address?.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>{t('staff.headerTitle')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('staff.headerSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            title={t('staff.refresh')}
            disabled={actionLoading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateCustModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('staff.onboardButton')}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="font-sans break-words">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-red-400 hover:text-white p-1 rounded-lg hover:bg-red-500/20 transition-colors shrink-0"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Update Customer Profile */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <UserCog className="w-4 h-4 text-emerald-400" />
                <span>{t('staff.updateCustomerTitle')}</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t('staff.updateCustomerSubtitle')}
              </p>
            </div>
            {targetCustomerId && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {customerList.find(c => c.id === targetCustomerId)?.customerNumber || 'Customer'}
              </span>
            )}
          </div>

          <form onSubmit={handleUpdateCustomer} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('staff.selectCustomer')}
              </label>
              {customerList.length > 0 ? (
                <div className="relative">
                  <select
                    value={targetCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-slate-400 py-1 font-sans">
                      {t('staff.selectCustomerPlaceholder')}
                    </option>
                    {customerList.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white py-1">
                        {c.customerNumber} • {c.firstName} {c.lastName} ({c.phoneNumber || 'Unset'})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-emerald-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={targetCustomerId}
                  onChange={(e) => setTargetCustomerId(e.target.value)}
                  placeholder="Enter Customer ID"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              )}
              {!targetCustomerId && (
                <p className="text-[11px] text-amber-400/90 mt-1.5 flex items-center gap-1 font-sans">
                  <span>ℹ️ {t('staff.selectCustomerTip')}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('staff.firstName')}</label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder={targetCustomerId ? t('staff.firstName') : t('staff.selectCustomerTip')}
                  disabled={!targetCustomerId}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('staff.lastName')}</label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder={targetCustomerId ? t('staff.lastName') : t('staff.selectCustomerTip')}
                  disabled={!targetCustomerId}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('staff.phoneNumber')}</label>
                <input
                  type="tel"
                  value={editPhoneNumber}
                  onChange={(e) => setEditPhoneNumber(e.target.value)}
                  placeholder={targetCustomerId ? "012345678" : t('staff.selectCustomerTip')}
                  disabled={!targetCustomerId}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('staff.nationalId')}</label>
                <input
                  type="text"
                  value={editNationalId}
                  onChange={(e) => setEditNationalId(e.target.value)}
                  placeholder={targetCustomerId ? "ID Number" : t('staff.selectCustomerTip')}
                  disabled={!targetCustomerId}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('staff.dob')}</label>
                <input
                  type="date"
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  disabled={!targetCustomerId}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('staff.address')}</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder={targetCustomerId ? "e.g. Phnom Penh" : t('staff.selectCustomerTip')}
                  disabled={!targetCustomerId}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading || !targetCustomerId}
              className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {actionLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('staff.updateCustomerBtn')}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* KYC Upgrade Tool */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{t('staff.kycVerificationTitle')}</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t('staff.kycVerificationSubtitle')}
              </p>
            </div>
            {targetCustomerId && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {customerList.find(c => c.id === targetCustomerId)?.customerNumber || 'Customer'}
              </span>
            )}
          </div>

          <form onSubmit={handleUpdateKyc} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('staff.selectCustomer')}
              </label>
              {customerList.length > 0 ? (
                <div className="relative">
                  <select
                    value={targetCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-slate-400 py-1 font-sans">
                      {t('staff.selectCustomerPlaceholder')}
                    </option>
                    {customerList.map((c) => {
                      const st = getCustomerStatusString(c.kycStatus);
                      return (
                        <option key={c.id} value={c.id} className="bg-slate-900 text-white py-1">
                          {c.customerNumber} • {c.firstName} {c.lastName} [Status: {st}] (ID: {c.nationalIdOrPassport})
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-emerald-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={targetCustomerId}
                  onChange={(e) => setTargetCustomerId(e.target.value)}
                  placeholder="Enter customer ID"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              )}
              {!targetCustomerId && (
                <p className="text-[11px] text-amber-400/90 mt-1.5 flex items-center gap-1 font-sans">
                  <span>ℹ️ {t('staff.selectCustomerKycTip')}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('staff.status')}</label>
                <div className="relative">
                  <select
                    value={kycStatus}
                    onChange={(e) => setKycStatus(e.target.value)}
                    disabled={!targetCustomerId}
                    className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-all cursor-pointer font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="Pending" className="bg-slate-900 text-white">{t('staff.pending')}</option>
                    <option value="Verified" className="bg-slate-900 text-white">{t('staff.verified')}</option>
                    <option value="Rejected" className="bg-slate-900 text-white">{t('staff.rejected')}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-emerald-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('staff.tierLevel')}</label>
                <div className="relative">
                  <select
                    value={kycLevel}
                    onChange={(e) => setKycLevel(e.target.value)}
                    disabled={!targetCustomerId}
                    className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="1" className="bg-slate-900 text-white">{t('staff.level1')}</option>
                    <option value="2" className="bg-slate-900 text-white">{t('staff.level2')}</option>
                    <option value="3" className="bg-slate-900 text-white">{t('staff.level3')}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-emerald-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading || !targetCustomerId}
              className="w-full mt-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase disabled:opacity-50"
            >
              {t('staff.updateKycBtn')}
            </button>
          </form>
        </div>
      </div>

      {/* Customer Directory & KYC Registry Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 space-y-4 p-5 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>{t('staff.directoryTitle')}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('staff.directorySubtitle')}
            </p>
          </div>

          {/* Search bar & Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('staff.searchPlaceholder')}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
              {[
                { key: 'ALL', label: t('staff.allStatus') },
                { key: 'Verified', label: t('staff.verified') },
                { key: 'Pending', label: t('staff.pending') },
                { key: 'Rejected', label: t('staff.rejected') },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    filterStatus === key
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">{t('staff.customerNumber')}</th>
                <th className="py-3 px-4">{t('staff.name')}</th>
                <th className="py-3 px-4">{t('staff.phone')}</th>
                <th className="py-3 px-4">{t('staff.idNumber')}</th>
                <th className="py-3 px-4">{t('staff.addressCol')}</th>
                <th className="py-3 px-4">{t('staff.kycStatus')}</th>
                <th className="py-3 px-4">{t('staff.kycLevel')}</th>
                <th className="py-3 px-4 text-center">{t('staff.accountsCount')}</th>
                <th className="py-3 px-4 text-right">{t('staff.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                    {t('staff.noCustomers')}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const st = getCustomerStatusString(c.kycStatus);
                  const isSelected = c.id === targetCustomerId;
                  const localizedStatus =
                    st === 'Verified' ? t('staff.verified') : (st === 'Rejected' ? t('staff.rejected') : t('staff.pending'));
                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-900/40'
                      }`}
                    >
                      <td className="py-3 px-4 text-emerald-400 font-bold whitespace-nowrap">{c.customerNumber}</td>
                      <td className="py-3 px-4 text-white font-sans font-semibold whitespace-nowrap">
                        {c.firstName} {c.lastName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 text-xs whitespace-nowrap">
                        {c.phoneNumber ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                            <Phone className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                            <span>{c.phoneNumber}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 italic font-sans text-[11px]">Unset</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{c.nationalIdOrPassport || '—'}</td>
                      <td className="py-3 px-4 text-slate-400 font-sans whitespace-nowrap">{c.address || '—'}</td>
                      <td className="py-3 px-4 font-sans whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                            st === 'Verified'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : st === 'Pending'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{localizedStatus}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
                          Tier {c.kycLevel || 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-sans whitespace-nowrap">
                        {(() => {
                          const count = (c.accounts && c.accounts.length > 0)
                            ? c.accounts.length
                            : accountList.filter((a) => a.customerId === c.id).length;

                          if (count > 0) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>{count} {count === 1 ? t('staff.accountUnit') : t('staff.accountsUnit')}</span>
                              </span>
                            );
                          }

                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap bg-slate-800/80 text-slate-400 border border-slate-700/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              <span>0 {t('staff.accountsUnit')}</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 text-right font-sans whitespace-nowrap">
                        <button
                          onClick={() => {
                            handleSelectCustomer(c.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          {isSelected ? t('staff.editing') : t('staff.manage')}
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

      {/* Onboard Customer Modal */}
      <Modal
        isOpen={showCreateCustModal}
        onClose={() => setShowCreateCustModal(false)}
        title={t('staff.onboardModalTitle')}
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>{t('staff.clientPhoneLabel')}</span>
              <span className="text-[10px] text-emerald-400 font-mono">{t('staff.e164Note')}</span>
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t('staff.phonePlaceholder')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">{t('staff.firstName')}</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Sophea"
                className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">{t('staff.lastName')}</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Chan"
                className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">{t('staff.dob')}</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">{t('staff.nationalId')}</label>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="e.g. 010992384"
              className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">{t('staff.address')}</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Phnom Penh, Cambodia"
              className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full mt-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase tracking-wider disabled:opacity-50"
          >
            {t('staff.createProfileBtn')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
