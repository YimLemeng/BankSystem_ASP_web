import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useLanguage } from '../context/LanguageContext';
import { Landmark, UserCircle, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { lang, toggleLanguage, t } = useLanguage();

  const getRoleBadge = () => {
    const r = user?.role;
    if (r === 'Admin' || r === 2 || r === 3) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Admin</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">Teller</span>;
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Toggle Sidebar Button */}
        <button
          onClick={toggleSidebar}
          title={t('nav.toggleSidebar')}
          className="p-2 -ml-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700/60"
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-emerald-400" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Landmark className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            TRUST BANK
          </span>
          <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
            {t('nav.appSubtitle')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Toggle Button */}
        <button
          onClick={toggleLanguage}
          title={lang === 'en' ? 'Switch to Khmer (ភាសា​ខ្មែរ)' : 'Switch to English'}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all duration-200 text-xs font-bold select-none
            hover:scale-105 active:scale-95
            bg-slate-900/60 border-slate-700/60 hover:border-emerald-500/60 hover:bg-slate-800/80"
          aria-label="Switch language"
        >
          {lang === 'en' ? (
            <>
              {/* English flag + label */}
              <span className="text-base leading-none" role="img" aria-label="English">🇬🇧</span>
              <span className="hidden sm:inline text-slate-300">EN</span>
              <span className="hidden sm:inline text-slate-600">/</span>
              <span className="hidden sm:inline text-slate-500">ខ្មែរ</span>
            </>
          ) : (
            <>
              {/* Khmer flag + label */}
              <span className="text-base leading-none" role="img" aria-label="Khmer">🇰🇭</span>
              <span className="hidden sm:inline text-emerald-300 font-bold">ខ្មែរ</span>
              <span className="hidden sm:inline text-slate-600">/</span>
              <span className="hidden sm:inline text-slate-500">EN</span>
            </>
          )}
        </button>

        {/* User Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-semibold text-slate-200 flex items-center justify-end gap-1.5">
              {user?.fullName || user?.username || 'User'}
              {getRoleBadge(user?.role)}
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <UserCircle className="w-6 h-6 text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
