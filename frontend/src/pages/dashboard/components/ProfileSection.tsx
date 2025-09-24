import { useState } from 'react';
import { type Me } from '@/modules/profile/api/getMe';
import { authed } from '@/assets/lib/api';

interface ProfileSectionProps {
  user: Me | null;
  onUserUpdate: () => void;
}

export default function ProfileSection({ user, onUserUpdate }: ProfileSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      middle_name: formData.get('middle_name'),
      email: formData.get('email'),
      birth_date: formData.get('birth_date'),
    };

    try {
      await authed('/users/update_profile/', {
        method: 'PATCH',
        json: data,
      });
      setSuccess('Профиль успешно обновлен');
      onUserUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Нет данных пользователя</div>;

  return (
    <div className="profile-section">
      <div className="section-card">
        <h2>Личная информация</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="first_name">Имя</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              defaultValue={user.first_name || ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Фамилия</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              defaultValue={user.last_name || ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="middle_name">Отчество</label>
            <input
              type="text"
              id="middle_name"
              name="middle_name"
              defaultValue={user.middle_name || ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              defaultValue={user.email || ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="birth_date">Дата рождения</label>
            <input
              type="date"
              id="birth_date"
              name="birth_date"
              defaultValue={user.birth_date || ''}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>

        <div className="profile-info">
          <div className="info-item">
            <span className="label">Телефон:</span>
            <span className="value">{user.phone_number}</span>
          </div>
          <div className="info-item">
            <span className="label">Баланс:</span>
            <span className="value">{user.balance} ₸</span>
          </div>
          <div className="info-item">
            <span className="label">Верификация:</span>
            <span className={`badge ${user.is_verified ? 'verified' : 'unverified'}`}>
              {user.is_verified ? 'Подтвержден' : 'Не подтвержден'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}