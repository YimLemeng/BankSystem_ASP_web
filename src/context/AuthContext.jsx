import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, customerService, accountService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [customer, setCustomer] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const loadUserData = async (currentUser) => {
    if (!currentUser) {
      setCustomer(null);
      setAccounts([]);
      setSelectedAccount(null);
      setIsAuthInitializing(false);
      setIsLoading(false);
      return;
    }

    try {
      const custRes = await customerService.getByUserId(currentUser.id);
      if (custRes?.data) {
        setCustomer(custRes.data);
        const accRes = await accountService.getByCustomer(custRes.data.id);
        const accList = accRes?.data || [];
        setAccounts(accList);
        if (accList.length > 0) {
          setSelectedAccount(accList[0]);
        }
      }
    } catch (err) {
      console.log('User profile loaded without customer record:', err.message);
    } finally {
      setIsAuthInitializing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && user) {
      loadUserData(user);
    } else {
      setIsAuthInitializing(false);
      setIsLoading(false);
    }
  }, []);

  const loginPreCheck = async (username, password) => {
    try {
      const res = await authService.loginPreCheck(username, password);
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Invalid username or password.';
      return { success: false, message: msg };
    }
  };

  const loginWithTotp = async (username, password, totpCode) => {
    try {
      const res = await authService.loginWithTotp(username, password, totpCode);
      const { accessToken, refreshToken, user: authUser } = res.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(authUser));

      setUser(authUser);
      await loadUserData(authUser);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Invalid Authenticator code.';
      return { success: false, message: msg };
    }
  };

  const login = async (username, password) => {
    try {
      const res = await authService.login(username, password);
      const { accessToken, refreshToken, user: authUser } = res.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(authUser));

      setUser(authUser);
      await loadUserData(authUser);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Invalid username or password.';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await authService.revokeToken(refreshToken);
      } catch (e) {
        
      }
    }
    localStorage.clear();
    setUser(null);
    setCustomer(null);
    setAccounts([]);
    setSelectedAccount(null);
  };

  const refreshAccounts = async () => {
    if (customer?.id) {
      try {
        const accRes = await accountService.getByCustomer(customer.id);
        const accList = accRes?.data || [];
        setAccounts(accList);
        if (selectedAccount) {
          const updated = accList.find((a) => a.id === selectedAccount.id);
          if (updated) setSelectedAccount(updated);
        } else if (accList.length > 0) {
          setSelectedAccount(accList[0]);
        }
      } catch (err) {
        console.error('Failed to refresh accounts:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        customer,
        accounts,
        selectedAccount,
        setSelectedAccount,
        isAuthInitializing,
        isLoading,
        isAuthenticated: !!user,
        role: user?.role, 
        isAdmin: user?.role === 'Admin' || user?.role === 2 || user?.role === 3,
        isStaff: true,
        login,
        loginPreCheck,
        loginWithTotp,
        logout,
        refreshAccounts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
