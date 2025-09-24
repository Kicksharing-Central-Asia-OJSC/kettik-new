import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, type Me } from '@/modules/profile/api/getMe';
import { clearToken } from '@/assets/lib/api';
import Navigation from './components/Navigation';
import ProfileSection from './components/ProfileSection';
import BalanceSection from './components/BalanceSection';
import CardsSection from './components/CardsSection';
import './dashboard.css';

type TabType = 'profile' | 'balance' | 'cards';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await getMe();
      setUser(userData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    navigate('/auth/phone', { replace: true });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>Ошибка: {error}</p>
        <button onClick={() => window.location.reload()}>Попробовать снова</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <h1>Kettik</h1>
          <div className="user-info">
            <span>{user?.full_name || user?.phone_number}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {activeTab === 'profile' && <ProfileSection user={user} onUserUpdate={loadUserData} />}
        {activeTab === 'balance' && <BalanceSection user={user} />}
        {activeTab === 'cards' && <CardsSection />}
      </div>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}