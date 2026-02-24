import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import * as api from '../api';

interface UsersProps {
  user: User;
}

const Users = ({ user: currentUser }: UsersProps) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState<{
    username: string;
    password: string;
    full_name: string;
    role: 'admin' | 'cashier';
    is_active: boolean;
  }>({
    username: '',
    password: '',
    full_name: '',
    role: 'cashier',
    is_active: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = {
          full_name: formData.full_name,
          role: formData.role,
          is_active: formData.is_active,
        };
        if (formData.password) {
          (updateData as any).password = formData.password;
        }
        await api.updateUser(editingUser.id, updateData);
      } else {
        await api.createUser(formData);
      }
      
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      full_name: '',
      role: 'cashier',
      is_active: true,
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        await api.deleteUser(id);
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
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
        <h1 className="header-title">{t('users')}</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditingUser(null); setShowModal(true); }}>
          + {t('createUser')}
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('username')}</th>
                <th>{t('fullName')}</th>
                <th>{t('userRole')}</th>
                <th>{t('accountStatus')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">{t('noData')}</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.full_name}</td>
                    <td>{t(user.role)}</td>
                    <td>
                      <span className={`badge ${user.is_active ? 'badge-active' : 'badge-inactive'}`}>
                        {user.is_active ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="table-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => { setEditingUser(user); setFormData({ username: user.username, password: '', full_name: user.full_name, role: user.role, is_active: user.is_active }); setShowModal(true); }}>
                        {t('edit')}
                      </button>
                      {user.id !== currentUser.id && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)}>
                          {t('delete')}
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
              <h2 className="modal-title">{editingUser ? t('editUser') : t('createUser')}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('username')}</label>
                  <input type="text" className="form-input" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required disabled={!!editingUser} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('password')} {editingUser && '(leave blank to keep current)'}</label>
                  <input type="password" className="form-input" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingUser} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('fullName')}</label>
                  <input type="text" className="form-input" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('userRole')}</label>
                  <select className="form-select" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'cashier' })}>
                    <option value="cashier">{t('cashier')}</option>
                    <option value="admin">{t('admin')}</option>
                  </select>
                </div>
                {editingUser && (
                  <div className="form-group">
                    <label className="form-checkbox">
                      <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                      {t('active')}
                    </label>
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

export default Users;
