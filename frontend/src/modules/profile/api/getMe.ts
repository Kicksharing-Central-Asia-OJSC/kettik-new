import { authed } from "@/assets/lib/api";

export type Me = {
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
};

export function getMe() {
  return authed<Me>("/proxy/users/me/");
}
