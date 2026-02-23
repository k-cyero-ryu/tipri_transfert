import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Account } from '../types';
import * as api from '../api';

interface AccountsProps {
  user: User;
}

const Accounts = ({ user }: AccountsProps) => {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferForm, setTransferForm] = useState({
    from_account_id: '' as string | number,
    to_account_id: '' as string | number,
    send_amount: 0,
    receive_amount: 0,
  });
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'Cash',
    detail: '',
    currency: 'USD',
    balance: 0,
    is_active: true,
  });

  const accountTypes = ['Cash', 'Zelle', 'PayPal', 'Bank', 'MoonCash', 'NatCash'];

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await api.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await api.updateAccount(editingAccount.id, formData);
      } else {
        await api.createAccount(formData);
      }
      
      setShowModal(false);
      setEditingAccount(null);
      resetForm();
      loadAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Cash',
      detail: '',
      currency: 'USD',
      balance: 0,
      is_active: true,
    });
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferLoading(true);
    try {
      await api.transferAccounts({
        from_account_id: Number(transferForm.from_account_id),
        to_account_id: Number(transferForm.to_account_id),
        send_amount: transferForm.send_amount,
        receive_amount: transferForm.receive_amount,
      });
      
      setShowTransferModal(false);
      setTransferForm({
        from_account_id: '',
        to_account_id: '',
        send_amount: 0,
        receive_amount: 0,
      });
      loadAccounts();
      alert('Transfer completed successfully!');
    } catch (error: any) {
      alert(error.message || 'Transfer failed');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this account?')) {
      try {
        await api.deleteAccount(id);
        loadAccounts();
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
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
        <h1 className="header-title">{t('accounts')}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setShowTransferModal(true)}>
            {t('transfer')} ↔
          </button>
          {user.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => { resetForm(); setEditingAccount(null); setShowModal(true); }}>
              + {t('createAccount')}
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('accountName')}</th>
                <th>{t('accountType')}</th>
                <th>{t('accountDetail')}</th>
                <th>{t('accountCurrency')}</th>
                <th>{t('accountBalance')}</th>
                <th>{t('accountStatus')}</th>
                {user.role === 'admin' && <th>{t('actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={user.role === 'admin' ? 7 : 6} className="empty-state">{t('noData')}</td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account.id}>
                    <td>{account.name}</td>
                    <td>{account.type}</td>
                    <td>{account.detail}</td>
                    <td>{account.currency}</td>
                    <td>{formatCurrency(account.balance)}</td>
                    <td>
                      <span className={`badge ${account.is_active ? 'badge-active' : 'badge-inactive'}`}>
                        {account.is_active ? t('active') : t('inactive')}
                      </span>
                    </td>
                    {user.role === 'admin' && (
                      <td className="table-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => { setEditingAccount(account); setFormData({ name: account.name, type: account.type, detail: account.detail || '', currency: account.currency, balance: typeof account.balance === 'string' ? parseFloat(account.balance) : account.balance, is_active: account.is_active }); setShowModal(true); }}>
                          {t('edit')}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(account.id)}>
                          {t('delete')}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && user.role === 'admin' && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingAccount ? t('editAccount') : t('createAccount')}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('accountName')}</label>
                  <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('accountType')}</label>
                  <select className="form-select" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                    {accountTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('accountDetail')}</label>
                  <textarea className="form-textarea" value={formData.detail} onChange={(e) => setFormData({ ...formData, detail: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('accountCurrency')}</label>
                  <select className="form-select" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'USD' | 'HTG' })}>
                    <option value="USD">USD</option>
                    <option value="HTG">HTG</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('accountBalance')}</label>
                  <input type="number" className="form-input" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('transfer')}</h2>
              <button className="modal-close" onClick={() => setShowTransferModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleTransfer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('senderAccount')}</label>
                  <select className="form-select" value={transferForm.from_account_id} onChange={(e) => setTransferForm({ ...transferForm, from_account_id: e.target.value })} required>
                    <option value="">-- Select --</option>
                    {accounts.filter(a => a.is_active).map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency}) - {formatCurrency(acc.balance)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Send Amount</label>
                  <input type="number" className="form-input" value={transferForm.send_amount} onChange={(e) => setTransferForm({ ...transferForm, send_amount: parseFloat(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('receiverAccount')}</label>
                  <select className="form-select" value={transferForm.to_account_id} onChange={(e) => setTransferForm({ ...transferForm, to_account_id: e.target.value })} required>
                    <option value="">-- Select --</option>
                    {accounts.filter(a => a.is_active && a.id !== Number(transferForm.from_account_id)).map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Received Amount</label>
                  <input type="number" className="form-input" value={transferForm.receive_amount} onChange={(e) => setTransferForm({ ...transferForm, receive_amount: parseFloat(e.target.value) })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowTransferModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={transferLoading}>
                  {transferLoading ? t('loading') : t('transfer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
