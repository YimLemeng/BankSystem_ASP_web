import React, { useState } from 'react';
import Modal from './Modal';
import OtpModal from './OtpModal';
import { useAuth } from '../context/AuthContext';
import { transactionService, authService } from '../services/api';
import { ArrowRight, ShieldAlert, CheckCircle2, RefreshCw, ChevronDown } from 'lucide-react';

export default function TransferModal({ isOpen, onClose, onSuccess }) {
  const { user, accounts, selectedAccount, refreshAccounts } = useAuth();

  const [sourceId, setSourceId] = useState(selectedAccount?.id || accounts[0]?.id || '');
  const [targetAccountNumber, setTargetAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  // 2FA state
  const [showOtp, setShowOtp] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const activeSource = accounts.find((a) => a.id === sourceId) || selectedAccount || accounts[0];
  const isUsd = activeSource ? (activeSource.currency === 'USD' || activeSource.currency === 1) : true;
  const currencyCode = isUsd ? 'USD' : 'KHR';
  const currencySymbol = isUsd ? '$' : '៛';
  const highValueThreshold = isUsd ? 1000 : 4000000;
  const numAmount = parseFloat(amount) || 0;
  const isHighValue = numAmount >= highValueThreshold;

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    setError('');

    if (!activeSource) {
      setError('Please select an active source account.');
      return;
    }
    if (!targetAccountNumber.trim()) {
      setError('Please enter a target account number or select one.');
      return;
    }
    if (numAmount <= 0) {
      setError('Transfer amount must be greater than zero.');
      return;
    }
    if (numAmount > activeSource.balance) {
      setError(`Insufficient balance. Current balance: ${currencySymbol}${activeSource.balance.toFixed(2)}`);
      return;
    }

    // Lookup target account Id (either by looking in our accounts, or asking backend)
    // To transfer, backend requires targetAccountId (Guid).
    // Let's resolve targetAccountId:
    let targetAccId = targetAccountNumber;
    const ownTarget = accounts.find((a) => a.accountNumber === targetAccountNumber.trim() || a.id === targetAccountNumber.trim());
    if (ownTarget) {
      targetAccId = ownTarget.id;
    }

    const payload = {
      sourceAccountId: activeSource.id,
      targetAccountId: targetAccId,
      amount: numAmount,
      currency: activeSource.currency,
      description: description.trim() || 'Fund Transfer',
      idempotencyKey: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };

    if (isHighValue) {
      // High value requires OTP (purpose 3 = TransactionConfirm)
      setIsLoading(true);
      try {
        await authService.requestOtp(user.phoneNumber, 3);
        setPendingPayload(payload);
        setShowOtp(true);
      } catch (err) {
        setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to request 2FA OTP.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Standard transfer without 2FA
    await executeTransfer(payload);
  };

  const executeTransfer = async (payload, otpCode = null) => {
    setIsLoading(true);
    setError('');
    try {
      const finalPayload = otpCode ? { ...payload, otpCode } : payload;
      const res = await transactionService.transfer(finalPayload);
      setSuccessData(res.data);
      await refreshAccounts();
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Transfer failed.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
    return { success: true };
  };

  const handleVerifyOtp = async (code) => {
    const res = await executeTransfer(pendingPayload, code);
    if (res.success) {
      setShowOtp(false);
    }
    return res;
  };

  const handleReset = () => {
    setSuccessData(null);
    setAmount('');
    setDescription('');
    setTargetAccountNumber('');
    setError('');
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen && !showOtp} onClose={handleReset} title="Transfer Funds" maxWidth="max-w-lg">
        {successData ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Transfer Completed!</h4>
              <p className="text-xs text-slate-400 mt-1">Transaction has been successfully processed.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono font-semibold text-slate-200">{successData.transactionReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Sent:</span>
                <span className="font-bold text-emerald-400">
                  {currencySymbol}{numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currencyCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remaining Balance:</span>
                <span className="font-mono text-slate-200">
                  {currencySymbol}{successData.balanceAfter.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
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
          <form onSubmit={handleInitiateTransfer} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Source Account */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">From Account</label>
              <div className="relative">
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full appearance-none py-2.5 pl-3 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} className="bg-slate-900 text-slate-200">
                      {a.currency === 'USD' || a.currency === 1 ? 'USD' : 'KHR'} • {a.accountNumber} — Balance: {a.currency === 'USD' || a.currency === 1 ? '$' : '៛'}{a.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Target Account */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>To Account</span>
                {accounts.length > 1 && (
                  <span className="text-slate-500 font-normal">Own account or other bank account</span>
                )}
              </div>
              <input
                type="text"
                value={targetAccountNumber}
                onChange={(e) => setTargetAccountNumber(e.target.value)}
                placeholder="Enter target account number or ID"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                required
              />
              {/* Quick pills for other own accounts */}
              {accounts.filter((a) => a.id !== sourceId).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 py-1">Transfer to own:</span>
                  {accounts
                    .filter((a) => a.id !== sourceId && a.currency === activeSource.currency)
                    .map((own) => (
                      <button
                        key={own.id}
                        type="button"
                        onClick={() => setTargetAccountNumber(own.id)}
                        className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700"
                      >
                        {own.accountNumber} ({own.currency === 'USD' || own.currency === 1 ? 'USD' : 'KHR'})
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Amount ({currencyCode})</span>
                <span className="text-slate-500 text-[11px]">Fee: $0.00 (Free)</span>
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

              {/* 2FA Notice badge */}
              {isHighValue && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-300 leading-tight">
                    High-value transfer (≥ {currencySymbol}{highValueThreshold.toLocaleString()}): Requires SMS 2FA confirmation code.
                  </p>
                </div>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Note</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Rent payment, bill, gift"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !targetAccountNumber || numAmount <= 0}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Proceed to Send</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </Modal>

      {/* 2FA Modal */}
      <OtpModal
        isOpen={showOtp}
        onClose={() => setShowOtp(false)}
        phoneNumber={user?.phoneNumber}
        purposeTitle="2FA Transfer Confirmation"
        onVerify={handleVerifyOtp}
        onResend={() => authService.requestOtp(user.phoneNumber, 3)}
        isLoading={isLoading}
      />
    </>
  );
}
