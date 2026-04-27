import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Variables d'environnement Supabase manquantes.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

// ── Types TypeScript ───────────────────────────────────────────────────────────

export type Merchant = {
  id: string;
  user_id: string;
  name: string;
  sector: string | null;
  program_type: "stamps" | "points";
  reward_threshold: number;
  reward_description: string | null;
  subscription_status: "trial" | "active" | "expired";
  trial_ends_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  phone: string | null;
  onesignal_player_id: string | null;
  gdpr_accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LoyaltyCard = {
  id: string;
  customer_id: string;
  merchant_id: string;
  balance: number;
  total_earned: number;
  last_scan_at: string | null;
  created_at: string;
  updated_at: string;
  customers?: Customer;
};

export type Transaction = {
  id: string;
  card_id: string;
  customer_id: string;
  merchant_id: string;
  type: "earn" | "redeem";
  amount: number;
  qr_token_used: string | null;
  created_at: string;
  customers?: Customer;
};

export type QrToken = {
  id: string;
  merchant_id: string;
  token: string;
  valid_date: string;
  is_active: boolean;
  created_at: string;
};

export type Reward = {
  id: string;
  card_id: string;
  customer_id: string;
  merchant_id: string;
  status: "available" | "redeemed" | "expired";
  reward_qr_token: string;
  expires_at: string;
  redeemed_at: string | null;
  created_at: string;
  customers?: Customer;
};

export type Notification = {
  id: string;
  merchant_id: string;
  message: string;
  segment: "all" | "active" | "inactive";
  recipients_count: number;
  status: "pending" | "sent" | "failed";
  sent_at: string | null;
  created_at: string;
};

export type MerchantRow = Merchant;
export type CustomerRow = Customer;
export type LoyaltyCardRow = LoyaltyCard;
export type TransactionRow = Transaction;
export type QrTokenRow = QrToken;
export type RewardRow = Reward;
export type NotificationRow = Notification;

// ── Helpers Auth & Client ──────────────────────────────────────────────────────

/**
 * Attribue un tampon via la fonction SQL atomique (upsert_stamp)
 */
export async function attributeStamp(payload: {
  customerId: string;
  merchantId: string;
  qrTokenUsed: string;
}): Promise<{
  success: boolean;
  error?: string;
  minutesLeft?: number;
  newBalance?: number;
  totalEarned?: number;
  rewardUnlocked?: boolean;
  rewardToken?: string;
  threshold?: number;
  rewardDescription?: string;
}> {
  const { data, error } = await supabase.rpc("upsert_stamp", {
    p_customer_id: payload.customerId,
    p_merchant_id: payload.merchantId,
    p_qr_token_used: payload.qrTokenUsed,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as {
    success: boolean;
    error?: string;
    minutes_left?: number;
    new_balance?: number;
    total_earned?: number;
    reward_unlocked?: boolean;
    reward_token?: string;
    threshold?: number;
    reward_description?: string;
  };

  return {
    success: result.success,
    error: result.error,
    minutesLeft: result.minutes_left,
    newBalance: result.new_balance,
    totalEarned: result.total_earned,
    rewardUnlocked: result.reward_unlocked,
    rewardToken: result.reward_token,
    threshold: result.threshold,
    rewardDescription: result.reward_description,
  };
}

/**
 * Valide un token QR public sans auth (fonction SQL validate_qr_token)
 */
export async function validateQrToken(token: string, merchantId: string): Promise<{
  valid: boolean;
  merchantName?: string;
  sector?: string;
  error?: string;
}> {
  const { data, error } = await supabase.rpc("validate_qr_token", {
    p_token: token,
    p_merchant_id: merchantId,
  });

  if (error) return { valid: false, error: error.message };

  const result = data as {
    valid: boolean;
    merchant_name?: string;
    sector?: string;
    error?: string;
  };

  return {
    valid: result.valid,
    merchantName: result.merchant_name,
    sector: result.sector,
    error: result.error,
  };
}

/**
 * Crée le profil client (upsert) après connexion
 */
export async function upsertCustomerProfile(payload: {
  userId: string;
  email: string;
  firstName?: string;
  phone?: string;
  gdprAccepted?: boolean;
}): Promise<{ data: Customer | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("customers")
    .upsert(
      {
        user_id: payload.userId,
        email: payload.email,
        first_name: payload.firstName ?? null,
        phone: payload.phone ?? null,
        gdpr_accepted_at: payload.gdprAccepted ? new Date().toISOString() : null,
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  return { data: data as Customer | null, error: error as Error | null };
}
