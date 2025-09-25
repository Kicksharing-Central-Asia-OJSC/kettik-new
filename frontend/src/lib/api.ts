// ============ BASE CONFIG ============
export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

// ============ TOKEN MANAGEMENT ============
export function getToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setToken(token: string) {
  localStorage.setItem("access_token", token);
}

export function clearToken() {
  localStorage.removeItem("access_token");
}

// ============ HTTP CLIENT ============
type Options = RequestInit & { json?: unknown };

async function doFetch<T>(path: string, opts: Options = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string> | undefined),
  };
  
  if (opts.json !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...opts,
    headers,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.body,
    credentials: "omit",
  });

  const text = await res.text();
  let data: any = null;
  
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = (data && (data.error || data.detail || data.message)) || res.statusText;
    
    // Если 401 - токен невалиден
    if (res.status === 401) {
      clearToken();
      window.location.href = "/auth/phone";
      throw new Error("Сессия истекла");
    }
    
    throw new Error(String(msg));
  }
  
  return data as T;
}

export function apiFetch<T>(path: string, opts: Options = {}) {
  return doFetch<T>(path, opts);
}

export function authed<T>(path: string, opts: Options = {}) {
  const token = getToken();
  if (!token) throw new Error("NO_TOKEN");
  
  const headers = {
    ...(opts.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${token}`,
  };
  
  return doFetch<T>(path, { ...opts, headers });
}

// ============ TYPES ============
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string;
  phone_number: string;
  birth_date: string;
  balance: string;
  is_verified: boolean;
  verification_level: string;
  full_name: string;
  age: number;
  has_active_rentals: boolean;
}

export interface Card {
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

export interface BalanceResponse {
  balance: string;
}

export interface TopupResponse {
  success: boolean;
  message: string;
  requires_3ds?: boolean;
  redirect_url?: string;
}

// ============ AUTH API ============
export function requestCode(phone_number: string) {
  return apiFetch<{ success?: boolean; message?: string }>(
    "/auth/bot/create-verification/",
    {
      method: "POST",
      json: { phone_number },
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

// ============ USER API ============
export function getMe() {
  return authed<User>("/proxy/users/me/");
}

export function updateProfile(data: {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  email?: string;
  birth_date?: string;
}) {
  return authed("/users/update_profile/", {
    method: "PATCH",
    json: data,
  });
}

// ============ BALANCE API ============
export function getBalance() {
  return authed<BalanceResponse>("/users/balance/");
}

export function topupBalance(amount: number, payment_method_id?: number) {
  return authed<TopupResponse>("/payments/topup/", {
    method: "POST",
    json: { amount, payment_method_id },
  });
}

// ============ CARDS API ============
export function getPaymentMethods() {
  return authed<{ results?: Card[] } | Card[]>("/payments/methods/");
}

export function addCard() {
  return authed<{ redirect_url?: string }>("/payments/methods/add_card/", {
    method: "POST",
  });
}

export function setDefaultCard(cardId: number) {
  return authed(`/payments/methods/${cardId}/set_default/`, {
    method: "POST",
  });
}

export function deactivateCard(cardId: number) {
  return authed(`/payments/methods/${cardId}/deactivate/`, {
    method: "POST",
  });
}