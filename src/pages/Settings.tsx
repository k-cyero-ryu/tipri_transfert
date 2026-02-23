import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Settings as SettingsType } from '../types';
import * as api from '../api';

interface SettingsProps {
  user: User;
}

const Settings = ({ user }: SettingsProps) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SettingsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    credit_notification_days: '7',
    business_name: 'TIPRI Transfert',
    default_tax_rate: '3',
  });

  useEffect(() => {
    if (user.role === 'admin') {
      loadSettings();
    }
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      
      // Set form data from settings
      const settingsObj: Record<string, string> = {};
      data.forEach((s: SettingsType) => {
        settingsObj[s.key] = s.value;
      });
      
      setFormData({
        credit_notification_days: settingsObj.credit_notification_days || '7',
        business_name: settingsObj.business_name || 'TIPRI Transfert',
        default_tax_rate: settingsObj.default_tax_rate || '3',
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      await api.updateSetting('credit_notification_days', formData.credit_notification_days);
      await api.updateSetting('business_name', formData.business_name);
      await api.updateSetting('default_tax_rate', formData.default_tax_rate);
      
      setMessage(t('success'));
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage(t('error'));
    } finally {
      setSaving(false);
    }
  };

  if (user.role !== 'admin') {
    return (
      <div>
        <h1>{t('settings')}</h1>
        <p>Access denied. Admin only.</p>
      </div>
    );
  }

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
        <h1 className="header-title">{t('settings')}</h1>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('businessName')}</label>
            <input
              type="text"
              className="form-input"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">{t('creditNotificationDays')}</label>
            <input
              type="number"
              className="form-input"
              value={formData.credit_notification_days}
              onChange={(e) => setFormData({ ...formData, credit_notification_days: e.target.value })}
              required
              min="1"
              max="30"
            />
            <small style={{ color: 'var(--text-secondary)' }}>
              Number of days after which credit payments generate notifications
            </small>
          </div>
          
          <div className="form-group">
            <label className="form-label">{t('defaultTaxRate')} (%)</label>
            <input
              type="number"
              className="form-input"
              value={formData.default_tax_rate}
              onChange={(e) => setFormData({ ...formData, default_tax_rate: e.target.value })}
              required
              min="0"
              max="100"
              step="0.1"
            />
          </div>
          
          {message && (
            <div style={{ 
              padding: '0.75rem', 
              background: message === t('success') ? '#d1fae5' : '#fee2e2',
              color: message === t('success') ? '#065f46' : '#991b1b',
              borderRadius: '0.25rem',
              marginBottom: '1rem'
            }}>
              {message}
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? t('loading') : t('save')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
