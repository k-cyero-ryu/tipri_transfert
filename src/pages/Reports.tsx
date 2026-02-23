import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import * as api from '../api';

interface ReportsProps {
  user: User;
}

const Reports = ({ user }: ReportsProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    currency: '',
  });
  
  const [receivedData, setReceivedData] = useState<any[]>([]);
  const [transferredData, setTransferredData] = useState<any[]>([]);
  const [creditData, setCreditData] = useState<any[]>([]);
  const [profitData, setProfitData] = useState<any[]>([]);

  useEffect(() => {
    if (user.role === 'admin') {
      loadReports();
    }
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [received, transferred, credit, profit] = await Promise.all([
        api.getReceivedReport(filters),
        api.getTransferredReport(filters),
        api.getCreditReport({ currency: filters.currency }),
        api.getProfitReport({ startDate: filters.startDate, endDate: filters.endDate }),
      ]);
      
      setReceivedData(received);
      setTransferredData(transferred);
      setCreditData(credit);
      setProfitData(profit);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | string, currency: string = 'USD') => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(num || 0);
  };

  const exportToPDF = (type: string) => {
    // Simple PDF export using browser print
    window.print();
  };

  if (user.role !== 'admin') {
    return (
      <div>
        <h1>{t('reports')}</h1>
        <p>Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <h1 className="header-title">{t('reports')}</h1>
      </div>

      <div className="report-filters">
        <div className="filters">
          <div className="filter-group">
            <label>{t('startDate')}:</label>
            <input type="date" className="form-input" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
          </div>
          <div className="filter-group">
            <label>{t('endDate')}:</label>
            <input type="date" className="form-input" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          </div>
          <div className="filter-group">
            <label>{t('accountCurrency')}:</label>
            <select className="form-select" value={filters.currency} onChange={(e) => setFilters({ ...filters, currency: e.target.value })}>
              <option value="">{t('all')}</option>
              <option value="USD">USD</option>
              <option value="HTG">HTG</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={loadReports}>{t('generateReport')}</button>
          <button className="btn btn-secondary" onClick={() => exportToPDF('all')}>{t('exportPDF')}</button>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <div className="report-grid">
          <div className="report-card">
            <h3>{t('receivedReport')}</h3>
            {receivedData.length === 0 ? (
              <p>{t('noData')}</p>
            ) : (
              receivedData.map((item, index) => (
                <div key={index}>
                  <div className="stat-label">{item.currency}</div>
                  <div className="report-total">{formatCurrency(item.total_received, item.currency)}</div>
                  <div className="stat-label">{item.transaction_count} transactions</div>
                </div>
              ))
            )}
          </div>

          <div className="report-card">
            <h3>{t('transferredReport')}</h3>
            {transferredData.length === 0 ? (
              <p>{t('noData')}</p>
            ) : (
              transferredData.map((item, index) => (
                <div key={index}>
                  <div className="stat-label">{item.currency}</div>
                  <div className="report-total">{formatCurrency(item.total_transferred, item.currency)}</div>
                  <div className="stat-label">{item.transaction_count} transactions</div>
                </div>
              ))
            )}
          </div>

          <div className="report-card">
            <h3>{t('creditReport')}</h3>
            {creditData.length === 0 ? (
              <p>{t('noData')}</p>
            ) : (
              creditData.map((item, index) => (
                <div key={index}>
                  <div className="stat-label">{item.currency}</div>
                  <div className="report-total">{formatCurrency(item.total_unpaid_credit, item.currency)}</div>
                  <div className="stat-label">{item.credit_count} credits</div>
                </div>
              ))
            )}
          </div>

          <div className="report-card">
            <h3>{t('profitReport')}</h3>
            {profitData.length === 0 || !profitData[0]?.total_profit ? (
              <p>{t('noData')}</p>
            ) : (
              <>
                <div className="stat-label">{t('totalProfit')}</div>
                <div className="report-total">{formatCurrency(profitData[0].total_profit)}</div>
                <div className="stat-label">Volume: {formatCurrency(profitData[0].total_volume)}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
