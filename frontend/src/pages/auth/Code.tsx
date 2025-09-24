import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { checkCode } from "@/modules/auth/api";

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
      nav("/profile");
    } catch (e: any) {
      setErr(e.message ?? "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Код</h1>
      <form onSubmit={submit}>
        <input
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.trim())}
          style={{ marginRight: 8 }}
        />
        <button type="submit" disabled={loading}>
          Войти
        </button>
      </form>
      <div style={{ marginTop: 8, opacity: 0.7 }}>Телефон: {phone}</div>
      {err && <div style={{ color: "salmon", marginTop: 8 }}>{err}</div>}
    </div>
  );
}
