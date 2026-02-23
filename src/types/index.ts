export interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'cashier';
  is_active: boolean;
  created_at?: string;
}

export interface Account {
  id: number;
  name: string;
  type: string;
  detail: string;
  currency: 'USD' | 'HTG';
  balance: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AccountAccess {
  id: number;
  user_id: number;
  account_id: number;
  can_view: boolean;
  can_transact: boolean;
  created_at?: string;
  // Joined fields
  username?: string;
  full_name?: string;
  account_name?: string;
  account_type?: string;
  currency?: string;
}

export interface Transaction {
  id: number;
  client_name: string;
  payment_method: string;
  payment_amount: number;
  payment_status: 'pending' | 'paid' | 'canceled';
  transaction_amount: number;
  transaction_method: string;
  transaction_details: string;
  tax_rate: number;
  transaction_status: 'pending' | 'paid' | 'canceled';
  is_credit: boolean;
  credit_due_date?: string;
  credit_paid: boolean;
  sender_account_id?: number;
  receiver_account_id?: number;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  sender_account_name?: string;
  receiver_account_name?: string;
  sender_currency?: string;
  receiver_currency?: string;
  created_by_name?: string;
}

export interface Settings {
  id: number;
  key: string;
  value: string;
  updated_at?: string;
}

export interface DashboardSummary {
  accounts: {
    currency: string;
    total_balance: number;
    account_count: number;
  }[];
  todayTransactions: {
    count: number;
    completed: number;
    pending: number;
  };
  totalTransactions?: {
    count: number;
    total_volume: number;
  };
  pendingCredit?: {
    total: number;
  };
  activeUsers?: {
    count: number;
  };
  pendingPayments?: {
    count: number;
  };
}

export interface LoginResponse {
  token: string;
  user: User;
}
