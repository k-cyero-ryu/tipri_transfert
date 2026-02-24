import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import { ActivityLogEntry, getActivityLogs, getUsers } from '../api';

interface ActivityLogProps {
  user: User;
}

const ActivityLog = ({ user }: ActivityLogProps) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    action: '',
    userId: '',
  });

  useEffect(() => {
    loadData();
    loadUsers();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getActivityLogs(filters);
      setLogs(data);
    } catch (error) {
      console.error('Error loading activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleFilter = () => {
    loadData();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getActionBadgeClass = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('create') || lowerAction.includes('login') || lowerAction.includes('confirm')) {
      return 'badge-success';
    }
    if (lowerAction.includes('delete') || lowerAction.includes('cancel')) {
      return 'badge-danger';
    }
    if (lowerAction.includes('update') || lowerAction.includes('edit')) {
      return 'badge-warning';
    }
    return 'badge-pending';
  };

  // Get unique actions from logs for filter dropdown
  const uniqueActions = [...new Set(logs.map(log => log.action))];

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
        <h1 className="header-title">{t('activityLog')}</h1>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>{t('startDate')}:</label>
          <input 
            type="date" 
            className="form-input" 
            value={filters.startDate} 
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} 
          />
        </div>
        <div className="filter-group">
          <label>{t('endDate')}:</label>
          <input 
            type="date" 
            className="form-input" 
            value={filters.endDate} 
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} 
          />
        </div>
        <div className="filter-group">
          <label>{t('action')}:</label>
          <select 
            className="form-select" 
            value={filters.action} 
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          >
            <option value="">{t('all')}</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>{t('user')}:</label>
          <select 
            className="form-select" 
            value={filters.userId} 
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
          >
            <option value="">{t('all')}</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleFilter}>{t('filter')}</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('dateTime')}</th>
                <th>{t('user')}</th>
                <th>{t('action')}</th>
                <th>{t('details')}</th>
                <th>{t('entity')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">{t('noData')}</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.created_at)}</td>
                    <td>
                      <div>{log.full_name || log.username || 'Unknown'}</div>
                      <small style={{ color: '#666' }}>{log.role}</small>
                    </td>
                    <td>
                      <span className={`badge ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.details || '-'}</td>
                    <td>
                      {log.entity_type && log.entity_id ? (
                        <span>{log.entity_type} #{log.entity_id}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
