import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User } from '../types';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  onLanguageChange: (lang: string) => void;
}

const Sidebar = ({ user, onLogout, onLanguageChange }: SidebarProps) => {
  const { t, i18n } = useTranslation();

  const adminLinks = [
    { path: '/', label: t('dashboard'), icon: '📊' },
    { path: '/transactions', label: t('transactions'), icon: '💸' },
    { path: '/accounts', label: t('accounts'), icon: '🏦' },
    { path: '/clients', label: t('clients'), icon: '👤' },
    { path: '/users', label: t('users'), icon: '👥' },
    { path: '/reports', label: t('reports'), icon: '📈' },
    { path: '/settings', label: t('settings'), icon: '⚙️' },
    { path: '/activity-log', label: t('activityLog'), icon: '📋' },
  ];

  const cashierLinks = [
    { path: '/', label: t('dashboard'), icon: '📊' },
    { path: '/transactions', label: t('transactions'), icon: '💸' },
    { path: '/accounts', label: t('accounts'), icon: '🏦' },
  ];

  const links = user.role === 'admin' ? adminLinks : cashierLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        {t('appName')}
      </div>
      
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end={link.path === '/'}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
        <select
          className="language-select"
          value={i18n.language}
          onChange={(e) => onLanguageChange(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>

        <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>{user.full_name}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{t(user.role)}</div>
        </div>

        <button onClick={onLogout} className="btn btn-outline" style={{ width: '100%', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
          {t('logout')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
