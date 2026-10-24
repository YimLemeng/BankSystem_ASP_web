import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { accountService, customerService } from '../services/api';
import {
  Building2,
  Wallet,
  Users,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  PlusCircle,
  CreditCard,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBranchData = async () => {
    setIsLoading(true);
    try {
      const [accRes, custRes] = await Promise.all([
        accountService.getAll().catch(() => ({ data: [] })),
        customerService.getAll().catch(() => ({ data: [] })),
      ]);
      setAccounts(accRes?.data || []);
      setCustomers(custRes?.data || []);
    } catch (err) {
      console.error('Failed to load branch metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranchData();
  }, []);

  // Compute branch metrics
  const totalUsdBalance = accounts
    .filter((a) => a.currency === 'USD' || a.currency === 1)
    .reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);

  const totalKhrBalance = accounts
    .filter((a) => a.currency === 'KHR' || a.currency === 2)
    .reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);

  const activeAccountsCount = accounts.filter(
    (a) => a.status === 'Active' || a.status === 1
  ).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{t('dashboard.welcome')}, {user?.fullName || 'Staff Officer'}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              {t('dashboard.branchDesk')}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={loadBranchData}
          title="Refresh Branch Metrics"
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors self-start"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total USD Deposits */}
        <div className="group glass-card rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/60 hover:bg-gradient-to-br hover:from-emerald-950/40 hover:via-slate-900/70 hover:to-slate-950 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/20 relative overflow-hidden transition-all duration-300 transform hover:-translate-y-1 cursor-default">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-emerald-500/15 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-300 uppercase tracking-wider transition-colors">
              {t('dashboard.usdVault')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold group-hover:bg-emerald-500/25 group-hover:border-emerald-500/50 group-hover:scale-110 transition-all duration-300 shadow-sm">
              $
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white group-hover:text-emerald-100 font-mono relative z-10 transition-colors">
            ${totalUsdBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-emerald-400 font-medium mt-2 flex items-center gap-1 relative z-10">
            <TrendingUp className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <span>Multi-account Reserve</span>
          </p>
        </div>

        {/* Total KHR Deposits */}
        <div className="group glass-card rounded-2xl p-5 border border-slate-800 hover:border-blue-500/60 hover:bg-gradient-to-br hover:from-blue-950/40 hover:via-slate-900/70 hover:to-slate-950 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 relative overflow-hidden transition-all duration-300 transform hover:-translate-y-1 cursor-default">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-blue-500/15 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-blue-300 uppercase tracking-wider transition-colors">
              {t('dashboard.khrVault')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold group-hover:bg-blue-500/25 group-hover:border-blue-500/50 group-hover:scale-110 transition-all duration-300 shadow-sm">
              ៛
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white group-hover:text-blue-100 font-mono relative z-10 transition-colors">
            ៛{totalKhrBalance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <p className="text-[10px] text-blue-400 font-medium mt-2 flex items-center gap-1 relative z-10">
            <TrendingUp className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <span>Local Currency Reserve</span>
          </p>
        </div>

        {/* Customer Accounts */}
        <div className="group glass-card rounded-2xl p-5 border border-slate-800 hover:border-purple-500/60 hover:bg-gradient-to-br hover:from-purple-950/40 hover:via-slate-900/70 hover:to-slate-950 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 relative overflow-hidden transition-all duration-300 transform hover:-translate-y-1 cursor-default">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-purple-500/15 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-purple-300 uppercase tracking-wider transition-colors">
              {t('dashboard.customerAccounts')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:bg-purple-500/25 group-hover:border-purple-500/50 group-hover:scale-110 transition-all duration-300 shadow-sm">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white group-hover:text-purple-100 font-mono relative z-10 transition-colors">
            {accounts.length}
          </div>
          <p className="text-[10px] text-slate-400 group-hover:text-purple-300/80 font-medium mt-2 relative z-10 transition-colors">
            {activeAccountsCount} {t('dashboard.active')} • {accounts.length - activeAccountsCount} {t('dashboard.frozenClosed')}
          </p>
        </div>

        {/* Total Registered Clients */}
        <div className="group glass-card rounded-2xl p-5 border border-slate-800 hover:border-amber-500/60 hover:bg-gradient-to-br hover:from-amber-950/40 hover:via-slate-900/70 hover:to-slate-950 shadow-xl hover:shadow-2xl hover:shadow-amber-500/20 relative overflow-hidden transition-all duration-300 transform hover:-translate-y-1 cursor-default">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-amber-500/15 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-amber-300 uppercase tracking-wider transition-colors">
              {t('dashboard.registeredClients')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:bg-amber-500/25 group-hover:border-amber-500/50 group-hover:scale-110 transition-all duration-300 shadow-sm">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white group-hover:text-amber-100 font-mono relative z-10 transition-colors">
            {customers.length}
          </div>
          <p className="text-[10px] text-amber-400 font-medium mt-2 flex items-center gap-1 relative z-10">
            <ShieldCheck className="w-3 h-3 group-hover:scale-110 transition-transform" />
            <span>{t('dashboard.kycVerifiedProfiles')}</span>
          </p>
        </div>
      </div>

      {/* Quick Teller Operations Shortcuts */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{t('dashboard.quickActions')}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('dashboard.quickActionsSubtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/transfers"
            className="group p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ArrowDownRight className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
              {t('dashboard.cashDeposit')}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t('dashboard.cashDepositDesc')}
            </p>
          </Link>

          <Link
            to="/transfers"
            className="group p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
              {t('dashboard.cashWithdrawal')}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t('dashboard.cashWithdrawalDesc')}
            </p>
          </Link>

          <Link
            to="/transfers"
            className="group p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
              {t('dashboard.accountTransfer')}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t('dashboard.accountTransferDesc')}
            </p>
          </Link>

          <Link
            to="/accounts"
            className="group p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-teal-500/50 transition-all hover:shadow-lg hover:shadow-teal-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">
              {t('dashboard.openClientAccount')}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t('dashboard.openClientAccountDesc')}
            </p>
          </Link>
        </div>
      </div>

      {/* Customer Accounts Preview */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>{t('dashboard.recentAccounts')}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('dashboard.recentAccountsSubtitle')}
            </p>
          </div>

          <Link
            to="/accounts"
            className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>{t('dashboard.viewAll')} ({accounts.length})</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-[10px] uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">{t('dashboard.accountNumber')}</th>
                <th className="py-2.5 px-3">{t('dashboard.type')}</th>
                <th className="py-2.5 px-3">{t('dashboard.currency')}</th>
                <th className="py-2.5 px-3 text-right">{t('dashboard.balance')}</th>
                <th className="py-2.5 px-3 text-center">{t('dashboard.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {accounts.slice(0, 5).map((acc) => {
                const isFrozen = acc.status === 'Frozen' || acc.status === 2;
                const isClosed = acc.status === 'Closed' || acc.status === 3;
                const isInactive = acc.status === 'Inactive' || acc.status === 4;
                const isUsd = acc.currency === 'USD' || acc.currency === 1;

                return (
                  <tr key={acc.id} className="hover:bg-slate-900/30">
                    <td className="py-3 px-3 text-white font-bold">{acc.accountNumber}</td>
                    <td className="py-3 px-3 font-sans text-slate-300">
                      {acc.accountType === 'Savings' || acc.accountType === 1
                        ? t('dashboard.savings')
                        : acc.accountType === 'Checking' || acc.accountType === 2
                        ? t('dashboard.checking')
                        : t('dashboard.fixedDeposit')}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {isUsd ? 'USD' : 'KHR'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-white font-bold">
                      {isUsd ? '$' : '៛'}
                      {acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      {isFrozen ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">
                          {t('dashboard.frozen')}
                        </span>
                      ) : isClosed ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-semibold">
                          {t('dashboard.closed')}
                        </span>
                      ) : isInactive ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                          {t('dashboard.inactive')}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                          {t('dashboard.active')}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
