import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLoading } from '../context/LoadingContext';
import { accountService, transactionService, authService } from '../services/api';
import {
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  Send,
  Sparkles,
  CreditCard,
  Building2,
  DollarSign,
  ChevronDown,
} from 'lucide-react';

export default function TransfersPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showLoading } = useLoading();
  const [accounts, setAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' | 'withdraw' | 'transfer'
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // Form states
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const loadAccounts = async (isManual = false) => {
    if (isManual) {
      showLoading('Refreshing Teller Accounts...', 'Fetching real-time branch accounts...', 600);
    }
    setIsLoadingAccounts(true);
    try {
      const res = await accountService.getAll();
      const list = res?.data || [];
      setAccounts(list);
      if (list.length > 0) {
        if (!sourceAccountId) setSourceAccountId(list[0].id);
        if (!targetAccountId && list.length > 1) setTargetAccountId(list[1].id);
      }
    } catch (err) {
      console.error('Failed to load accounts for counter:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const selectedSource = accounts.find((a) => a.id === sourceAccountId);
  const selectedTarget = accounts.find((a) => a.id === targetAccountId);

  const currentAcc = (activeTab === 'transfer' ? selectedSource : (activeTab === 'deposit' ? selectedTarget : selectedSource));
  const isUsd = currentAcc?.currency === 'USD' || currentAcc?.currency === 1;
  const currencySymbol = isUsd ? '$' : '៛';
  const numAmount = parseFloat(amount) || 0;

  // Handle Deposit
  const handleDeposit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (!selectedTarget) {
      setError('Please select a target customer account.');
      return;
    }
    if (numAmount <= 0) {
      setError('Deposit amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    showLoading('Processing Cash Deposit...', 'Crediting funds to client balance...', 1200);
    try {
      const payload = {
        accountId: selectedTarget.id,
        amount: numAmount,
        currency: selectedTarget.currency,
        description: description.trim() || 'Counter Cash Deposit',
        idempotencyKey: `dep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      };
      const res = await transactionService.deposit(payload);
      setSuccess({
        title: 'Cash Deposit Successful!',
        referenceNumber: res.data?.referenceNumber,
        amount: numAmount,
        currency: selectedTarget.currency === 0 || selectedTarget.currency === 'USD' ? 'USD' : 'KHR',
        account: selectedTarget.accountNumber,
        newBalance: res.data?.balanceAfter,
      });
      setAmount('');
      setDescription('');
      await loadAccounts();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Deposit failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Withdraw
  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (!selectedSource) {
      setError('Please select a customer account to withdraw from.');
      return;
    }
    if (numAmount <= 0) {
      setError('Withdrawal amount must be greater than zero.');
      return;
    }
    if (numAmount > selectedSource.balance) {
      setError(`Insufficient account balance. Available: ${currencySymbol}${selectedSource.balance.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    showLoading('Processing Cash Deposit...', 'Crediting funds to client balance...', 1200);
    try {
      const payload = {
        accountId: selectedSource.id,
        amount: numAmount,
        currency: selectedSource.currency,
        description: description.trim() || 'Counter Cash Withdrawal',
        idempotencyKey: `wth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      };
      const res = await transactionService.withdraw(payload);
      setSuccess({
        title: 'Cash Withdrawal Successful!',
        referenceNumber: res.data?.referenceNumber,
        amount: numAmount,
        currency: selectedSource.currency === 0 || selectedSource.currency === 'USD' ? 'USD' : 'KHR',
        account: selectedSource.accountNumber,
        newBalance: res.data?.balanceAfter,
      });
      setAmount('');
      setDescription('');
      await loadAccounts();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Withdrawal failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (!selectedSource) {
      setError('Please select a source account.');
      return;
    }
    if (!selectedTarget) {
      setError('Please select a destination account.');
      return;
    }
    if (selectedSource.id === selectedTarget.id) {
      setError('Source and Destination accounts cannot be the same.');
      return;
    }
    if (numAmount <= 0) {
      setError('Transfer amount must be greater than zero.');
      return;
    }
    if (numAmount > selectedSource.balance) {
      setError(`Insufficient account balance. Available: ${currencySymbol}${selectedSource.balance.toFixed(2)}`);
      return;
    }

    const payload = {
      sourceAccountId: selectedSource.id,
      targetAccountId: selectedTarget.id,
      amount: numAmount,
      currency: selectedSource.currency,
      description: description.trim() || 'Branch Account Transfer',
      idempotencyKey: `trf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };

    executeTransfer(payload);
  };

  const executeTransfer = async (payload) => {
    setIsSubmitting(true);
    showLoading('Executing Account Transfer...', 'Moving funds between accounts...', 1200);
    setError('');
    try {
      const res = await transactionService.transfer(payload);
      setSuccess({
        title: 'Account Transfer Completed!',
        referenceNumber: res.data?.referenceNumber,
        amount: payload.amount,
        currency: isUsd ? 'USD' : 'KHR',
        account: `${selectedSource.accountNumber} ➜ ${selectedTarget.accountNumber}`,
        newBalance: res.data?.balanceAfter,
      });
      setAmount('');
      setDescription('');
      await loadAccounts();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <span>{t('transfers.title')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('transfers.subtitle')}
          </p>
        </div>

        <button
          onClick={() => loadAccounts(true)}
          title={t('transfers.refreshAccounts')}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors self-start"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingAccounts ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-slate-900/90 border border-slate-800 p-1.5 gap-2">
        <button
          type="button"
          onClick={() => { setActiveTab('deposit'); setError(''); setSuccess(null); }}
          className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'deposit'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>{t('transfers.tabDeposit')}</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('withdraw'); setError(''); setSuccess(null); }}
          className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'withdraw'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>{t('transfers.tabWithdraw')}</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('transfer'); setError(''); setSuccess(null); }}
          className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'transfer'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>{t('transfers.tabTransfer')}</span>
        </button>
      </div>

      {/* Operation Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
        {success && (
          <div className="mb-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-fadeIn space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{success.title}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs pt-2 border-t border-emerald-500/20">
              <div>
                <span className="text-[10px] text-slate-400 font-sans block">Reference:</span>
                <span className="font-bold text-white">{success.referenceNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-sans block">Amount:</span>
                <span className="font-bold text-white">{success.currency === 'USD' ? '$' : '៛'}{success.amount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-sans block">Target Account:</span>
                <span className="font-bold text-white">{success.account}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-semibold text-center">
            {error}
          </div>
        )}

        {/* Cash Deposit Form */}
        {activeTab === 'deposit' && (
          <form onSubmit={handleDeposit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Deposit Into Customer Account
              </label>
              <div className="relative">
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} className="bg-slate-900 text-white py-1">
                      {a.accountNumber} • ({a.currency === 'USD' || a.currency === 1 ? 'USD' : 'KHR'}) • Balance: {a.currency === 'USD' || a.currency === 1 ? '$' : '៛'}{a.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-emerald-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Deposit Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500.00"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Transaction Remarks
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Cash Deposit via Teller #01"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all mt-4"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Deposit...</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Process Cash Deposit</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Cash Withdrawal Form */}
        {activeTab === 'withdraw' && (
          <form onSubmit={handleWithdraw} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Withdraw From Customer Account
              </label>
              <div className="relative">
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-blue-500/50 text-white font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} className="bg-slate-900 text-white py-1">
                      {a.accountNumber} • ({a.currency === 'USD' || a.currency === 1 ? 'USD' : 'KHR'}) • Balance: {a.currency === 'USD' || a.currency === 1 ? '$' : '៛'}{a.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-blue-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Withdrawal Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="200.00"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-base font-bold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Transaction Remarks
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Counter Cash Withdrawal"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all mt-4"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Withdrawal...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Process Cash Withdrawal</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Account Transfer Form */}
        {activeTab === 'transfer' && (
          <form onSubmit={handleTransfer} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  From Source Account
                </label>
                <div className="relative">
                  <select
                    value={sourceAccountId}
                    onChange={(e) => setSourceAccountId(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-purple-500/50 text-white font-mono text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer"
                    required
                  >
                    {accounts.map((a) => {
                      const sym = a.currency === 'USD' || a.currency === 1 ? '$' : '៛';
                      const code = a.currency === 'USD' || a.currency === 1 ? 'USD' : 'KHR';
                      return (
                        <option key={a.id} value={a.id} className="bg-slate-900 text-white py-1">
                          {a.accountNumber} • ({code}) • {sym}{a.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-purple-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  To Destination Account
                </label>
                <div className="relative">
                  <select
                    value={targetAccountId}
                    onChange={(e) => setTargetAccountId(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-purple-500/50 text-white font-mono text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer"
                    required
                  >
                    {accounts.map((a) => {
                      const sym = a.currency === 'USD' || a.currency === 1 ? '$' : '៛';
                      const code = a.currency === 'USD' || a.currency === 1 ? 'USD' : 'KHR';
                      return (
                        <option key={a.id} value={a.id} className="bg-slate-900 text-white py-1">
                          {a.accountNumber} • ({code}) • {sym}{a.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-purple-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Transfer Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1000.00"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-base font-bold focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Payment Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Invoice settlement"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all mt-4"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Transfer...</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Execute Account Transfer</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
