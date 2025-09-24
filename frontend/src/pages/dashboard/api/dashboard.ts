import { authed } from '@/assets/lib/api';

// Balance API
export interface BalanceResponse {
  balance: string;
}

export function getBalance() {
  return authed<BalanceResponse>('/users/balance/');
}

// Topup API
export interface TopupRequest {
  amount: number;
  payment_method_id?: number;
}

export interface TopupResponse {
  success: boolean;
  message: string;
  requires_3ds?: boolean;
  redirect_url?: string;
}

export function topupBalance(data: TopupRequest) {
  return authed<TopupResponse>('/payments/topup/', {
    method: 'POST',
    json: data,
  });
}

// Cards API
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

export interface CardsResponse {
  results?: Card[];
}

export function getPaymentMethods() {
  return authed<CardsResponse | Card[]>('/payments/methods/');
}

export function addCard() {
  return authed<{ redirect_url?: string }>('/payments/methods/add_card/', {
    method: 'POST',
  });
}

export function setDefaultCard(cardId: number) {
  return authed(`/payments/methods/${cardId}/set_default/`, {
    method: 'POST',
  });
}

export function deactivateCard(cardId: number) {
  return authed(`/payments/methods/${cardId}/deactivate/`, {
    method: 'POST',
  });
}

// Profile API
export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  email?: string;
  birth_date?: string;
}

export function updateProfile(data: UpdateProfileRequest) {
  return authed('/users/update_profile/', {
    method: 'PATCH',
    json: data,
  });
}