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
  const [activeTab, setActiveTab] = useState('resume');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    currency: '',
  });
  
  // Resume data
  const [receivedData, setReceivedData] = useState<any[]>([]);
  const [transferredData, setTransferredData] = useState<any[]>([]);
  const [creditData, setCreditData] = useState<any[]>([]);
  const [profitData, setProfitData] = useState<any[]>([]);
  
  // Profit data
  const [profitReportData, setProfitReportData] = useState<any[]>([]);
  const [profitTransactions, setProfitTransactions] = useState<any[]>([]);
  
  // Cost data
  const [costReportData, setCostReportData] = useState<any[]>([]);
  const [costTransactions, setCostTransactions] = useState<any[]>([]);
  
  // Withdrawals data
  const [withdrawalsReportData, setWithdrawalsReportData] = useState<any[]>([]);
  const [withdrawalsTransactions, setWithdrawalsTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (user.role === 'admin') {
      loadReports();
    }
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      if (activeTab === 'resume') {
        const [received, transferred, credit, profit] = await Promise.all([
          api.getReceivedReport(filters),
          api.getTransferredReport(filters),
          api.getCreditReport({ currency: filters.currency }),
          api.getProfitReport(filters),
        ]);
        
        setReceivedData(received);
        setTransferredData(transferred);
        setCreditData(credit);
        setProfitData(profit);
      } else if (activeTab === 'profit') {
        const [report, transactions] = await Promise.all([
          api.getProfitReport(filters),
          api.getProfitTransactions(filters),
        ]);
        
        setProfitReportData(report);
        setProfitTransactions(transactions);
      } else if (activeTab === 'cost') {
        const [report, transactions] = await Promise.all([
          api.getCostReport(filters),
          api.getCostTransactions(filters),
        ]);
        
        setCostReportData(report);
        setCostTransactions(transactions);
      } else if (activeTab === 'withdrawals') {
        const [report, transactions] = await Promise.all([
          api.getWithdrawalsReport(filters),
          api.getWithdrawalsTransactions(filters),
        ]);
        
        setWithdrawalsReportData(report);
        setWithdrawalsTransactions(transactions);
      }
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const exportToPDF = (type: string) => {
    window.print();
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setTimeout(() => loadReports(), 0);
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

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'resume' ? 'active' : ''}`}
          onClick={() => handleTabChange('resume')}
        >
          {t('resumeReport') || 'Resume'}
        </button>
        <button 
          className={`tab ${activeTab === 'profit' ? 'active' : ''}`}
          onClick={() => handleTabChange('profit')}
        >
          {t('profitReport')}
        </button>
        <button 
          className={`tab ${activeTab === 'cost' ? 'active' : ''}`}
          onClick={() => handleTabChange('cost')}
        >
          {t('costReport')}
        </button>
        <button 
          className={`tab ${activeTab === 'withdrawals' ? 'active' : ''}`}
          onClick={() => handleTabChange('withdrawals')}
        >
          {t('withdrawalsReport')}
        </button>
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
          <button className="btn btn-secondary" onClick={() => exportToPDF(activeTab)}>{t('exportPDF')}</button>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <>
          {/* Resume Report */}
          {activeTab === 'resume' && (
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
                {profitData.length === 0 ? (
                  <p>{t('noData')}</p>
                ) : (
                  profitData.map((item, index) => (
                    <div key={index}>
                      <div className="stat-label">{item.currency}</div>
                      <div className="report-total">{formatCurrency(item.total_profit, item.currency)}</div>
                      <div className="stat-label">Payment: {formatCurrency(item.total_payment_amount, item.currency)}</div>
                      <div className="stat-label">Transaction: {formatCurrency(item.total_transaction_amount, item.currency)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Profit Report */}
          {activeTab === 'profit' && (
            <div>
              <div className="report-grid">
                <div className="report-card full-width">
                  <h3>{t('profitReport')} - {t('summary')}</h3>
                  {profitReportData.length === 0 ? (
                    <p>{t('noData')}</p>
                  ) : (
                    profitReportData.map((item, index) => (
                      <div key={index} style={{ display: 'inline-block', margin: '0 20px' }}>
                        <div className="stat-label">{item.currency}</div>
                        <div className="report-total">{formatCurrency(item.total_profit, item.currency)}</div>
                        <div className="stat-label">{item.transaction_count} transactions</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="card" style={{ marginTop: '20px' }}>
                <h3>{t('profitReport')} - {t('transactions')}</h3>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>{t('clientName')}</th>
                        <th>{t('paymentMethod')}</th>
                        <th>{t('paymentAmount')}</th>
                        <th>{t('transactionAmount')}</th>
                        <th>Profit</th>
                        <th>{t('dateTime')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profitTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="empty-state">{t('noData')}</td>
                        </tr>
                      ) : (
                        profitTransactions.map((tx) => (
                          <tr key={tx.id}>
                            <td>{tx.id}</td>
                            <td>{tx.client_name}</td>
                            <td>{tx.payment_method}</td>
                            <td>{formatCurrency(tx.payment_amount, tx.receiver_currency)}</td>
                            <td>{formatCurrency(tx.transaction_amount, tx.receiver_currency)}</td>
                            <td style={{ color: 'green', fontWeight: 'bold' }}>{formatCurrency(tx.profit, tx.receiver_currency)}</td>
                            <td>{formatDate(tx.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Cost Report */}
          {activeTab === 'cost' && (
            <div>
              <div className="report-grid">
                <div className="report-card full-width">
                  <h3>{t('costReport')} - {t('summary')}</h3>
                  {costReportData.length === 0 ? (
                    <p>{t('noData')}</p>
                  ) : (
                    costReportData.map((item, index) => (
                      <div key={index} style={{ display: 'inline-block', margin: '0 20px' }}>
                        <div className="stat-label">{item.currency}</div>
                        <div className="report-total">{formatCurrency(item.total_cost, item.currency)}</div>
                        <div className="stat-label">Sent: {formatCurrency(item.total_sent, item.currency)}</div>
                        <div className="stat-label">Received: {formatCurrency(item.total_received, item.currency)}</div>
                        <div className="stat-label">{item.transfer_count} transfers</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="card" style={{ marginTop: '20px' }}>
                <h3>{t('costReport')} - {t('transactions')}</h3>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Sent</th>
                        <th>Received</th>
                        <th>Cost</th>
                        <th>From Currency</th>
                        <th>To Currency</th>
                        <th>{t('dateTime')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="empty-state">{t('noData')}</td>
                        </tr>
                      ) : (
                        costTransactions.map((tx) => (
                          <tr key={tx.id}>
                            <td>{tx.id}</td>
                            <td>{formatCurrency(tx.send_amount, tx.from_currency)}</td>
                            <td>{formatCurrency(tx.receive_amount, tx.to_currency)}</td>
                            <td style={{ color: 'red', fontWeight: 'bold' }}>{formatCurrency(tx.cost, tx.from_currency)}</td>
                            <td>{tx.from_currency}</td>
                            <td>{tx.to_currency}</td>
                            <td>{formatDate(tx.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Withdrawals Report */}
          {activeTab === 'withdrawals' && (
            <div>
              <div className="report-grid">
                <div className="report-card full-width">
                  <h3>{t('withdrawalsReport')} - {t('summary')}</h3>
                  {withdrawalsReportData.length === 0 ? (
                    <p>{t('noData')}</p>
                  ) : (
                    withdrawalsReportData.map((item, index) => (
                      <div key={index} style={{ display: 'inline-block', margin: '0 20px' }}>
                        <div className="stat-label">{item.currency}</div>
                        <div className="report-total">{formatCurrency(item.total_withdrawn, item.currency)}</div>
                        <div className="stat-label">{item.withdrawal_count} withdrawals</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="card" style={{ marginTop: '20px' }}>
                <h3>{t('withdrawalsReport')} - {t('transactions')}</h3>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>{t('accountName')}</th>
                        <th>{t('amount')}</th>
                        <th>{t('accountCurrency')}</th>
                        <th>{t('details')}</th>
                        <th>{t('dateTime')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawalsTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="empty-state">{t('noData')}</td>
                        </tr>
                      ) : (
                        withdrawalsTransactions.map((tx) => (
                          <tr key={tx.id}>
                            <td>{tx.id}</td>
                            <td>{tx.account_name}</td>
                            <td style={{ color: 'red', fontWeight: 'bold' }}>{formatCurrency(tx.amount, tx.account_currency)}</td>
                            <td>{tx.account_currency}</td>
                            <td>{tx.description}</td>
                            <td>{formatDate(tx.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
