import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ShieldCheck, RefreshCw, KeyRound } from 'lucide-react';

export default function OtpModal({
  isOpen,
  onClose,
  phoneNumber,
  purposeTitle = 'Transaction Verification',
  onVerify,
  onResend,
  isLoading = false,
}) {
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer;
    if (isOpen) {
      setCode('');
      setError('');
      setCountdown(60);
      setCanResend(false);

      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }
    setError('');
    const res = await onVerify(code);
    if (res && !res.success) {
      setError(res.message || 'Verification failed.');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(60);
    setError('');
    if (onResend) await onResend();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={purposeTitle}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-300">
            A 6-digit security code has been dispatched via SMS to:
          </p>
          <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
            {phoneNumber}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Code expires in 5 minutes</p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <span>Demo Master OTP:</span>
            <button
              type="button"
              onClick={() => { setCode('123456'); setError(''); }}
              className="font-mono text-emerald-400 font-bold hover:underline bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 transition-colors"
            >
              123456 (Click to Fill)
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 text-center font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
            Enter 6-Digit Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
            className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Verify & Continue</span>
            </>
          )}
        </button>

        <div className="text-center pt-2 border-t border-slate-800">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
            >
              Didn't receive code? Resend SMS
            </button>
          ) : (
            <span className="text-xs text-slate-500">
              Resend code in <strong className="text-slate-400 font-mono">{countdown}s</strong>
            </span>
          )}
        </div>
      </form>
    </Modal>
  );
}
