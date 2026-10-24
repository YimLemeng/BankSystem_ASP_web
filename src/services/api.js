import axios from 'axios';
import { loadingEvent } from './loadingEvent';

const getLoadingMessage = (url = '', method = 'get') => {
  const m = method.toLowerCase();
  const u = url.toLowerCase();

  if (u.includes('/transactions/deposit')) return 'Processing Cash Deposit...';
  if (u.includes('/transactions/withdraw')) return 'Processing Cash Withdrawal...';
  if (u.includes('/transactions/transfer')) return 'Executing Account Transfer...';
  if (u.includes('/accounts') && u.includes('/close')) return 'Closing Customer Account...';
  if (u.includes('/accounts') && u.includes('/freeze')) return 'Freezing Customer Account...';
  if (u.includes('/accounts') && u.includes('/unfreeze')) return 'Unfreezing Customer Account...';
  if (u.includes('/accounts') && m === 'post') return 'Opening New Customer Account...';
  if (u.includes('/customers') && m === 'post') return 'Creating Customer Profile (KYC)...';
  if (u.includes('/auth/login')) return 'Authenticating Staff Session...';
  if (u.includes('/auth/otp')) return 'Dispatching Verification Code...';
  if (u.includes('/accounts') && m === 'get') return 'Loading Customer Accounts...';
  if (u.includes('/customers') && m === 'get') return 'Loading Customer KYC & Profiles...';
  if (u.includes('/transactions') && m === 'get') return 'Loading Transaction Records...';
  if (u.includes('/users') && m === 'get') return 'Loading System Users...';
  if (u.includes('/audit-logs')) return 'Loading Branch Audit Trail...';
  return 'Processing Request...';
};

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    config._emittedLoading = true;
    loadingEvent.emit('start', { message: config.loadingMessage || getLoadingMessage(config.url, config.method) });

    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    loadingEvent.emit('end');
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    if (response.config?._emittedLoading) {
      loadingEvent.emit('end');
    }
    return response;
  },
  async (error) => {
    if (error.config?._emittedLoading) {
      loadingEvent.emit('end');
    }
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh-token')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post('/api/v1/auth/refresh-token', { refreshToken });
        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },
  loginPreCheck: async (username, password) => {
    const res = await api.post('/auth/login/pre-check', { username, password });
    return res.data;
  },
  loginWithTotp: async (username, password, totpCode) => {
    const res = await api.post('/auth/login/totp', { username, password, totpCode });
    return res.data;
  },
  register: async (payload) => {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },
  changePassword: async (currentPassword, newPassword) => {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
  revokeToken: async (refreshToken) => {
    const res = await api.post('/auth/revoke-token', { refreshToken });
    return res.data;
  },
};

export const customerService = {
  getAll: async () => {
    const res = await api.get('/customers');
    return res.data;
  },
  getProfile: async (id) => {
    const res = await api.get(`/customers/${id}`);
    return res.data;
  },
  getByUserId: async (userId) => {
    const res = await api.get(`/customers/user/${userId}`);
    return res.data;
  },
  createCustomer: async (payload) => {
    const res = await api.post('/customers', payload);
    return res.data;
  },
  updateKyc: async (id, status, level) => {
    const res = await api.put(`/customers/${id}/kyc`, { status, level });
    return res.data;
  },
  updateCustomer: async (id, payload) => {
    const res = await api.put(`/customers/${id}`, payload);
    return res.data;
  },
};

export const accountService = {
  getAll: async () => {
    const res = await api.get('/accounts');
    return res.data;
  },
  getByAccountNumber: async (accountNumber) => {
    const res = await api.get(`/accounts/number/${accountNumber}`);
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/accounts/${id}`);
    return res.data;
  },
  getByCustomer: async (customerId) => {
    const res = await api.get(`/accounts/customer/${customerId}`);
    return res.data;
  },
  getBalance: async (id) => {
    const res = await api.get(`/accounts/${id}/balance`);
    return res.data;
  },
  openAccount: async (payload) => {
    const res = await api.post('/accounts', payload);
    return res.data;
  },
  freezeAccount: async (id, reason) => {
    const res = await api.post(`/accounts/${id}/freeze`, { reason });
    return res.data;
  },
  unfreezeAccount: async (id) => {
    const res = await api.post(`/accounts/${id}/unfreeze`);
    return res.data;
  },
  closeAccount: async (id) => {
    const res = await api.post(`/accounts/${id}/close`);
    return res.data;
  },
};

export const transactionService = {
  deposit: async (payload) => {
    const res = await api.post('/transactions/deposit', payload);
    return res.data;
  },
  withdraw: async (payload) => {
    const res = await api.post('/transactions/withdraw', payload);
    return res.data;
  },
  transfer: async (payload) => {
    const res = await api.post('/transactions/transfer', payload);
    return res.data;
  },
  getHistory: async (accountId, params = {}) => {
    const res = await api.get(`/transactions/account/${accountId}`, { params });
    return res.data;
  },
  getStatement: async (accountId, fromDate, toDate) => {
    const res = await api.get(`/transactions/account/${accountId}/statement`, {
      params: { fromDate, toDate },
    });
    return res.data;
  },
};

export const auditService = {
  getLogs: async (params = {}) => {
    const res = await api.get('/audit-logs', { params });
    return res.data;
  },
};

export const userService = {
  getAll: async () => {
    const res = await api.get('/users');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },
};

export default api;
