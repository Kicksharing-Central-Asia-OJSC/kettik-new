interface NavigationProps {
  activeTab: 'profile' | 'balance' | 'cards';
  onTabChange: (tab: 'profile' | 'balance' | 'cards') => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="dashboard-nav">
      <button
        className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => onTabChange('profile')}
      >
        <div className="nav-icon">👤</div>
        <span>Профиль</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'balance' ? 'active' : ''}`}
        onClick={() => onTabChange('balance')}
      >
        <div className="nav-icon">💰</div>
        <span>Баланс</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'cards' ? 'active' : ''}`}
        onClick={() => onTabChange('cards')}
      >
        <div className="nav-icon">💳</div>
        <span>Карты</span>
      </button>
    </nav>
  );
}