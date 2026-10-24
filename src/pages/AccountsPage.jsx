import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLoading } from '../context/LoadingContext';
import { accountService, customerService } from '../services/api';
import Modal from '../components/Modal';
import DepositWithdrawModal from '../components/DepositWithdrawModal';
import {
  Wallet,
  PlusCircle,
  Search,
  RefreshCw,
  CheckCircle2,
  Lock,
  Unlock,
  XCircle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Users,
  CreditCard,
  ChevronDown,
  AlertCircle,
  AlertTriangle,
  Eye,
  UserCheck,
} from 'lucide-react';

export default function AccountsPage() {
  const { t } = useLanguage();
  const { showLoading } = useLoading();
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [actionAlert, setActionAlert] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [viewModalData, setViewModalData] = useState(null);

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [accountType, setAccountType] = useState('Savings');
  const [currency, setCurrency] = useState('USD');
  const [initialDeposit, setInitialDeposit] = useState('');
  const [openLoading, setOpenLoading] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(null);

  // Cash Action Modal (Deposit/Withdraw)
  const [cashModal, setCashModal] = useState({ isOpen: false, mode: 'deposit', account: null });

  const loadData = async (isManual = false) => {
    if (isManual) {
      showLoading('Refreshing Customer Accounts...', 'Retrieving live balances from core banking...', 600);
    }
    setIsLoading(true);
    setError('');
    try {
      const [accRes, custRes] = await Promise.all([
        accountService.getAll().catch(() => ({ data: [] })),
        customerService.getAll().catch(() => ({ data: [] })),
      ]);
      setAccounts(accRes?.data || []);
      setCustomers(custRes?.data || []);
      if (custRes?.data?.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(custRes.data[0].id);
      }
    } catch (err) {
      setError('Failed to load accounts list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAccount = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomerId) {
      setError('Please select or specify a client/customer.');
      return;
    }

    const depositNum = parseFloat(initialDeposit) || 0;
    if (depositNum < 0) {
      setError('Initial deposit cannot be negative.');
      return;
    }

    setOpenLoading(true);
    try {
      const res = await accountService.openAccount({
        customerId: selectedCustomerId,
        accountType: accountType,
        currency: currency,
        initialDeposit: depositNum,
      });
      setOpenSuccess(res.data);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to open account.');
    } finally {
      setOpenLoading(false);
    }
  };

  const handleFreeze = (acc) => {
    const isFrozen = acc.status === 'Frozen' || acc.status === 2;
    setConfirmDialog({
      title: isFrozen ? 'Unfreeze Customer Account' : 'Freeze Customer Account',
      message: isFrozen
        ? `Are you sure you want to unfreeze account ${acc.accountNumber}? Normal deposit, withdrawal, and transfer operations will be resumed.`
        : `Are you sure you want to freeze account ${acc.accountNumber}? All debit and credit transactions will be suspended.`,
      confirmText: isFrozen ? 'Unfreeze Account' : 'Freeze Account',
      isDanger: !isFrozen,
      onConfirm: async () => {
        try {
          if (isFrozen) {
            await accountService.unfreezeAccount(acc.id);
            setActionAlert({
              type: 'success',
              title: 'Account Unfrozen',
              message: `Account ${acc.accountNumber} is now Active.`,
            });
          } else {
            await accountService.freezeAccount(acc.id, 'Teller moderation lock');
            setActionAlert({
              type: 'warning',
              title: 'Account Frozen',
              message: `Account ${acc.accountNumber} has been locked.`,
            });
          }
          await loadData();
        } catch (err) {
          setActionAlert({
            type: 'error',
            title: 'Operation Failed',
            message: err.response?.data?.detail || err.response?.data?.message || 'Operation failed.',
          });
        }
      },
    });
  };

  const handleClose = (acc) => {
    if (acc.balance > 0) {
      const isUsd = acc.currency === 'USD' || acc.currency === 1;
      const symbol = isUsd ? '$' : '៛';
      setActionAlert({
        type: 'warning',
        title: 'Cannot Close Account with Remaining Balance',
        message: `Account ${acc.accountNumber} has a positive balance of ${symbol}${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}. By banking regulations, all funds must be withdrawn or transferred out before closing the account.`,
        actionButton: {
          text: 'Withdraw Remaining Funds at Counter',
          onClick: () => {
            setActionAlert(null);
            setCashModal({ isOpen: true, mode: 'withdraw', account: acc });
          },
        },
      });
      return;
    }

    setConfirmDialog({
      title: 'Permanently Close Customer Account',
      message: `Are you sure you want to permanently close account ${acc.accountNumber}? This action cannot be reversed.`,
      confirmText: 'Permanently Close Account',
      isDanger: true,
      onConfirm: async () => {
        try {
          await accountService.closeAccount(acc.id);
          setActionAlert({
            type: 'success',
            title: 'Account Closed',
            message: `Account ${acc.accountNumber} has been successfully closed.`,
          });
          await loadData();
        } catch (err) {
          setActionAlert({
            type: 'error',
            title: 'Close Account Failed',
            message: err.response?.data?.detail || err.response?.data?.message || 'Failed to close account.',
          });
        }
      },
    });
  };

  const filteredAccounts = accounts.filter((acc) => {
    const cust = customers.find((c) => c.id === acc.customerId);
    const custName = cust ? `${cust.firstName} ${cust.lastName} ${cust.customerNumber} ${cust.nationalIdOrPassport || ''}` : '';
    const matchesSearch =
      acc.accountNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.customerId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      custName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCurrency =
      filterCurrency === 'ALL' ||
      (filterCurrency === 'USD' && (acc.currency === 'USD' || acc.currency === 1)) ||
      (filterCurrency === 'KHR' && (acc.currency === 'KHR' || acc.currency === 2));
    return matchesSearch && matchesCurrency;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <span>{t('accounts.title')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('accounts.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            title={t('common.refresh')}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={() => {
              setOpenSuccess(null);
              setError('');
              setInitialDeposit('');
              setShowOpenModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('accounts.openAccount')}</span>
          </button>
        </div>
      </div>

      {/* In-app Action Alert Banner */}
      {actionAlert && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 animate-fadeIn ${
            actionAlert.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : actionAlert.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div className="flex items-start gap-3">
            {actionAlert.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            ) : actionAlert.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-sm font-bold text-white">{actionAlert.title}</h4>
              <p className="text-xs mt-1 text-slate-300 leading-relaxed">{actionAlert.message}</p>
              {actionAlert.actionButton && (
                <button
                  onClick={actionAlert.actionButton.onClick}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{actionAlert.actionButton.text}</span>
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search account number..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-mono"
          />
        </div>

        <div className="flex rounded-xl bg-slate-900/80 border border-slate-800 p-1 text-xs self-stretch sm:self-auto">
          {['ALL', 'USD', 'KHR'].map((cur) => (
            <button
              key={cur}
              onClick={() => {
                setFilterCurrency(cur);
                showLoading(
                  cur === 'ALL' ? 'Showing All Accounts...' : `Filtering ${cur} Accounts...`,
                  'Filtering accounts ledger by currency...',
                  250
                );
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterCurrency === cur
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cur}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{t('accounts.accountNumber')}</th>
                <th className="py-3 px-4">{t('accounts.accountHolder')}</th>
                <th className="py-3 px-4">{t('accounts.type')}</th>
                <th className="py-3 px-4">{t('accounts.currency')}</th>
                <th className="py-3 px-4 text-right">{t('accounts.balance')}</th>
                <th className="py-3 px-4 text-center">{t('accounts.status')}</th>
                <th className="py-3 px-4">{t('accounts.opened')}</th>
                <th className="py-3 px-4 text-right">{t('accounts.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                    Loading customer accounts...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No customer accounts found matching your query.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const cust = customers.find((c) => c.id === acc.customerId);
                  const isUsd = acc.currency === 'USD' || acc.currency === 1;
                  const isFrozen = acc.status === 'Frozen' || acc.status === 2;
                  const isClosed = acc.status === 'Closed' || acc.status === 3;
                  const openDate = acc.openedAt || acc.createdAt;
                  const formattedDate = openDate
                    ? new Date(openDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';

                  return (
                    <tr key={acc.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-400 shrink-0 font-sans" />
                        <span>{acc.accountNumber}</span>
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        {cust ? (
                          <button
                            type="button"
                            onClick={() => setViewModalData({ account: acc, customer: cust })}
                            className="text-left group/cust hover:opacity-80 transition-opacity"
                            title="Click to view full Account & Customer details"
                          >
                            <div className="font-semibold text-white group-hover/cust:text-emerald-400 transition-colors flex items-center gap-1.5">
                              <span>{cust.firstName} {cust.lastName}</span>
                              <Eye className="w-3.5 h-3.5 text-emerald-400 opacity-60 group-hover/cust:opacity-100" />
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {cust.customerNumber}
                            </div>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs italic font-sans">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-300 whitespace-nowrap">
                        {acc.accountType === 0 || acc.accountType === 1 || acc.accountType === 'Savings'
                          ? t('accounts.savings')
                          : acc.accountType === 2 || acc.accountType === 'Checking'
                          ? t('accounts.checking')
                          : t('accounts.fixedDeposit')}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${
                            isUsd
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isUsd ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                          <span>{isUsd ? 'USD ($)' : 'KHR (៛)'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-white text-sm whitespace-nowrap">
                        {isUsd ? '$' : '៛'}
                        {acc.balance.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center font-sans whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                            isClosed
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                              : isFrozen
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isClosed ? 'bg-red-400' : isFrozen ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                          />
                          <span>{isClosed ? t('accounts.closed') : isFrozen ? t('accounts.frozen') : t('accounts.active')}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Customer & Account Details Button */}
                          <button
                            onClick={() => {
                              showLoading('Loading Account Details...', 'Fetching client profile and balance...', 250);
                              setViewModalData({ account: acc, customer: cust });
                            }}
                            title="View Account & Customer Details"
                            className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>View</span>
                          </button>

                          {!isClosed && !isFrozen && (
                            <>
                              <button
                                onClick={() => setCashModal({ isOpen: true, mode: 'deposit', account: acc })}
                                title="Cash Deposit"
                                className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1"
                              >
                                <ArrowDownRight className="w-3 h-3" />
                                <span>{t('accounts.deposit')}</span>
                              </button>
                              <button
                                onClick={() => setCashModal({ isOpen: true, mode: 'withdraw', account: acc })}
                                title="Cash Withdrawal"
                                className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 text-[11px] font-semibold flex items-center gap-1"
                              >
                                <ArrowUpRight className="w-3 h-3" />
                                <span>{t('accounts.withdraw')}</span>
                              </button>
                            </>
                          )}
                          {!isClosed && (
                            <button
                              onClick={() => handleFreeze(acc)}
                              title={isFrozen ? t('accounts.unfreeze') : t('accounts.freeze')}
                              className={`p-1.5 rounded border transition-colors ${
                                isFrozen
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-amber-400'
                              }`}
                            >
                              {isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          {!isClosed && (
                            <button
                              onClick={() => handleClose(acc)}
                              title={t('accounts.close')}
                              className="p-1.5 rounded bg-slate-800 text-slate-400 border border-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Account Modal */}
      <Modal
        isOpen={showOpenModal}
        onClose={() => {
          setShowOpenModal(false);
          setOpenSuccess(null);
          setInitialDeposit('');
          setError('');
        }}
        title="Open Bank Account for Client"
      >
        {openSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Client Account Opened Successfully!</h4>
              <p className="text-xs text-slate-400 mt-1">New official bank account is active and ready.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Account Number:</span>
                <span className="text-emerald-400 font-bold">{openSuccess.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Currency:</span>
                <span className="text-white">
                  {openSuccess.currency === 'USD' || openSuccess.currency === 1 ? 'USD ($)' : 'KHR (៛)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Opening Balance:</span>
                <span className="text-white font-bold">
                  {openSuccess.currency === 'USD' || openSuccess.currency === 1 ? '$' : '៛'}
                  {openSuccess.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowOpenModal(false);
                setOpenSuccess(null);
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase"
            >
              Done & Return to List
            </button>
          </div>
        ) : (
          <form onSubmit={handleOpenAccount} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Select Client / Customer Profile
              </label>
              {customers.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white py-1">
                        {c.customerNumber} • {c.firstName} {c.lastName} (ID: {c.nationalIdOrPassport})
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
                  placeholder="Enter Customer Guid ID..."
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Account Type</label>
                <div className="relative">
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="Savings" className="bg-slate-900 text-white">Savings (3.5% APR)</option>
                    <option value="Checking" className="bg-slate-900 text-white">Checking (0% APR)</option>
                    <option value="FixedDeposit" className="bg-slate-900 text-white">Fixed Deposit (6% APR)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-emerald-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Currency</label>
                <div className="relative">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="USD" className="bg-slate-900 text-white">USD - US Dollar ($)</option>
                    <option value="KHR" className="bg-slate-900 text-white">KHR - Khmer Riel (៛)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-emerald-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                <span>Initial Cash Deposit Amount ({currency === 'USD' ? '$' : '៛'})</span>
                <span className="text-[11px] text-slate-500 font-normal">Optional (Default $0)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                  {currency === 'USD' ? '$' : '៛'}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono font-bold placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={openLoading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 mt-2 transition-all"
            >
              {openLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Core Banking Operation...</span>
                </>
              ) : (
                <span>Open & Activate Client Account</span>
              )}
            </button>
          </form>
        )}
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        title={confirmDialog?.title || 'Confirm Action'}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">{confirmDialog?.message}</p>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              onClick={() => setConfirmDialog(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const action = confirmDialog?.onConfirm;
                setConfirmDialog(null);
                if (action) await action();
              }}
              className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md ${
                confirmDialog?.isDanger
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
              }`}
            >
              {confirmDialog?.confirmText || 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Teller Cash Deposit/Withdraw Modal */}
      {cashModal.isOpen && cashModal.account && (
        <DepositWithdrawModal
          isOpen={cashModal.isOpen}
          mode={cashModal.mode}
          targetAccount={cashModal.account}
          onClose={() => setCashModal({ isOpen: false, mode: 'deposit', account: null })}
          onSuccess={() => {
            setCashModal({ isOpen: false, mode: 'deposit', account: null });
            loadData();
          }}
        />
      )}

      {/* View Customer & Account Details Modal */}
      {viewModalData && (
        <Modal
          isOpen={!!viewModalData}
          onClose={() => setViewModalData(null)}
          title="Account & Customer Profile Details"
        >
          <div className="space-y-5 text-xs">
            {/* Customer Profile Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
                {viewModalData.customer?.firstName?.[0] || 'C'}{viewModalData.customer?.lastName?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white truncate">
                    {viewModalData.customer ? `${viewModalData.customer.firstName} ${viewModalData.customer.lastName}` : 'Client Profile'}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {viewModalData.customer?.kycStatus === 2 || viewModalData.customer?.kycStatus === 'Verified' ? 'KYC Verified' : 'KYC Pending'}
                  </span>
                </div>
                <div className="text-slate-400 font-mono text-[11px] mt-0.5 flex flex-wrap gap-x-3">
                  <span>Customer #: <strong className="text-slate-200">{viewModalData.customer?.customerNumber || '—'}</strong></span>
                  <span>National ID: <strong className="text-slate-200">{viewModalData.customer?.nationalIdOrPassport || '—'}</strong></span>
                </div>
              </div>
            </div>

            {/* Two-Column Grid: Customer Info & Account Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Info Card */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800 pb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Customer Identity</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="text-white font-semibold">{viewModalData.customer ? `${viewModalData.customer.firstName} ${viewModalData.customer.lastName}` : '—'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">ID / Passport:</span>
                  <span className="text-slate-200 font-mono">{viewModalData.customer?.nationalIdOrPassport || '—'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">KYC Level:</span>
                  <span className="text-amber-400 font-semibold font-mono">Tier {viewModalData.customer?.kycLevel || 1}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Address:</span>
                  <span className="text-slate-200 text-right max-w-[170px] truncate">{viewModalData.customer?.address || 'Phnom Penh'}</span>
                </div>
              </div>

              {/* Account Info Card */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800 pb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                  <span>Account Information</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Account Number:</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">{viewModalData.account.accountNumber}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Account Type:</span>
                  <span className="text-white">
                    {viewModalData.account.accountType === 0 || viewModalData.account.accountType === 'Savings'
                      ? 'Savings Account (3.5% APR)'
                      : viewModalData.account.accountType === 1 || viewModalData.account.accountType === 'Checking'
                      ? 'Checking Account'
                      : 'Fixed Deposit Account (6% APR)'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Currency:</span>
                  <span className="text-white font-mono font-semibold">
                    {viewModalData.account.currency === 0 || viewModalData.account.currency === 'USD' ? 'USD ($)' : 'KHR (៛)'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Account Status:</span>
                  <span className="font-semibold font-mono text-emerald-400">
                    {viewModalData.account.status === 2 || viewModalData.account.status === 'Frozen' ? (
                      <span className="text-amber-400">Frozen (Locked)</span>
                    ) : viewModalData.account.status === 3 || viewModalData.account.status === 'Closed' ? (
                      <span className="text-red-400">Closed</span>
                    ) : (
                      'Active'
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Balance Highlight Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Available Balance</span>
                <div className="text-2xl font-black font-mono text-white mt-0.5">
                  {viewModalData.account.currency === 0 || viewModalData.account.currency === 'USD' ? '$' : '៛'}
                  {viewModalData.account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-400 font-mono">
                <div>Date Opened:</div>
                <div className="text-white font-semibold">
                  {new Date(viewModalData.account.openedAt || viewModalData.account.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Action Buttons in Modal */}
            <div className="pt-2 flex flex-wrap gap-2 justify-end border-t border-slate-800">
              {viewModalData.account.status !== 2 && viewModalData.account.status !== 'Frozen' && viewModalData.account.status !== 3 && viewModalData.account.status !== 'Closed' && (
                <>
                  <button
                    onClick={() => {
                      const acc = viewModalData.account;
                      setViewModalData(null);
                      setCashModal({ isOpen: true, mode: 'deposit', account: acc });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Cash Deposit</span>
                  </button>
                  <button
                    onClick={() => {
                      const acc = viewModalData.account;
                      setViewModalData(null);
                      setCashModal({ isOpen: true, mode: 'withdraw', account: acc });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Cash Withdraw</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setViewModalData(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
