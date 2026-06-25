export interface Business {
  id: string;
  name: string;
  slug: string | null;
  reward_threshold: number;
  reward_description: string;
  brand_color: string;
  created_by: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  business_id: string | null;
  role: "owner" | "staff";
  created_at: string;
}

export interface CustomerProgress {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  code: string;
  card_token: string;
  created_at: string;
  total_stamps: number;
  stamps_used: number;
  current_progress: number;
  rewards_earned: number;
  last_stamp_at: string | null;
}

export interface CardData {
  customer_name: string;
  business_name: string;
  brand_color: string;
  reward_description: string;
  threshold: number;
  current_progress: number;
  rewards_earned: number;
}

export interface ActivityRow {
  kind: "stamp" | "redeem";
  customer_name: string;
  created_at: string;
}
