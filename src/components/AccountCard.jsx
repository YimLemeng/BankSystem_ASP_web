import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, ShieldCheck, ShieldAlert, Wifi, Sparkles } from 'lucide-react';

export default function AccountCard({ account, isSelected, onSelect }) {
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!account) return null;

  const isUsd = account.currency === 'USD' || account.currency === 1;
  const currencySymbol = isUsd ? '$' : '៛';
  const currencyCode = isUsd ? 'USD' : 'KHR';

  const getTypeName = (type) => {
    if (type === 'Savings' || type === 1) return 'Savings Account';
    if (type === 'Checking' || type === 2) return 'Checking Account';
    if (type === 'FixedDeposit' || type === 3) return 'Fixed Deposit';
    return 'Bank Account';
  };

  const isFrozen = account.status === 2 || account.status === 'Frozen';
  const isClosed = account.status === 3 || account.status === 'Closed';

  const copyNumber = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(account.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onSelect}
      className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
        isSelected
          ? 'ring-2 ring-emerald-400/80 shadow-xl shadow-emerald-950/40'
          : 'hover:shadow-lg hover:shadow-black/30'
      } ${
        isUsd
          ? 'bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 border border-emerald-500/30'
          : 'bg-gradient-to-br from-sky-900 via-blue-950 to-slate-950 border border-sky-500/30'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

      {/* Header: Chip & Bank Brand */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Simulated EMV Chip */}
          <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 shadow-inner flex items-center justify-center border border-amber-300/40">
            <div className="w-5 h-4 border border-amber-600/30 rounded-sm" />
          </div>
          <Wifi className="w-4 h-4 text-white/50 rotate-90" />
        </div>

        <div className="flex items-center gap-2">
          {isFrozen ? (
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              <ShieldAlert className="w-3 h-3" /> Frozen
            </span>
          ) : isClosed ? (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">
              Closed
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3" /> Active
            </span>
          )}
          <span className="text-xs font-bold tracking-wider text-white/80 uppercase">
            {currencyCode}
          </span>
        </div>
      </div>

      {/* Balance Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-white/60 mb-1">
          <span className="font-medium tracking-wide">Available Balance</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBalance(!showBalance);
            }}
            className="p-1 hover:text-white transition-colors"
            title={showBalance ? 'Hide balance' : 'Show balance'}
          >
            {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-baseline gap-1">
          <span>{currencySymbol}</span>
          <span>
            {showBalance
              ? account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '••••••••'}
          </span>
        </div>
      </div>

      {/* Footer: Account Number & Type */}
      <div className="flex items-end justify-between pt-2 border-t border-white/10">
        <div>
          <div className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">
            {getTypeName(account.accountType)}
          </div>
          <div className="text-sm font-mono tracking-wider text-white font-semibold flex items-center gap-2 mt-0.5">
            <span>{account.accountNumber}</span>
            <button
              onClick={copyNumber}
              className="p-1 hover:text-emerald-300 text-white/50 transition-colors"
              title="Copy account number"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {account.interestRate > 0 && (
          <div className="text-right">
            <span className="text-[10px] text-white/50 uppercase tracking-wider block">Interest</span>
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1 justify-end">
              <Sparkles className="w-3 h-3" /> {account.interestRate}% p.a.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
