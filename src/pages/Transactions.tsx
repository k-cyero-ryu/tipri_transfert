import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Transaction, Account, Client } from '../types';
import * as api from '../api';

interface TransactionsProps {
  user: User;
}

const Transactions = ({ user }: TransactionsProps) => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentStatus: '',
    transactionStatus: '',
  });

  const [formData, setFormData] = useState<{
    client_name: string;
    payment_method: string;
    payment_amount: number;
    transaction_amount: number;
    transaction_method: string;
    transaction_details: string;
    tax_rate: number;
    is_credit: boolean;
    credit_due_date: string;
    sender_account_id: string;
    receiver_account_id: string;
  }>({
    client_name: '',
    payment_method: 'Cash',
    payment_amount: 0,
    transaction_amount: 0,
    transaction_method: 'Cash',
    transaction_details: '',
    tax_rate: 3,
    is_credit: false,
    credit_due_date: '',
    sender_account_id: '',
    receiver_account_id: '',
  });

  const paymentMethods = ['Cash', 'Zelle', 'PayPal', 'Bank Transfer', 'MoonCash', 'NatCash', 'Credit'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading transactions, accounts and clients...');
      const [txData, accData, clientData] = await Promise.all([
        api.getTransactions(),
        api.getAccounts(),
        api.getClients(),
      ]);
      console.log('Transactions loaded:', txData);
      console.log('Accounts loaded:', accData);
      console.log('Clients loaded:', clientData);
      setTransactions(txData);
      setAccounts(accData);
      setClients(clientData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    setLoading(true);
    try {
      const data = await api.getTransactions(filters);
      setTransactions(data);
    } catch (error) {
      console.error('Error filtering:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        sender_account_id: formData.sender_account_id ? parseInt(formData.sender_account_id) : null,
        receiver_account_id: formData.receiver_account_id ? parseInt(formData.receiver_account_id) : null,
      };
      
      if (editingTransaction) {
        await api.updateTransaction(editingTransaction.id, data);
      } else {
        await api.createTransaction(data);
      }
      
      setShowModal(false);
      setEditingTransaction(null);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save transaction';
      alert(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      payment_method: 'Cash',
      payment_amount: 0,
      transaction_amount: 0,
      transaction_method: 'Cash',
      transaction_details: '',
      tax_rate: 3,
      is_credit: false,
      credit_due_date: '',
      sender_account_id: '',
      receiver_account_id: '',
    });
  };

  const handleConfirmPayment = async (id: number) => {
    if (!window.confirm(t('confirm') + '?')) {
      return;
    }
    try {
      await api.confirmPayment(id);
      loadData();
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  const handleExecute = async (id: number) => {
    if (!window.confirm(t('confirm') + '?')) {
      return;
    }
    try {
      await api.executeTransaction(id);
      loadData();
    } catch (error) {
      console.error('Error executing transaction:', error);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm(t('confirm') + '?')) {
      return;
    }
    try {
      await api.cancelTransaction(id);
      loadData();
    } catch (error) {
      console.error('Error canceling transaction:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
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
        <h1 className="header-title">{t('transactions')}</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditingTransaction(null); setShowModal(true); }}>
          + {t('createTransaction')}
        </button>
      </div>

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
          <label>{t('paymentStatus')}:</label>
          <select className="form-select" value={filters.paymentStatus} onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}>
            <option value="">{t('all')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="paid">{t('paid')}</option>
            <option value="canceled">{t('canceled')}</option>
          </select>
        </div>
        <div className="filter-group">
          <label>{t('transactionStatus')}:</label>
          <select className="form-select" value={filters.transactionStatus} onChange={(e) => setFilters({ ...filters, transactionStatus: e.target.value })}>
            <option value="">{t('all')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="paid">{t('paid')}</option>
            <option value="canceled">{t('canceled')}</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleFilter}>{t('filter')}</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t('clientName')}</th>
                <th>{t('paymentMethod')}</th>
                <th>{t('paymentAmount')}</th>
                <th>{t('paymentStatus')}</th>
                <th>{t('transactionAmount')}</th>
                <th>{t('transactionMethod')}</th>
                <th>{t('transactionStatus')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state">{t('noData')}</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.id}</td>
                    <td>{tx.client_name}</td>
                    <td>{tx.payment_method}</td>
                    <td>{formatCurrency(tx.payment_amount)}</td>
                    <td>
                      <span className={`badge badge-${tx.payment_status}`}>
                        {t(tx.payment_status)}
                      </span>
                    </td>
                    <td>{formatCurrency(tx.transaction_amount)}</td>
                    <td>{tx.transaction_method}</td>
                    <td>
                      <span className={`badge badge-${tx.transaction_status}`}>
                        {t(tx.transaction_status)}
                      </span>
                    </td>
                    <td className="table-actions">
                      {tx.payment_status === 'pending' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleConfirmPayment(tx.id)}>
                          {t('confirmPayment')}
                        </button>
                      )}
                      {tx.payment_status === 'paid' && tx.transaction_status === 'pending' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleExecute(tx.id)}>
                          {t('confirmTransaction')}
                        </button>
                      )}
                      {tx.transaction_status === 'pending' && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(tx.id)}>
                          {t('cancel')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingTransaction ? t('edit') : t('createTransaction')}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('clientName')}</label>
                  <select className="form-select" value={formData.client_name} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} required>
                    <option value="">-- Select --</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.name}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('paymentMethod')}</label>
                  <select className="form-select" value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}>
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('paymentAmount')}</label>
                  <input type="number" className="form-input" value={formData.payment_amount} onChange={(e) => setFormData({ ...formData, payment_amount: parseFloat(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('transactionAmount')}</label>
                  <input type="number" className="form-input" value={formData.transaction_amount} onChange={(e) => setFormData({ ...formData, transaction_amount: parseFloat(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('transactionMethod')}</label>
                  <select className="form-select" value={formData.transaction_method} onChange={(e) => setFormData({ ...formData, transaction_method: e.target.value })}>
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('transactionDetails')}</label>
                  <textarea className="form-textarea" value={formData.transaction_details} onChange={(e) => setFormData({ ...formData, transaction_details: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('taxRate')}</label>
                  <input type="number" className="form-input" value={formData.tax_rate} onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('senderAccount')}</label>
                  <select className="form-select" value={formData.sender_account_id} onChange={(e) => setFormData({ ...formData, sender_account_id: e.target.value })}>
                    <option value="">-- Select --</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('receiverAccount')}</label>
                  <select className="form-select" value={formData.receiver_account_id} onChange={(e) => setFormData({ ...formData, receiver_account_id: e.target.value })}>
                    <option value="">-- Select --</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-checkbox">
                    <input type="checkbox" checked={formData.is_credit} onChange={(e) => setFormData({ ...formData, is_credit: e.target.checked })} />
                    {t('isCredit')}
                  </label>
                </div>
                {formData.is_credit && (
                  <div className="form-group">
                    <label className="form-label">{t('creditDueDate')}</label>
                    <input type="date" className="form-input" value={formData.credit_due_date} onChange={(e) => setFormData({ ...formData, credit_due_date: e.target.value })} />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
