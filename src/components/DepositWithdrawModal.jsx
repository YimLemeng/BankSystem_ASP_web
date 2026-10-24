import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { transactionService } from '../services/api';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, RefreshCw, ChevronDown } from 'lucide-react';

export default function DepositWithdrawModal({ isOpen, onClose, mode = 'deposit', targetAccount = null, onSuccess }) {
  const { accounts: authAccounts, refreshAccounts } = useAuth();
  const { showLoading } = useLoading();

  const [accounts, setAccounts] = useState(targetAccount ? [targetAccount] : (authAccounts || []));
  const [accountId, setAccountId] = useState(targetAccount?.id || authAccounts?.[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (targetAccount) {
      setAccounts([targetAccount]);
      setAccountId(targetAccount.id);
    } else if (authAccounts && authAccounts.length > 0) {
      setAccounts(authAccounts);
      setAccountId(authAccounts[0].id);
    }
  }, [targetAccount, authAccounts]);

  const isDeposit = mode === 'deposit';
  const activeAccount = targetAccount || accounts.find((a) => a.id === accountId) || accounts[0];
  const isUsd = activeAccount ? (activeAccount.currency === 'USD' || activeAccount.currency === 1) : true;
  const currencyCode = isUsd ? 'USD' : 'KHR';
  const currencySymbol = isUsd ? '$' : '៛';
  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!activeAccount) {
      setError('Please select an account.');
      return;
    }
    if (numAmount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (!isDeposit && numAmount > activeAccount.balance) {
      setError(`Insufficient balance. Current balance: ${currencySymbol}${activeAccount.balance.toFixed(2)}`);
      return;
    }

    setIsLoading(true);
    showLoading(
      isDeposit ? 'Processing Cash Deposit...' : 'Processing Cash Withdrawal...',
      'Communicating with core banking engine...',
      1200
    );
    try {
      const payload = {
        accountId: activeAccount.id,
        amount: numAmount,
        currency: activeAccount.currency,
        description: description.trim() || (isDeposit ? 'Cash Deposit' : 'Cash Withdrawal'),
        idempotencyKey: `cash-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      };

      const res = isDeposit
        ? await transactionService.deposit(payload)
        : await transactionService.withdraw(payload);

      setSuccess(res.data);
      await refreshAccounts();
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Transaction failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(null);
    setAmount('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={isDeposit ? 'Deposit Funds (Cash In)' : 'Withdraw Funds (Cash Out)'}
    >
      {success ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">
              {isDeposit ? 'Deposit Successful!' : 'Withdrawal Successful!'}
            </h4>
            <p className="text-xs text-slate-400 mt-1">Transaction recorded instantly.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Reference:</span>
              <span className="font-mono font-semibold text-slate-200">{success.transactionReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount:</span>
              <span className={`font-bold ${isDeposit ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isDeposit ? '+' : '-'}{currencySymbol}{numAmount.toFixed(2)} {currencyCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Updated Balance:</span>
              <span className="font-mono text-slate-200">{currencySymbol}{success.balanceAfter.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Account</label>
            <div className="relative">
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full appearance-none py-2.5 pl-3 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id} className="bg-slate-900 text-slate-200">
                    {a.accountNumber} • ({a.currency === 'USD' || a.currency === 1 ? 'USD' : 'KHR'}) — Available: {a.currency === 'USD' || a.currency === 1 ? '$' : '៛'}{(a.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Amount ({currencyCode})</span>
              {activeAccount && !isDeposit && activeAccount.balance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(activeAccount.balance.toString())}
                  className="text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 underline"
                  title="Click to withdraw all remaining balance"
                >
                  Withdraw All ({currencySymbol}{activeAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Note / Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Salary deposit, ATM cash out"
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || numAmount <= 0}
            className={`w-full mt-4 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg ${
              isDeposit
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
            }`}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isDeposit ? (
              <>
                <ArrowDownRight className="w-4 h-4" />
                <span>Confirm Cash Deposit</span>
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                <span>Confirm Cash Withdrawal</span>
              </>
            )}
          </button>
        </form>
      )}
    </Modal>
  );
}
