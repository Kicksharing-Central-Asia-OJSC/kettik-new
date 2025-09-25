import { useState, useEffect } from 'react';
import { type Me } from '@/modules/profile/api/getMe';
import { authed } from '@/assets/lib/api';

interface BalanceSectionProps {
  user: Me | null;
}

interface BalanceData {
  balance: string;
}

interface TopupResponse {
  success?: boolean;
  message?: string;
  requires_3ds?: boolean;
  redirect_url?: string;
}

export default function BalanceSection({ user }: BalanceSectionProps) {
  const [balance, setBalance] = useState<string>(user?.balance || '0');
  const [topupAmount, setTopupAmount] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const balanceData = await authed<BalanceData>('/users/balance/');
      setBalance(balanceData.balance);
    } catch (err: any) {
      console.error('Error loading balance:', err);
      setBalance(user?.balance || '0');
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const result = await authed('/payments/topup/', {
        method: 'POST',
        json: { amount: parseInt(topupAmount) },
      });

      if (result.requires_3ds && result.redirect_url) {
        window.open(result.redirect_url, '_blank');
        setSuccess('Перейдите по ссылке для завершения оплаты');
      } else {
        setSuccess(result.message || 'Баланс успешно пополнен');
        await loadBalance();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="balance-section">
      <div className="balance-card">
        <div className="balance-header">
          <h2>Текущий баланс</h2>
          <button 
            className="refresh-btn" 
            onClick={loadBalance}
            title="Обновить баланс"
          >
            ↻
          </button>
        </div>
        <div className="balance-amount">{parseFloat(balance).toLocaleString()} ₸</div>
      </div>

      <div className="section-card">
        <h3>Пополнить баланс</h3>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleTopup} className="topup-form">
          <div className="form-group">
            <label htmlFor="topup-amount">Сумма пополнения</label>
            <input
              type="number"
              id="topup-amount"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              min="100"
              max="500000"
              step="100"
              required
            />
          </div>

          <div className="quick-amounts">
            <button 
              type="button" 
              className="quick-amount-btn"
              onClick={() => setTopupAmount('1000')}
            >
              1 000 ₸
            </button>
            <button 
              type="button" 
              className="quick-amount-btn"
              onClick={() => setTopupAmount('5000')}
            >
              5 000 ₸
            </button>
            <button 
              type="button" 
              className="quick-amount-btn"
              onClick={() => setTopupAmount('10000')}
            >
              10 000 ₸
            </button>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Обработка...' : 'Пополнить'}
          </button>
        </form>
      </div>
    </div>
  );
}