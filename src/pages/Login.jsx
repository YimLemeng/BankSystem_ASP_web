import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Landmark,
  User,
  Lock,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  Copy,
  Check,
  QrCode,
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { loginPreCheck, loginWithTotp } = useAuth();

  // Credentials form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 2FA / TOTP Authenticator state
  const [step, setStep] = useState('credentials'); // 'credentials' | 'totp'
  const [totpData, setTotpData] = useState(null);
  const [totpDigits, setTotpDigits] = useState(['', '', '', '', '', '']);
  const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  // References for 6 digit inputs
  const digitInputRefs = useRef([]);

  // Handle Step 1: Username & Password pre-check
  const handlePreCheck = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    const res = await loginPreCheck(username.trim(), password);
    setIsLoading(false);

    if (res.success) {
      setTotpData(res.data);
      setStep('totp');
      setTotpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 150);
    } else {
      setError(res.message);
    }
  };

  // Handle 6-digit input changes & Auto-verify
  const handleDigitChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '');

    // Handle paste of full 6 digits
    if (cleanValue.length === 6) {
      const newDigits = cleanValue.split('').slice(0, 6);
      setTotpDigits(newDigits);
      triggerAutoVerify(cleanValue);
      return;
    }

    const singleDigit = cleanValue.slice(-1);
    const newDigits = [...totpDigits];
    newDigits[index] = singleDigit;
    setTotpDigits(newDigits);

    // Auto-advance to next box
    if (singleDigit && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when 6th digit is entered
    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      triggerAutoVerify(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !totpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  // Auto-verify without clicking verify button
  const triggerAutoVerify = async (fullCode) => {
    if (isVerifyingTotp) return;
    setError('');
    setIsVerifyingTotp(true);

    try {
      const res = await loginWithTotp(username.trim(), password, fullCode);
      if (res.success) {
        setVerifySuccess(true);
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 500);
      } else {
        setIsVerifyingTotp(false);
        setError(res.message || 'Invalid 6-digit security code. Please try again.');
        setTotpDigits(['', '', '', '', '', '']);
        setTimeout(() => {
          digitInputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (err) {
      setIsVerifyingTotp(false);
      setError('Verification failed. Please try again or use Super Key.');
      setTotpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 100);
    }
  };

  const handleCopySecretKey = () => {
    if (!totpData?.totpSecretKey) return;
    navigator.clipboard.writeText(totpData.totpSecretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleBackToLogin = () => {
    setStep('credentials');
    setPassword('');
    setError('');
    setTotpDigits(['', '', '', '', '', '']);
    setTotpData(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden select-none">
      {/* Background ambient radial glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 items-center justify-center shadow-xl shadow-emerald-500/25 mb-3 border border-emerald-300/40 transform hover:scale-105 transition-transform duration-300">
            <Landmark className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white font-sans">
            TRUST BANK
          </h1>
          <p className="text-xs font-semibold text-emerald-400/90 tracking-wider uppercase mt-0.5">
            Enterprise Core Banking Portal
          </p>
        </div>

        {/* Main Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/60 backdrop-blur-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 text-center font-medium animate-fadeIn flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {step === 'credentials' ? (
            /* ================= STEP 1: CREDENTIALS ================= */
            <div className="animate-fadeIn">
              <div className="mb-6 pb-4 border-b border-slate-800/80 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Secure Staff Authentication</span>
                </div>
                <h2 className="text-base font-bold text-white">
                  ចូលប្រើប្រព័ន្ធធនាគារ (Sign In)
                </h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter your assigned teller credentials to continue
                </p>
              </div>

              <form onSubmit={handlePreCheck} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Username (ឈ្មោះគណនី)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin or teller"
                      className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 placeholder:text-slate-600 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password (ពាក្យសម្ងាត់)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 placeholder:text-slate-600 transition-all font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors p-1 focus:outline-none"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>បន្តទៅផ្ទៀងផ្ទាត់ 2FA (Continue)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Register Link */}
              <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
                <span className="text-xs text-slate-400">Need a teller account? </span>
                <Link to="/register" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline">
                  Register User
                </Link>
              </div>
            </div>
          ) : (
            /* ================= STEP 2: HIGH-END 2FA SECURITY SCANNER ================= */
            <div className="animate-fadeIn">
              {/* Header: Professional Security Authorization */}
              <div className="mb-4 pb-3 border-b border-slate-800 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ការផ្ទៀងផ្ទាត់សុវត្ថិភាព ២ ជាន់ (2FA)</span>
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  ស្កេនកូដសុវត្ថិភាពចូលប្រព័ន្ធ
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  ស្កេន QR Code ដើម្បីផ្ទៀងផ្ទាត់សុវត្ថិភាព • Scan QR code to authorize session
                </p>
              </div>

              {/* High-Tech QR Code Frame with Cyber Corners */}
              {totpData?.totpSetupQrBase64 && (
                <div className="mb-4 flex flex-col items-center">
                  <div className="relative p-3 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
                    {/* Top-left corner */}
                    <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-emerald-400 rounded-tl-sm pointer-events-none" />
                    {/* Top-right corner */}
                    <span className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-emerald-400 rounded-tr-sm pointer-events-none" />
                    {/* Bottom-left corner */}
                    <span className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-emerald-400 rounded-bl-sm pointer-events-none" />
                    {/* Bottom-right corner */}
                    <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-emerald-400 rounded-br-sm pointer-events-none" />

                    {/* QR Image Container */}
                    <div className="relative bg-white p-2 rounded-xl shadow-inner overflow-hidden">
                      <img
                        src={`data:image/png;base64,${totpData.totpSetupQrBase64}`}
                        alt="Security QR Code"
                        className="w-40 h-40 object-contain block"
                      />
                    </div>
                  </div>

                  {/* Secret Key with Copy Pill */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                      Key: <strong className="text-slate-200">{totpData.totpSecretKey?.slice(0, 10)}...</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySecretKey}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1 text-[10px] font-semibold border border-slate-700"
                      title="Copy Secret Key"
                    >
                      {copiedKey ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 6-Digit Code Input Section */}
              <div className="space-y-3">
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-200 block">
                    បញ្ចូលលេខកូដសម្ងាត់ ៦ ខ្ទង់ (Security Code)
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
                    វាយគ្រប់ ៦ ខ្ទង់ ប្រព័ន្ធនឹងចូលដោយស្វ័យប្រវត្តិ
                  </span>
                </div>

                <div className="flex justify-center gap-2 sm:gap-2.5">
                  {totpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (digitInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={isVerifyingTotp || verifySuccess}
                      className="w-11 h-13 text-center text-xl font-bold font-mono rounded-xl bg-slate-900 border-2 border-slate-700/80 text-white focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 shadow-md transition-all disabled:opacity-50"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {/* Status Indicator */}
                <div className="h-6 flex items-center justify-center text-xs">
                  {verifySuccess ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ផ្ទៀងផ្ទាត់ជោគជ័យ! កំពុងចូលប្រព័ន្ធ...</span>
                    </div>
                  ) : isVerifyingTotp ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>កំពុងផ្ទៀងផ្ទាត់កូដ... (Verifying...)</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Back to Sign In */}
              <div className="mt-5 pt-4 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  disabled={isVerifyingTotp || verifySuccess}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ត្រឡប់ក្រោយ (Back to Sign In)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}