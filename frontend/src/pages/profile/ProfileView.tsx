import { useEffect, useState } from "react";
import { getMe, type Me } from "@/modules/profile/api/getMe";
import { clearToken } from "@/assets/lib/api";
import { useNavigate } from "react-router-dom";

export default function ProfileView() {
  const [me, setMe] = useState<Me | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    getMe().then(setMe).catch((e) => setErr(e.message));
  }, []);

  function logout() {
    clearToken();
    nav("/auth/phone", { replace: true });
  }

  if (err) return <div style={{ color: "salmon" }}>Ошибка: {err}</div>;
  if (!me) return <div>Загрузка…</div>;
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", maxWidth: 760 }}>
        <h1>Профиль</h1>
        <button onClick={logout}>Выйти</button>
      </div>
      <pre
        style={{
          background: "#0b1220",
          color: "#cde1ff",
          padding: 16,
          borderRadius: 12,
          maxWidth: 760,
        }}
      >
        {JSON.stringify(me, null, 2)}
      </pre>
    </div>
  );
}
