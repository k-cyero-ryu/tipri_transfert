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
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawingAccount, setWithdrawingAccount] = useState<Account | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDescription, setWithdrawDescription] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessingAccount, setAccessingAccount] = useState<Account | null>(null);
  const [accountUsers, setAccountUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferForm, setTransferForm] = useState({
    from_account_id: '' as string | number,
    to_account_id: '' as string | number,
    send_amount: 0,
    receive_amount: 0,
  });
  
  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    detail: string;
    currency: 'USD' | 'HTG';
    balance: number;
    is_active: boolean;
  }>({
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

  const openWithdrawModal = (account: Account) => {
    setWithdrawingAccount(account);
    setWithdrawAmount('');
    setWithdrawDescription('');
    setShowWithdrawModal(true);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawingAccount || !withdrawAmount) return;
    
    if (!window.confirm(t('confirm') + '?')) {
      return;
    }
    
    setWithdrawLoading(true);
    try {
      const result = await api.withdrawFromAccount(withdrawingAccount.id, {
        amount: parseFloat(withdrawAmount),
        description: withdrawDescription,
      });
      
      alert(result.message);
      setShowWithdrawModal(false);
      setWithdrawingAccount(null);
      loadAccounts();
    } catch (error: any) {
      alert(error.message || 'Withdrawal failed');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const openAccessModal = async (account: Account) => {
    setAccessingAccount(account);
    setShowAccessModal(true);
    try {
      // Load all users
      const users = await api.getUsers();
      setAllUsers(users);
      
      // Load users with access to this account
      const accessData = await (await fetch(`/api/account-access/account/${account.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })).json();
      setAccountUsers(accessData);
    } catch (error) {
      console.error('Error loading access data:', error);
    }
  };

  const handleAddAccess = async (userId: number) => {
    if (!accessingAccount) return;
    setAccessLoading(true);
    try {
      await api.createAccountAccess({
        user_id: userId,
        account_id: accessingAccount.id,
        can_view: true,
        can_transact: true,
      });
      // Refresh access data
      const accessData = await (await fetch(`/api/account-access/account/${accessingAccount.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })).json();
      setAccountUsers(accessData);
    } catch (error: any) {
      alert(error.message || 'Failed to add access');
    } finally {
      setAccessLoading(false);
    }
  };

  const handleRemoveAccess = async (accessId: number) => {
    if (!window.confirm(t('confirm') + '?')) return;
    setAccessLoading(true);
    try {
      await api.deleteAccountAccess(accessId);
      // Refresh access data
      if (accessingAccount) {
        const accessData = await (await fetch(`/api/account-access/account/${accessingAccount.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })).json();
        setAccountUsers(accessData);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to remove access');
    } finally {
      setAccessLoading(false);
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
                        <button className="btn btn-warning btn-sm" onClick={() => openWithdrawModal(account)}>
                          {t('withdraw')}
                        </button>
                        <button className="btn btn-info btn-sm" onClick={() => openAccessModal(account)}>
                          {t('grantAccess')}
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

      {showWithdrawModal && withdrawingAccount && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('withdraw')}</h2>
              <button className="modal-close" onClick={() => setShowWithdrawModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleWithdraw}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('accountName')}</label>
                  <input type="text" className="form-input" value={withdrawingAccount.name} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('currentBalance')}</label>
                  <input type="text" className="form-input" value={formatCurrency(withdrawingAccount.balance)} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('amount')}</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={withdrawAmount} 
                    onChange={(e) => setWithdrawAmount(e.target.value)} 
                    min="0.01"
                    step="0.01"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('transactionDetails')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={withdrawDescription} 
                    onChange={(e) => setWithdrawDescription(e.target.value)} 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowWithdrawModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-warning" disabled={withdrawLoading}>
                  {withdrawLoading ? t('loading') : t('withdraw')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAccessModal && accessingAccount && (
        <div className="modal-overlay" onClick={() => setShowAccessModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('accountAccess')}</h2>
              <button className="modal-close" onClick={() => setShowAccessModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p><strong>{t('accountName')}:</strong> {accessingAccount.name}</p>
              
              <div className="form-group" style={{ marginTop: '15px' }}>
                <label className="form-label">{t('addUser') || 'Add User'}</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select id="userSelect" className="form-select" style={{ flex: 1 }}>
                    <option value="">-- Select User --</option>
                    {allUsers
                      .filter(u => !accountUsers.some(au => au.user_id === u.id))
                      .map(u => (
                        <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                      ))
                    }
                  </select>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const select = document.getElementById('userSelect') as HTMLSelectElement;
                      if (select.value) handleAddAccess(parseInt(select.value));
                    }}
                    disabled={accessLoading}
                  >
                    +
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <label className="form-label">{t('usersWithAccess') || 'Users with Access'}</label>
                {accountUsers.length === 0 ? (
                  <p style={{ color: '#666' }}>{t('noData')}</p>
                ) : (
                  <table className="table" style={{ marginTop: '10px' }}>
                    <thead>
                      <tr>
                        <th>{t('fullName')}</th>
                        <th>{t('userRole')}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountUsers.map(au => (
                        <tr key={au.id}>
                          <td>{au.full_name}</td>
                          <td>{au.role}</td>
                          <td>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveAccess(au.id)}
                              disabled={accessLoading}
                            >
                              {t('remove') || 'Remove'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowAccessModal(false)}>
                {t('close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
