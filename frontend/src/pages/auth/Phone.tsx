import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestCode } from "@/lib/api";

export default function Phone() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    
    try {
      await requestCode(phone);
      nav(`/auth/code?phone=${encodeURIComponent(phone)}`);
    } catch (e: any) {
      setErr(e.message ?? "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        <h1>Вход в Kettik</h1>
        <p className="text-muted">Введите номер телефона для получения кода</p>
        
        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="phone">Номер телефона</label>
            <input
              id="phone"
              type="tel"
              placeholder="+996..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          
          {err && <div className="error-message">{err}</div>}
          
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? "Отправка..." : "Получить код"}
          </button>
        </form>
      </div>
    </div>
  );
}