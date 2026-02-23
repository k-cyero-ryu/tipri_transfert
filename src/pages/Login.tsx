import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

const Login = ({ onLogin }: LoginProps) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await onLogin(username, password);
    } catch (err: any) {
      setError(err.message || t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <h1>{t('appName')}</h1>
        </div>
        
        <p className="login-subtitle">{t('loginSubtitle')}</p>
        
        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('username')}</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">{t('password')}</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? t('loading') : t('login')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
