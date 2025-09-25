import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { checkCode } from "@/lib/api";

export default function Code() {
  const [params] = useSearchParams();
  const phone = useMemo(() => params.get("phone") ?? "", [params]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    
    try {
      await checkCode(phone, code);
      nav("/dashboard");
    } catch (e: any) {
      setErr(e.message ?? "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        <h1>Введите код</h1>
        <p className="text-muted">Код отправлен на номер: {phone}</p>
        
        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="code">Код подтверждения</label>
            <input
              id="code"
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              maxLength={6}
            />
          </div>
          
          {err && <div className="error-message">{err}</div>}
          
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? "Проверка..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}