import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useLanguage } from '../context/LanguageContext';
import Modal from './Modal';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  FileText,
  UserCheck,
  ShieldAlert,
  Users,
  UserCog,
  LogOut,
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const { isAdmin, logout } = useAuth();
  const { isCollapsed } = useSidebar();
  const { t } = useLanguage();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const tellerLinks = [
    { to: '/', label: t('sidebar.links.dashboard'), icon: LayoutDashboard },
    { to: '/transfers', label: t('sidebar.links.transfers'), icon: ArrowLeftRight },
    { to: '/accounts', label: t('sidebar.links.accounts'), icon: Wallet },
    { to: '/transactions', label: t('sidebar.links.transactions'), icon: FileText },
  ];

  const adminLinks = [
    { to: '/staff', label: t('sidebar.links.staff'), icon: Users },
    ...(isAdmin ? [{ to: '/users', label: t('sidebar.links.users') || 'System Users', icon: UserCog }] : []),
    ...(isAdmin ? [{ to: '/audit-logs', label: t('sidebar.links.auditLogs'), icon: ShieldAlert }] : []),
    { to: '/profile', label: t('sidebar.links.profile'), icon: UserCheck },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } border-r border-slate-800 bg-slate-950/70 backdrop-blur-md flex flex-col justify-between p-3.5 hidden md:flex shrink-0 h-full overflow-hidden transition-all duration-300 ease-in-out select-none`}
    >
      {/* Top / Nav Sections */}
      <div className="space-y-6 overflow-y-auto no-scrollbar">
        {/* Teller Operations */}
        <div>
          {!isCollapsed ? (
            <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-opacity duration-200">
              {t('sidebar.tellerOps')}
            </div>
          ) : (
            <div className="h-4 my-1 border-b border-slate-800/80" />
          )}

          <nav className="space-y-1.5">
            {tellerLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  title={isCollapsed ? link.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${
                      isCollapsed ? 'justify-center px-0' : 'gap-3 px-3.5'
                    } py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  {!isCollapsed && <span className="truncate">{link.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Branch Management */}
        <div>
          {!isCollapsed ? (
            <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-amber-500/80 uppercase flex items-center justify-between transition-opacity duration-200">
              <span>{t('sidebar.branchMgmt')}</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20 font-mono">
                {t('sidebar.staffBadge')}
              </span>
            </div>
          ) : (
            <div className="h-4 my-1 border-b border-slate-800/80" />
          )}

          <nav className="space-y-1.5">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  title={isCollapsed ? link.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${
                      isCollapsed ? 'justify-center px-0' : 'gap-3 px-3.5'
                    } py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  {!isCollapsed && <span className="truncate">{link.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Area: Logout */}
      <div className="pt-3 border-t border-slate-800/80 shrink-0">
        <button
          onClick={handleLogoutClick}
          title={t('sidebar.logout')}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-0' : 'justify-start px-3.5'
          } py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all duration-200 group`}
        >
          <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
          {!isCollapsed && (
            <span className="ml-3 truncate font-medium">{t('sidebar.logout')}</span>
          )}
        </button>
      </div>

      {/* Logout Confirmation Modal (Yes/No Question) */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title={t('sidebar.logoutConfirmTitle')}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              {t('sidebar.logoutConfirmHeading')}
            </h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
              {t('sidebar.logoutConfirmDesc')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              {t('sidebar.cancelBtn')}
            </button>
            <button
              type="button"
              onClick={confirmLogout}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 active:scale-[0.98] transition-all"
            >
              {t('sidebar.confirmLogoutBtn')}
            </button>
          </div>
        </div>
      </Modal>
    </aside>
  );
}
