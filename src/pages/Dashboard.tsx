import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, DashboardSummary } from '../types';
import * as api from '../api';

interface DashboardProps {
  user: User;
}

const Dashboard = ({ user }: DashboardProps) => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | string, currency: string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(num);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <h1 className="header-title">{t('dashboard')}</h1>
      </div>

      <div className="stats-grid">
        {summary?.accounts.map((account) => (
          <div key={account.currency} className="stat-card accent-green">
            <div className="stat-label">{t('totalBalance')} ({account.currency})</div>
            <div className="stat-value">{formatCurrency(account.total_balance, account.currency)}</div>
            <div className="stat-label">{account.account_count} {t('accounts')}</div>
          </div>
        ))}

        <div className="stat-card">
          <div className="stat-label">{t('todayTransactions')}</div>
          <div className="stat-value">{summary?.todayTransactions?.count || 0}</div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <span className="badge badge-paid">{t('completed')}: {summary?.todayTransactions?.completed || 0}</span>
            <span className="badge badge-pending">{t('pending')}: {summary?.todayTransactions?.pending || 0}</span>
          </div>
        </div>

        {user.role === 'admin' && (
          <>
            <div className="stat-card accent-warning">
              <div className="stat-label">{t('pendingPayments')}</div>
              <div className="stat-value">{summary?.pendingPayments?.count || 0}</div>
            </div>

            <div className="stat-card accent-danger">
              <div className="stat-label">{t('pendingCredit')}</div>
              <div className="stat-value">{formatCurrency(summary?.pendingCredit?.total || 0, 'USD')}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">{t('activeUsers')}</div>
              <div className="stat-value">{summary?.activeUsers?.count || 0}</div>
            </div>

            <div className="stat-card accent-green">
              <div className="stat-label">{t('totalTransactions')}</div>
              <div className="stat-value">{summary?.totalTransactions?.count || 0}</div>
              <div className="stat-label">{formatCurrency(summary?.totalTransactions?.total_volume || 0, 'USD')}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
