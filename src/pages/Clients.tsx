import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Client, Account } from '../types';
import * as api from '../api';

interface ClientsProps {
  user: {
    id: number;
    role: 'admin' | 'cashier';
  };
}

const Clients = ({ user }: ClientsProps) => {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLiquidateModal, setShowLiquidateModal] = useState(false);
  const [liquidatingClient, setLiquidatingClient] = useState<Client | null>(null);
  const [liquidateAccountId, setLiquidateAccountId] = useState<string>('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    credit_limit: 0,
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const [clientsData, accountsData] = await Promise.all([
        api.getClients(),
        api.getAccounts(),
      ]);
      setClients(clientsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await api.updateClient(editingClient.id, {
          name: formData.name,
          credit_limit: formData.credit_limit,
        });
      } else {
        await api.createClient({
          name: formData.name,
          credit_limit: formData.credit_limit,
        });
      }
      
      setShowModal(false);
      setEditingClient(null);
      resetForm();
      loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      alert(error instanceof Error ? error.message : 'Error saving client');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      credit_limit: 0,
    });
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      credit_limit: client.credit_limit,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this client?')) {
      try {
        await api.deleteClient(id);
        loadClients();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const openLiquidateModal = (client: Client) => {
    setLiquidatingClient(client);
    setLiquidateAccountId('');
    setShowLiquidateModal(true);
  };

  const handleLiquidate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!liquidatingClient || !liquidateAccountId) {
      alert('Please select an account to receive the liquidation payment');
      return;
    }
    
    try {
      const result = await api.liquidateClient(liquidatingClient.id, parseInt(liquidateAccountId));
      alert(t('debtLiquidated') + ` (${result.liquidated_count} ${t('transactions').toLowerCase()})`);
      setShowLiquidateModal(false);
      setLiquidatingClient(null);
      loadClients();
    } catch (error: any) {
      console.error('Error liquidating client:', error);
      alert(error.response?.data?.error || error.message || t('noDebtToLiquidate'));
    }
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
        <h1 className="header-title">{t('clients')}</h1>
        {user.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setEditingClient(null); setShowModal(true); }}>
            + {t('createClient')}
          </button>
        )}
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('clientName')}</th>
                <th>{t('creditLimit')}</th>
                <th>{t('currentBalance')}</th>
                <th>{t('accountStatus')}</th>
                {user.role === 'admin' && <th>{t('actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={user.role === 'admin' ? 5 : 4} className="empty-state">{t('noData')}</td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td>{client.name}</td>
                    <td>${Number(client.credit_limit || 0).toFixed(2)}</td>
                    <td>
                      <span className={Number(client.current_balance || 0) > 0 ? 'text-danger' : ''}>
                        ${Number(client.current_balance || 0).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${client.is_active ? 'badge-active' : 'badge-inactive'}`}>
                        {client.is_active ? t('active') : t('inactive')}
                      </span>
                    </td>
                    {user.role === 'admin' && (
                      <td className="table-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => handleEdit(client)}>
                          {t('edit')}
                        </button>
                        {Number(client.current_balance || 0) > 0 && (
                          <button className="btn btn-success btn-sm" onClick={() => openLiquidateModal(client)}>
                            {t('liquidate')}
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(client.id)}>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingClient ? t('editClient') : t('createClient')}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('clientName')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('creditLimit')}</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.credit_limit} 
                    onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })} 
                    step="0.01"
                    min="0"
                    required 
                  />
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

      {showLiquidateModal && liquidatingClient && (
        <div className="modal-overlay" onClick={() => setShowLiquidateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('liquidateDebt')}</h2>
              <button className="modal-close" onClick={() => setShowLiquidateModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleLiquidate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('clientName')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={liquidatingClient.name} 
                    disabled 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('currentBalance')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={`$${Number(liquidatingClient.current_balance || 0).toFixed(2)}`} 
                    disabled 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('receiverAccount')}</label>
                  <select 
                    className="form-select" 
                    value={liquidateAccountId} 
                    onChange={(e) => setLiquidateAccountId(e.target.value)} 
                    required
                  >
                    <option value="">-- Select --</option>
                    {accounts.filter(a => a.is_active).map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowLiquidateModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-success">{t('liquidate')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
