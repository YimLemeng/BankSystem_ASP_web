import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLoading } from '../context/LoadingContext';
import { transactionService, accountService, customerService } from '../services/api';
import {
  FileText,
  Filter,
  Printer,
  ChevronLeft,
  ChevronRight,
  Download,
  Landmark,
  ChevronDown,
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  RotateCcw,
  Search,
  CreditCard,
} from 'lucide-react';

export default function TransactionsPage() {
  const { user, accounts: authAccounts, selectedAccount } = useAuth();
  const { t } = useLanguage();
  const { showLoading } = useLoading();

  const [accounts, setAccounts] = useState(authAccounts || []);
  const [customers, setCustomers] = useState([]);
  const [accountId, setAccountId] = useState(selectedAccount?.id || '');
  const [accountSearch, setAccountSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(15);
  const [typeFilter, setTypeFilter] = useState('');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Statement view state
  const [showStatement, setShowStatement] = useState(false);
  const [statementData, setStatementData] = useState(null);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);
  const [stmtFrom, setStmtFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [stmtTo, setStmtTo] = useState(() => new Date().toISOString().split('T')[0]);

  // Load Accounts and Customers on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [accRes, custRes] = await Promise.all([
          accountService.getAll().catch(() => ({ data: [] })),
          customerService.getAll().catch(() => ({ data: [] })),
        ]);

        const list = accRes?.data || [];
        setCustomers(custRes?.data || []);

        if (list.length > 0) {
          setAccounts(list);
        } else if (authAccounts && authAccounts.length > 0) {
          setAccounts(authAccounts);
        }
      } catch (err) {
        if (authAccounts && authAccounts.length > 0) {
          setAccounts(authAccounts);
        }
      }
    };
    fetchInitialData();
  }, []);

  const activeAccount = accounts.find((a) => a.id === accountId) || null;
  const isUsd = activeAccount ? (activeAccount.currency === 'USD' || activeAccount.currency === 1) : true;
  const currencySymbol = isUsd ? '$' : '៛';
  const currencyCode = isUsd ? 'USD' : 'KHR';

  const statementAccount = statementData?.account || activeAccount;
  const isStatementUsd = statementAccount ? (statementAccount.currency === 'USD' || statementAccount.currency === 1) : isUsd;
  const stmtCurrencySymbol = isStatementUsd ? '$' : '៛';
  const stmtCurrencyCode = isStatementUsd ? 'USD' : 'KHR';

  const filteredAccounts = accounts.filter((a) => {
    if (!accountSearch.trim()) return true;
    const q = accountSearch.trim().toLowerCase();
    const cust = customers.find((c) => c.id === a.customerId);
    const custName = cust ? `${cust.firstName} ${cust.lastName}`.toLowerCase() : '';
    return (
      a.accountNumber?.toLowerCase().includes(q) ||
      custName.includes(q)
    );
  });

  const handleAccountSearchChange = (val) => {
    setAccountSearch(val);
    const q = val.trim().toLowerCase();
    if (q) {
      const match = accounts.find((a) => {
        const cust = customers.find((c) => c.id === a.customerId);
        const custName = cust ? `${cust.firstName} ${cust.lastName}`.toLowerCase() : '';
        return a.accountNumber?.toLowerCase().includes(q) || custName.includes(q);
      });
      if (match) {
        setAccountId(match.id);
        setPageIndex(1);
        setShowStatement(false);
      }
    }
  };

  // Find linked customer for account
  const linkedCustomer = customers.find((c) => c.id === activeAccount?.customerId);
  const customerName = linkedCustomer
    ? `${linkedCustomer.firstName} ${linkedCustomer.lastName}`
    : (activeAccount?.customerName || user?.fullName || 'Valued Customer');
  const customerPhone = linkedCustomer?.phoneNumber || (user?.phoneNumber || '—');
  const customerCif = linkedCustomer?.customerNumber || linkedCustomer?.nationalIdOrPassport || `CIF-${(activeAccount?.accountNumber || '840100').slice(-6)}`;

  const fetchTransactions = async () => {
    if (!accountId) return;
    setIsLoading(true);
    try {
      const params = {
        pageIndex,
        pageSize,
      };
      if (typeFilter !== '') params.type = parseInt(typeFilter, 10);
      if (stmtFrom) {
        params.fromDate = new Date(stmtFrom + 'T00:00:00').toISOString();
      }
      if (stmtTo) {
        params.toDate = new Date(stmtTo + 'T23:59:59').toISOString();
      }

      const res = await transactionService.getHistory(accountId, params);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchTransactions();
    }
  }, [accountId, pageIndex, typeFilter, stmtFrom, stmtTo]);

  const handleGenerateStatement = async (e) => {
    if (e) e.preventDefault();
    if (!accountId) return;
    setIsLoadingStatement(true);
    showLoading('Generating Account Statement...', 'Compiling official bank statement...', 900);
    try {
      const fromIso = stmtFrom ? new Date(stmtFrom + 'T00:00:00').toISOString() : new Date(Date.now() - 30 * 86400000).toISOString();
      const toIso = stmtTo ? new Date(stmtTo + 'T23:59:59').toISOString() : new Date().toISOString();
      const res = await transactionService.getStatement(accountId, fromIso, toIso);
      setStatementData(res.data);
      setShowStatement(true);
      fetchTransactions();
      setTimeout(() => {
        document.getElementById('official-bank-statement')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err) {
      console.error('Failed to generate statement:', err);
    } finally {
      setIsLoadingStatement(false);
    }
  };

  const handleResetDates = () => {
    showLoading('Resetting Statement Filter...', 'Loading all account records...', 400);
    setStmtFrom('');
    setStmtTo('');
    setShowStatement(false);
  };

  const isCredit = (type) =>
    type === 0 || type === 1 || type === 3 || type === 'Deposit' || type === 'TransferIn';

  const getTypeName = (type) => {
    if (type === 1 || type === 0 || type === 'Deposit') return 'Deposit';
    if (type === 2 || type === 'Withdrawal') return 'Withdrawal';
    if (type === 4 || type === 'TransferOut') return 'Transfer (Out)';
    if (type === 3 || type === 'TransferIn') return 'Transfer (In)';
    return 'Transaction';
  };

  const getAccountTypeName = (type) => {
    if (type === 1 || type === 0 || type === 'Savings') return 'Savings Account';
    if (type === 2 || type === 'Checking') return 'Checking Account';
    if (type === 3 || type === 'FixedDeposit') return 'Fixed Deposit Account';
    return 'Bank Account';
  };

  const getAccountStatusName = (status) => {
    if (status === 2 || status === 'Frozen') return 'Frozen (Locked)';
    if (status === 3 || status === 'Closed') return 'Closed';
    if (status === 4 || status === 'Inactive') return 'Inactive';
    return 'Active';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header (Hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>{t('transactions.title')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('transactions.subtitle')}
          </p>
        </div>

        {/* Account Search & Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={accountSearch}
              onChange={(e) => handleAccountSearchChange(e.target.value)}
              placeholder={t('transactions.searchAccountPlaceholder') || 'ស្វែងរកលេខគណនី...'}
              className="py-2 pl-8 pr-7 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-48 sm:w-56 shadow-sm transition-all"
            />
            {accountSearch && (
              <button
                type="button"
                onClick={() => setAccountSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium hidden md:inline">{t('transactions.accountLabel')}</label>
            <div className="relative">
              <select
                value={accountId}
                onChange={(e) => {
                  setAccountId(e.target.value);
                  setPageIndex(1);
                  setShowStatement(false);
                }}
                className="appearance-none py-2 pl-3 pr-9 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm max-w-[260px] sm:max-w-[340px] truncate"
              >
                <option value="" className="bg-slate-900 text-slate-400">
                  -- {t('transactions.selectAccountPlaceholder') || 'Select Account Number'} --
                </option>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((a) => {
                    const isAccUsd = a.currency === 'USD' || a.currency === 1;
                    const sym = isAccUsd ? '$' : '៛';
                    return (
                      <option key={a.id} value={a.id} className="bg-slate-900 text-slate-200">
                        {a.accountNumber} ({isAccUsd ? 'USD' : 'KHR'}) • {sym}{(a.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </option>
                    );
                  })
                ) : (
                  <option value="" disabled className="bg-slate-900 text-slate-500">
                    No accounts match search
                  </option>
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-emerald-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Statement Generator & Date Filter Widget (Hidden on print) */}
      <div className="no-print glass-card rounded-2xl p-5 border border-slate-800">
        <form onSubmit={handleGenerateStatement} className="flex flex-wrap items-end gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>កាលបរិច្ឆេទចាប់ផ្តើម (From Date)</span>
            </label>
            <input
              type="date"
              value={stmtFrom}
              onChange={(e) => {
                setStmtFrom(e.target.value);
                setPageIndex(1);
              }}
              className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>កាលបរិច្ឆេទបញ្ចប់ (To Date)</span>
            </label>
            <input
              type="date"
              value={stmtTo}
              onChange={(e) => {
                setStmtTo(e.target.value);
                setPageIndex(1);
              }}
              className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isLoadingStatement}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-emerald-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isLoadingStatement ? 'Generating...' : 'View Statement (របាយការណ៍)'}</span>
          </button>
          {(stmtFrom || stmtTo) && (
            <button
              type="button"
              onClick={handleResetDates}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-all border border-slate-700"
              title="Reset date filter to show all transactions"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </form>
        {(stmtFrom || stmtTo) && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Filtering transactions:</span>
            <span className="font-bold underline">{stmtFrom || 'Start'}</span>
            <span>➜</span>
            <span className="font-bold underline">{stmtTo || 'Today'}</span>
          </div>
        )}
      </div>

      {/* OFFICIAL BANK STATEMENT VIEW (Primacy printable view) */}
      {showStatement && statementData && (
        <div className="space-y-4">
          {/* Action Toolbar on Screen (Hidden on Print) */}
          <div className="no-print flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">Official Bank Statement Ready</span>
              <span className="text-slate-400 hidden sm:inline">• Click Print to export or save as clean PDF</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>បោះពុម្ព (Print Statement)</span>
              </button>
              <button
                onClick={() => setShowStatement(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Close Statement"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Official Bank Statement Document Sheet */}
          <div
            id="official-bank-statement"
            className="official-statement-document bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200"
          >
            {/* Header: Bank Branding & Document Meta */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-300">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 shrink-0">
                  <Landmark className="w-8 h-8" />
                </div>
                <div>
                  {/* Khmer bank name on TOP and BIGGER than English */}
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 font-sans leading-tight">
                    ធនាគារ ទ្រាស់ (ខេមបូឌា) ភីអិលស៊ី
                  </h1>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 tracking-wider uppercase mt-0.5">
                    TRUST BANK (CAMBODIA) PLC.
                  </p>
                  <p className="text-xs font-semibold text-emerald-800 tracking-wide mt-1">
                    អាជ្ញាប័ណ្ណធនាគារពាណិជ្ជ • Licensed Commercial Bank
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1 max-w-md leading-relaxed font-sans">
                    National Bank of Cambodia License #B-2024-089 • SWIFT: TRUSKHPPH<br />
                    No. 128 Preah Monivong Blvd, Daun Penh, Phnom Penh, Kingdom of Cambodia<br />
                    Tel: +855 (0)23 999 888 • Web: www.trustbank.com.kh
                  </p>
                </div>
              </div>

              {/* Statement Ref & Meta */}
              <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                <div className="inline-block px-4 py-2 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-200 mb-2 shadow-sm text-center">
                  <div className="font-black text-sm sm:text-base leading-tight">
                    របាយការណ៍គណនីផ្លូវការ
                  </div>
                  <div className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase mt-0.5">
                    OFFICIAL ACCOUNT STATEMENT
                  </div>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>
                    <span className="font-semibold text-slate-700">Statement No:</span>{' '}
                    <span className="font-mono font-bold text-slate-950">
                      STMT-{(statementData.account?.accountNumber || activeAccount?.accountNumber || '840100')}-{new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Issue Date:</span>{' '}
                    <span className="font-mono font-bold text-slate-950">
                      {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Period:</span>{' '}
                    <span className="font-mono font-bold text-emerald-800">
                      {new Date(statementData.fromDate || statementData.periodFrom || stmtFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' — '}
                      {new Date(statementData.toDate || statementData.periodTo || stmtTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer & Account Details Card */}
            <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="space-y-2">
                <div className="border-b border-slate-200 pb-1 flex items-baseline gap-2">
                  <span className="font-black text-xs text-slate-800">ព័ត៌មានម្ចាស់គណនី</span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Account Holder</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">
                    <span className="font-bold text-slate-800">ឈ្មោះអតិថិជន</span> / Name:
                  </span>
                  <span className="font-extrabold text-slate-950 text-sm">{customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">
                    <span className="font-bold text-slate-800">លេខទូរស័ព្ទ</span> / Phone:
                  </span>
                  <span className="font-mono font-semibold text-slate-800">{customerPhone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">
                    <span className="font-bold text-slate-800">លេខសម្គាល់ CIF</span> / CIF:
                  </span>
                  <span className="font-mono font-semibold text-slate-800">{customerCif}</span>
                </div>
              </div>

              <div className="space-y-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                <div className="border-b border-slate-200 pb-1 flex items-baseline gap-2">
                  <span className="font-black text-xs text-slate-800">ព័ត៌មានលម្អិតគណនី</span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Account Particulars</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">
                    <span className="font-bold text-slate-800">លេខគណនី</span> / Account No:
                  </span>
                  <span className="font-mono font-extrabold text-slate-950 text-sm">
                    {statementData.account?.accountNumber || activeAccount?.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">
                    <span className="font-bold text-slate-800">ប្រភេទគណនី</span> / Type:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {getAccountTypeName(statementData.account?.accountType ?? activeAccount?.accountType)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">
                    <span className="font-bold text-slate-800">រូបិយប័ណ្ណ • ស្ថានភាព</span> / Currency:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {stmtCurrencyCode} ({stmtCurrencySymbol}) • {getAccountStatusName(statementData.account?.status ?? activeAccount?.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Summary Ledger (Light / Clean - No Black Boxes) */}
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                <div className="text-xs font-bold text-slate-800">សមតុល្យដើមគ្រា</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Starting Balance</div>
                <div className="text-base font-extrabold text-slate-800 font-mono mt-1 whitespace-nowrap">
                  {stmtCurrencySymbol}{(statementData.startingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 shadow-sm">
                <div className="text-xs font-bold text-emerald-900">សរុបប្រាក់ចូល (+)</div>
                <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">Total Deposits</div>
                <div className="text-base font-extrabold text-emerald-700 font-mono mt-1 whitespace-nowrap">
                  +{stmtCurrencySymbol}{(statementData.totalDeposits || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60 shadow-sm">
                <div className="text-xs font-bold text-rose-900">សរុបប្រាក់ដក (-)</div>
                <div className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider">Total Withdrawals</div>
                <div className="text-base font-extrabold text-rose-700 font-mono mt-1 whitespace-nowrap">
                  -{stmtCurrencySymbol}{(statementData.totalWithdrawals || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border-2 border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm">
                <div className="text-xs font-black text-emerald-900">សមតុល្យចុងគ្រា</div>
                <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Ending Balance</div>
                <div className="text-base sm:text-lg font-black font-mono text-emerald-900 mt-1 whitespace-nowrap">
                  {stmtCurrencySymbol}{(statementData.endingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Detailed Transaction Ledger Table */}
            <div className="mb-8 rounded-xl border border-slate-300 overflow-hidden print:overflow-visible">
              <div className="bg-slate-100 px-4 py-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-300 flex items-center justify-between">
                <span>Account Transaction Entries</span>
                <span className="font-mono text-[10px] font-normal text-slate-500">
                  Total {(statementData.transactions || []).length} Recorded Entries
                </span>
              </div>

              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-2.5 w-[5%] text-center font-bold whitespace-nowrap">#</th>
                      <th className="py-2 px-2.5 w-[18%] whitespace-nowrap">
                        <div className="font-bold text-slate-800">កាលបរិច្ឆេទ</div>
                        <div className="text-[9px] text-slate-500 uppercase">Date & Time</div>
                      </th>
                      <th className="py-2 px-2.5 w-[22%] whitespace-nowrap">
                        <div className="font-bold text-slate-800">លេខប្រតិបត្តិការ</div>
                        <div className="text-[9px] text-slate-500 uppercase">Txn Reference</div>
                      </th>
                      <th className="py-2 px-2.5 w-[20%]">
                        <div className="font-bold text-slate-800">បរិយាយ</div>
                        <div className="text-[9px] text-slate-500 uppercase">Description</div>
                      </th>
                      <th className="py-2 px-2.5 w-[11%] text-right whitespace-nowrap">
                        <div className="font-bold text-rose-800">ឥណពន្ធ (-)</div>
                        <div className="text-[9px] text-rose-600 uppercase">Debit</div>
                      </th>
                      <th className="py-2 px-2.5 w-[11%] text-right whitespace-nowrap">
                        <div className="font-bold text-emerald-800">ឥណទាន (+)</div>
                        <div className="text-[9px] text-emerald-600 uppercase">Credit</div>
                      </th>
                      <th className="py-2 px-2.5 w-[13%] text-right whitespace-nowrap">
                        <div className="font-bold text-slate-900">សមតុល្យ</div>
                        <div className="text-[9px] text-slate-600 uppercase">Balance</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {(!statementData.transactions || statementData.transactions.length === 0) ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 font-sans italic">
                          No transactions recorded for the selected period.
                        </td>
                      </tr>
                    ) : (
                      statementData.transactions.map((t, index) => {
                        const credit = isCredit(t.type);
                        return (
                          <tr key={t.id || index} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5 text-center text-slate-400 font-sans text-[11px] whitespace-nowrap">
                              {index + 1}
                            </td>
                            <td className="py-2 px-2.5 text-slate-700 whitespace-nowrap text-[11px]">
                              {new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {' '}
                              {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2 px-2.5 text-slate-900 font-bold text-[11px] whitespace-nowrap">
                              {t.transactionReference}
                            </td>
                            <td className="py-2 px-2.5 font-sans text-slate-700 text-xs break-words">
                              <span className="font-medium">{t.description || getTypeName(t.type)}</span>
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-rose-700 whitespace-nowrap">
                              {!credit ? `-${stmtCurrencySymbol}${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                              {credit ? `+${stmtCurrencySymbol}${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-slate-950 whitespace-nowrap">
                              {stmtCurrencySymbol}{t.balanceAfter.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {statementData.transactions && statementData.transactions.length > 0 && (
                    <tfoot className="bg-slate-100 font-mono font-bold text-xs border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={4} className="py-2 px-2.5 text-right font-sans uppercase text-slate-700 text-[10px] whitespace-nowrap">
                          Period Totals:
                        </td>
                        <td className="py-2 px-2.5 text-right text-rose-700 whitespace-nowrap">
                          -{stmtCurrencySymbol}{(statementData.totalWithdrawals || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-2.5 text-right text-emerald-700 whitespace-nowrap">
                          +{stmtCurrencySymbol}{(statementData.totalDeposits || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-2.5 text-right text-slate-950 text-sm whitespace-nowrap">
                          {stmtCurrencySymbol}{(statementData.endingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Official Authentication & Branch Stamp Section */}
            <div className="pt-4 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-8 items-end text-xs">
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed font-sans">
                  <div className="font-bold text-slate-800 mb-0.5">
                    កំណត់សម្គាល់សំខាន់ / Important Notice:
                  </div>
                  <div className="text-slate-700">
                    ឯកសារនេះជាឯកសារផ្លូវការរបស់ធនាគារដែលបង្កើតឡើងដោយប្រព័ន្ធកុំព្យូទ័រ។ សូមពិនិត្យរបាយការណ៍នេះឱ្យបានត្រឹមត្រូវ។ រាល់ភាពមិនប្រក្រតីត្រូវជូនដំណឹងជាលាយលក្ខណ៍អក្សរក្នុងរយៈពេល ១៤ ថ្ងៃបន្ទាប់ពីកាលបរិច្ឆេទចេញផ្សាយ។
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    This is a computer-generated official banking document issued by Trust Bank (Cambodia) Plc. Please examine this statement promptly. Any discrepancy or error should be notified in writing within 14 calendar days of issuance.
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 font-sans">
                  <span className="font-bold text-slate-800">រៀបចំដោយ:</span> {user?.fullName || 'Branch Officer'} (Teller Terminal Desk #01)
                </div>
              </div>

              {/* Bank Stamp and Signature */}
              <div className="flex items-center justify-between sm:justify-end gap-6">
                {/* Official Bank Stamp (Simulated Seal) */}
                <div className="w-28 h-28 rounded-full border-4 border-emerald-800/80 p-1 flex items-center justify-center text-center shadow-inner select-none shrink-0 rotate-[-8deg]">
                  <div className="w-full h-full rounded-full border border-dashed border-emerald-700 flex flex-col items-center justify-center p-1 text-emerald-900">
                    <span className="text-[8px] font-black uppercase tracking-tight">TRUST BANK PLC.</span>
                    <span className="text-[7px] font-bold text-emerald-800">★ VERIFIED ★</span>
                    <span className="text-[8px] font-bold font-mono">PHNOM PENH</span>
                    <span className="text-[7px] text-emerald-700">OFFICIAL SEAL</span>
                  </div>
                </div>

                {/* Authorized Officer Signature Line */}
                <div className="text-center w-44">
                  <div className="h-14 flex items-end justify-center font-serif italic text-slate-800 text-lg">
                    {user?.fullName?.split(' ')[0] || 'TrustBank'}
                  </div>
                  <div className="border-t-2 border-slate-700 pt-1">
                    <span className="text-[11px] font-bold text-slate-900 block font-sans">
                      ហត្ថលេខាមានការអនុញ្ញាត
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
                      Authorized Signature
                    </span>
                    <span className="text-[9px] text-slate-500 block font-sans">
                      ប្រធានសាខា / បេឡាធិការ (Branch Manager / Teller)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro Footnote */}
            <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-sans">
              <span>ធនាគារ ទ្រាស់ (ខេមបូឌា) ភីអិលស៊ី • Trust Bank (Cambodia) Plc.</span>
              <span className="font-mono">Document ID: STMT-{(statementData.account?.accountNumber || activeAccount?.accountNumber || '840100')} • Page 1 of 1</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs (Hidden on print) */}
      <div className="no-print flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-slate-500 flex items-center gap-1 pl-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        {[
          { label: 'All Operations', value: '' },
          { label: 'Deposits', value: '1' },
          { label: 'Withdrawals', value: '2' },
          { label: 'Transfers Out', value: '4' },
          { label: 'Transfers In', value: '3' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setTypeFilter(f.value);
              setPageIndex(1);
              showLoading(`Filtering ${f.label}...`, 'Updating transaction records...', 250);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              typeFilter === f.value
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction Table (Hidden on print if statement is open, or clean printable) */}
      <div className={`${showStatement ? 'no-print' : ''} glass-card rounded-2xl overflow-hidden border border-slate-800`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">{t('transactions.reference')}</th>
                <th className="py-3 px-4">{t('transactions.type')}</th>
                <th className="py-3 px-4">{t('transactions.description')}</th>
                <th className="py-3 px-4">{t('transactions.dateTime')}</th>
                <th className="py-3 px-4 text-right">{t('transactions.amount')}</th>
                <th className="py-3 px-4 text-right">{t('transactions.balanceAfter')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {!accountId ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400 font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-emerald-400">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-slate-200 text-sm">
                        {t('transactions.selectAccountPlaceholder') || 'Select Account Number'}
                      </span>
                      <span className="text-xs text-slate-500 max-w-sm font-sans">
                        {t('transactions.pleaseSelectAccount') || 'Please select an account number from the dropdown or search to view transaction records.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    Loading transactions...
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    No transactions found for the selected filter.
                  </td>
                </tr>
              ) : (
                data.items.map((t) => {
                  const credit = isCredit(t.type);
                  const isTxnUsd = t.currency === 'USD' || t.currency === 1;
                  const symbol = isTxnUsd ? '$' : '៛';
                  return (
                    <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 text-slate-300 font-semibold">{t.transactionReference}</td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            credit
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {getTypeName(t.type)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-sans">{t.description || '—'}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${credit ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {credit ? '+' : '-'}{symbol}{t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        {symbol}{t.balanceAfter.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (Hidden on print) */}
        {data && data.totalPages > 1 && (
          <div className="no-print p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Page <strong className="text-white">{data.pageIndex}</strong> of <strong className="text-white">{data.totalPages}</strong> ({data.totalCount} total)
            </div>
            <div className="flex gap-2">
              <button
                disabled={!data.hasPreviousPage}
                onClick={() => setPageIndex((p) => p - 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={!data.hasNextPage}
                onClick={() => setPageIndex((p) => p + 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}