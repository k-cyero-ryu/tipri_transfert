import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as api from './api';
import { User } from './types';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Clients from './pages/Clients';
import ActivityLog from './pages/ActivityLog';

// Components
import Sidebar from './components/Sidebar';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = async (username: string, password: string) => {
    const response = await api.login(username, password);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
      } />
      
      <Route path="/*" element={
        !user ? <Navigate to="/login" /> : (
          <div className="app-container">
            <Sidebar user={user} onLogout={handleLogout} onLanguageChange={changeLanguage} />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/transactions" element={<Transactions user={user} />} />
                <Route path="/accounts" element={<Accounts user={user} />} />
                <Route path="/clients" element={<Clients user={user} />} />
                <Route path="/users" element={<Users user={user} />} />
                <Route path="/reports" element={<Reports user={user} />} />
                <Route path="/settings" element={<Settings user={user} />} />
                {user.role === 'admin' && (
                  <Route path="/activity-log" element={<ActivityLog user={user} />} />
                )}
              </Routes>
            </main>
          </div>
        )
      } />
    </Routes>
  );
}

export default App;
