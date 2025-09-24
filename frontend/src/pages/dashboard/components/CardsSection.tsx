import { useState, useEffect } from 'react';
import { authed } from '@/assets/lib/api';

interface Card {
  id: number;
  masked_number: string;
  card_type: string;
  bank_name: string;
  expiry_month: string;
  expiry_year: string;
  is_default: boolean;
  is_active: boolean;
  is_expired: boolean;
}

export default function CardsSection() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const response = await authed<{ results?: Card[] } | Card[]>('/payments/methods/');
      const cardsData = Array.isArray(response) ? response : response.results || [];
      setCards(cardsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addNewCard = async () => {
    try {
      const result = await authed<{ redirect_url?: string }>('/payments/methods/add_card/', { 
        method: 'POST' 
      });
      
      if (result.redirect_url) {
        const cardWindow = window.open(result.redirect_url, '_blank', 'width=800,height=600');
        
        if (cardWindow) {
          const checkClosed = setInterval(() => {
            if (cardWindow.closed) {
              clearInterval(checkClosed);
              setTimeout(() => {
                if (confirm('Карта добавлена? Обновить список карт?')) {
                  loadCards();
                }
              }, 1000);
            }
          }, 1000);
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const setDefaultCard = async (cardId: number) => {
    try {
      await authed(`/payments/methods/${cardId}/set_default/`, { method: 'POST' });
      setSuccess('Карта установлена как основная');
      loadCards();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const removeCard = async (cardId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту карту?')) return;
    
    try {
      await authed(`/payments/methods/${cardId}/deactivate/`, { method: 'POST' });
      loadCards();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="cards-section">
        <div className="loading-spinner">Загрузка карт...</div>
      </div>
    );
  }

  return (
    <div className="cards-section">
      <div className="section-card">
        <div className="cards-header">
          <h2>Мои карты</h2>
          <button className="btn-primary" onClick={addNewCard}>
            + Добавить
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {cards.length === 0 ? (
          <div className="empty-cards">
            <p>У вас нет привязанных карт</p>
            <button className="btn-primary" onClick={addNewCard}>
              Привязать первую карту
            </button>
          </div>
        ) : (
          <div className="cards-list">
            {cards.map((card) => (
              <div key={card.id} className="card-item">
                <div className="card-info">
                  <div className="card-number">
                    <strong>{card.masked_number}</strong>
                    {card.is_default && <span className="badge-default">Основная</span>}
                    {card.is_expired && <span className="badge-expired">Истекла</span>}
                  </div>
                  <div className="card-details">
                    {card.card_type} {card.bank_name}
                    <br />
                    Действует до: {card.expiry_month}/{card.expiry_year}
                    <span className={`status ${card.is_active ? 'active' : 'inactive'}`}>
                      {card.is_active ? '● Активна' : '● Неактивна'}
                    </span>
                  </div>
                </div>
                <div className="card-actions">
                  {!card.is_default && (
                    <button 
                      className="btn-secondary btn-sm"
                      onClick={() => setDefaultCard(card.id)}
                    >
                      Сделать основной
                    </button>
                  )}
                  <button 
                    className="btn-danger btn-sm"
                    onClick={() => removeCard(card.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}