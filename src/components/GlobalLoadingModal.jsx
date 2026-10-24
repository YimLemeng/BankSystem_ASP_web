import React from 'react';
import { useLoading } from '../context/LoadingContext';

export default function GlobalLoadingModal() {
  const { isLoading, message, subtitle } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="no-print print:hidden fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn transition-all">
      <div className="glass-card rounded-2xl shadow-2xl border border-slate-700/70 p-7 max-w-sm w-full mx-4 text-center relative overflow-hidden transform animate-scaleUp">
        {/* Subtle emerald fintech glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-20 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Spinner styled like Dashboard */}
        <div className="relative w-10 h-10 mx-auto mb-4">
          <div className="w-10 h-10 rounded-full border-2 border-slate-700/90 border-t-emerald-400 animate-spin shadow-lg shadow-emerald-500/20" />
        </div>

        {/* Title in Dashboard White */}
        <h3 className="text-base font-bold text-white tracking-tight mb-1">
          {message || 'Loading...'}
        </h3>

        {/* Subtitle in Dashboard Slate */}
        <p className="text-xs text-slate-400 font-medium">
          {subtitle || 'Please wait while the request is processing.'}
        </p>
      </div>
    </div>
  );
}
