import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useLoading } from './context/LoadingContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AccountsPage from './pages/AccountsPage';
import TransfersPage from './pages/TransfersPage';
import TransactionsPage from './pages/TransactionsPage';
import ProfilePage from './pages/ProfilePage';
import StaffPortal from './pages/StaffPortal';
import AuditLogsPage from './pages/AuditLogsPage';
import UsersPage from './pages/UsersPage';

// Route Transition Watcher for smooth loading across all pages
const RouteTransitionWatcher = () => {
  const location = useLocation();
  const { showLoading, hideLoading } = useLoading();
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      const getPageName = (path) => {
        if (path === '/') return 'Branch Overview';
        if (path.includes('accounts')) return 'Customer Accounts';
        if (path.includes('transfers')) return 'Teller Counter';
        if (path.includes('transactions')) return 'Account Statements';
        if (path.includes('staff')) return 'Customer KYC & Moderation';
        if (path.includes('users')) return 'System Users';
        if (path.includes('audit-logs')) return 'Branch Audit Trail';
        if (path.includes('profile')) return 'Staff Security & Profile';
        return 'Banking Portal';
      };
      showLoading(`Loading ${getPageName(location.pathname)}...`, 'Please wait while the request is processing.');
      const timer = setTimeout(() => {
        hideLoading();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, showLoading, hideLoading]);

  return null;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAuthInitializing } = useAuth();

  if (isAuthInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-mono text-sm">
        Authenticating Bank Session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Guest Only Route Component (Login, Register)
// If user is already authenticated, they CANNOT view or go back to login/register.
const GuestOnlyRoute = ({ children }) => {
  const { isAuthenticated, isAuthInitializing } = useAuth();

  if (isAuthInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-mono text-sm">
        Authenticating Bank Session...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Admin Only Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, isAuthInitializing } = useAuth();

  if (isAuthInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-mono text-sm">
        Authenticating Bank Session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main Application Layout - Sidebar stays fixed, only main content scrolls
const AppLayout = ({ children }) => {
  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  // Prevent BFCache / back-forward cache retaining authenticated views after logout
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  return (
    <>
      <RouteTransitionWatcher />
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnlyRoute>
              <Login />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnlyRoute>
              <Register />
            </GuestOnlyRoute>
          }
        />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/accounts"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AccountsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/transfers"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TransfersPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TransactionsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff"
        element={
          <ProtectedRoute>
            <AppLayout>
              <StaffPortal />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <AdminRoute>
            <AppLayout>
              <UsersPage />
            </AppLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/audit-logs"
        element={
          <AdminRoute>
            <AppLayout>
              <AuditLogsPage />
            </AppLayout>
          </AdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
