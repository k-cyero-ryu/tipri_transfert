import { User, Account, Transaction, AccountAccess, Settings, DashboardSummary, LoginResponse, Client } from '../types';

const API_URL = '/api';

const getToken = () => localStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

// Auth
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Login failed');
  }
  return res.json();
};

export const getMe = async (): Promise<User> => {
  const res = await fetch(`${API_URL}/auth/me`, { headers: headers() });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
};

export const logout = async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Users
export const getUsers = async (): Promise<User[]> => {
  const res = await fetch(`${API_URL}/users`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

export const createUser = async (data: { username: string; password: string; full_name: string; role: string }): Promise<User> => {
  const res = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create user');
  }
  return res.json();
};

export const updateUser = async (id: number, data: Partial<User & { password?: string }>): Promise<User> => {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update user');
  return res.json();
};

export const deleteUser = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error('Failed to delete user');
};

// Accounts
export const getAccounts = async (): Promise<Account[]> => {
  const res = await fetch(`${API_URL}/accounts`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
};

export const createAccount = async (data: Partial<Account>): Promise<Account> => {
  const res = await fetch(`${API_URL}/accounts`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create account');
  return res.json();
};

export const updateAccount = async (id: number, data: Partial<Account>): Promise<Account> => {
  const res = await fetch(`${API_URL}/accounts/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update account');
  return res.json();
};

export const deleteAccount = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/accounts/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error('Failed to delete account');
};

export const withdrawFromAccount = async (id: number, data: { amount: number; description?: string }): Promise<{ success: boolean; message: string; new_balance: number; amount_withdrawn: number }> => {
  const res = await fetch(`${API_URL}/accounts/${id}/withdraw`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to withdraw');
  }
  return res.json();
};

export const getAccountTransactions = async (id: number, params?: { startDate?: string; endDate?: string; status?: string }): Promise<Transaction[]> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.status) queryParams.append('status', params.status);
  
  const res = await fetch(`${API_URL}/accounts/${id}/transactions?${queryParams}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch account transactions');
  return res.json();
};

// Account Access
export const getAccountAccess = async (): Promise<AccountAccess[]> => {
  const res = await fetch(`${API_URL}/account-access`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch account access');
  return res.json();
};

export const createAccountAccess = async (data: { user_id: number; account_id: number; can_view?: boolean; can_transact?: boolean }): Promise<AccountAccess> => {
  const res = await fetch(`${API_URL}/account-access`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create account access');
  return res.json();
};

export const deleteAccountAccess = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/account-access/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error('Failed to delete account access');
};

// Transactions
export const getTransactions = async (params?: { startDate?: string; endDate?: string; paymentStatus?: string; transactionStatus?: string; currency?: string }): Promise<Transaction[]> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
  if (params?.transactionStatus) queryParams.append('transactionStatus', params.transactionStatus);
  if (params?.currency) queryParams.append('currency', params.currency);
  
  const res = await fetch(`${API_URL}/transactions?${queryParams}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
};

export const createTransaction = async (data: Partial<Transaction>): Promise<Transaction> => {
  const res = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create transaction');
  return res.json();
};

export const updateTransaction = async (id: number, data: Partial<Transaction>): Promise<Transaction> => {
  const res = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update transaction');
  return res.json();
};

export const confirmPayment = async (id: number): Promise<Transaction> => {
  const res = await fetch(`${API_URL}/transactions/${id}/confirm-payment`, {
    method: 'PUT',
    headers: headers(),
  });
  if (!res.ok) throw new Error('Failed to confirm payment');
  return res.json();
};

export const executeTransaction = async (id: number): Promise<Transaction> => {
  const res = await fetch(`${API_URL}/transactions/${id}/execute`, {
    method: 'PUT',
    headers: headers(),
  });
  if (!res.ok) throw new Error('Failed to execute transaction');
  return res.json();
};

export const cancelTransaction = async (id: number): Promise<Transaction> => {
  const res = await fetch(`${API_URL}/transactions/${id}/cancel`, {
    method: 'PUT',
    headers: headers(),
  });
  if (!res.ok) throw new Error('Failed to cancel transaction');
  return res.json();
};

// Reports
export const getReceivedReport = async (params?: { startDate?: string; endDate?: string; currency?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.currency) queryParams.append('currency', params.currency);
  
  const res = await fetch(`${API_URL}/reports/received?${queryParams}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
};

export const getTransferredReport = async (params?: { startDate?: string; endDate?: string; currency?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.currency) queryParams.append('currency', params.currency);
  
  const res = await fetch(`${API_URL}/reports/transferred?${queryParams}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
};

export const getCreditReport = async (params?: { currency?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.currency) queryParams.append('currency', params.currency);
  
  const res = await fetch(`${API_URL}/reports/credit?${queryParams}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
};

export const getProfitReport = async (params?: { startDate?: string; endDate?: string; currency?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.currency) queryParams.append('currency', params.currency);
  
  const res = await fetch(`${API_URL}/reports/profit?${queryParams}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
};

export const getProfitTransactions = async (params?: { startDate?: string; endDate?: string; currency?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.currency) queryParams.append('currency', params.currency);
  
  const res = await fetch(`${API_URL}/reports/profit/transactions?${queryParams}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
};

export const getCostReport = async (params?: { startDate?: string; endDate?: string; currency?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.currency) queryParams.append('currency', params.currency);
  
  const res = await fetch(`${API_URL}/reports/cost?${queryParams}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
};

export const getCostTransactions = async (params?: { startDate?: string; endDate?: string; currency?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.currency) queryParams.append('currency', params.currency);
  
  const res = await fetch(`${API_URL}/reports/cost/transactions?${queryParams}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
};

export const getWithdrawalsReport = async (params?: { startDate?: string; endDate?: string; currency?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.currency) queryParams.append('currency', params.currency);
  
  const res = await fetch(`${API_URL}/reports/withdrawals?${queryParams}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
};

export const getWithdrawalsTransactions = async (params?: { startDate?: string; endDate?: string; currency?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.currency) queryParams.append('currency', params.currency);
  
  const res = await fetch(`${API_URL}/reports/withdrawals/transactions?${queryParams}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
};

export const getReportTransactions = async (params?: { startDate?: string; endDate?: string; type?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.type) queryParams.append('type', params.type);
  
  const res = await fetch(`${API_URL}/reports/transactions?${queryParams}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
};

// Account Transactions Report
export const getAccountTransactionsReport = async (params?: { startDate?: string; endDate?: string; accountId?: number; type?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.accountId) queryParams.append('accountId', params.accountId.toString());
  if (params?.type) queryParams.append('type', params.type);
  
  const res = await fetch(`${API_URL}/reports/account-transactions?${queryParams}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch account transactions');
  return res.json();
};

// Settings
export const getSettings = async (): Promise<Settings[]> => {
  const res = await fetch(`${API_URL}/settings`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
};

export const updateSetting = async (key: string, value: string): Promise<Settings> => {
  const res = await fetch(`${API_URL}/settings/${key}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ value }),
  });
  if (!res.ok) throw new Error('Failed to update setting');
  return res.json();
};

// Dashboard
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const res = await fetch(`${API_URL}/dashboard/summary`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
};

// Account Transfer
export const transferAccounts = async (data: { from_account_id: number; to_account_id: number; send_amount: number; receive_amount: number }): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${API_URL}/account-transfer/transfer`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to transfer');
  }
  return res.json();
};

// Clients
export const getClients = async (): Promise<Client[]> => {
  const res = await fetch(`${API_URL}/clients`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch clients');
  return res.json();
};

export const createClient = async (data: { name: string; credit_limit: number }): Promise<Client> => {
  const res = await fetch(`${API_URL}/clients`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create client');
  }
  return res.json();
};

export const updateClient = async (id: number, data: Partial<Client>): Promise<Client> => {
  const res = await fetch(`${API_URL}/clients/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update client');
  return res.json();
};

export const deleteClient = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/clients/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error('Failed to delete client');
};

export const liquidateClient = async (id: number, accountId: number): Promise<{ success: boolean; message: string; liquidated_count: number }> => {
  const res = await fetch(`${API_URL}/clients/${id}/liquidate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ account_id: accountId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to liquidate client');
  }
  return res.json();
};

// Activity Log
export interface ActivityLogEntry {
  id: number;
  user_id: number;
  action: string;
  details: string;
  entity_type: string | null;
  entity_id: number | null;
  created_at: string;
  username?: string;
  full_name?: string;
  role?: string;
}

export const getActivityLogs = async (params?: { startDate?: string; endDate?: string; action?: string; userId?: string }): Promise<ActivityLogEntry[]> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.action) queryParams.append('action', params.action);
  if (params?.userId) queryParams.append('userId', params.userId);
  
  const res = await fetch(`${API_URL}/activity-log?${queryParams}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch activity logs');
  return res.json();
};
