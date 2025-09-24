import { apiFetch, setToken } from "@/assets/lib/api";

export function requestCode(phone_number: string) {
  return apiFetch<{ success?: boolean; message?: string }>(
    "/auth/bot/create-verification/",
    {
      method: "POST",
      json: { phone_number }, // chat_id не требуем; сервер подставит DEV_CHAT_ID
    }
  );
}

export async function checkCode(phone_number: string, code: string) {
  const resp = await apiFetch<{ access_token: string }>(
    "/auth/bot/check/",
    {
      method: "POST",
      json: { phone_number, code },
    }
  );
  setToken(resp.access_token);
  return resp;
}
