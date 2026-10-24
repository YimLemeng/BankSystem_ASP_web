import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { auditService } from '../services/api';
import { ShieldAlert, RefreshCw, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function AuditLogsPage() {
  const { isStaff } = useAuth();
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await auditService.getLogs({ pageIndex, pageSize: 20 });
      setLogs(res.data?.items || []);
      setTotalCount(res.data?.totalCount || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isStaff) fetchLogs();
  }, [pageIndex, isStaff]);

  if (!isStaff) {
    return (
      <div className="p-8 text-center text-slate-400">
        Access Denied. Only staff can view system audit logs.
      </div>
    );
  }

  const getActionBadge = (action) => {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-amber-300 border border-slate-700">
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>{t('audit.title')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('audit.subtitle')}
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          title={t('common.refresh')}
          className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">{t('audit.action')}</th>
                <th className="py-3 px-4">{t('audit.entity')}</th>
                <th className="py-3 px-4">{t('audit.detail')}</th>
                <th className="py-3 px-4">{t('audit.phoneMasked')}</th>
                <th className="py-3 px-4">{t('audit.ipAddress')}</th>
                <th className="py-3 px-4 text-right">{t('audit.dateTime')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    Loading audit stream...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-sans">{getActionBadge(l.action)}</td>
                    <td className="py-3 px-4 text-slate-400 font-sans">{l.entityName}</td>
                    <td className="py-3 px-4 text-slate-200 font-sans max-w-xs truncate" title={l.details}>
                      {l.details}
                    </td>
                    <td className="py-3 px-4 text-emerald-400">{l.maskedPhoneNumber || '—'}</td>
                    <td className="py-3 px-4 text-slate-400">{l.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                      {new Date(l.createdAt).toLocaleDateString()} {new Date(l.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Page <strong className="text-white">{pageIndex}</strong> of <strong className="text-white">{totalPages}</strong> ({totalCount} entries)
            </div>
            <div className="flex gap-2">
              <button
                disabled={pageIndex <= 1}
                onClick={() => setPageIndex((p) => p - 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pageIndex >= totalPages}
                onClick={() => setPageIndex((p) => p + 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 disabled:opacity-40"
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
