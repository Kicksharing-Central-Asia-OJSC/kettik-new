import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestCode } from "@/modules/auth/api";

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
    <div style={{ padding: 24 }}>
      <h1>Вход</h1>
      <form onSubmit={submit}>
        <input
          placeholder="+996..."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button type="submit" disabled={loading}>
          Получить код
        </button>
      </form>
      {err && <div style={{ color: "salmon", marginTop: 8 }}>{err}</div>}
    </div>
  );
}
