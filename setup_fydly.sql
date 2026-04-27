-- ============================================================
-- FYDLY — Script de configuration complet
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. TABLES
-- ============================================================

-- TABLE : merchants
CREATE TABLE IF NOT EXISTS public.merchants (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name                    VARCHAR(100) NOT NULL,
  sector                  VARCHAR(50),
  program_type            TEXT CHECK (program_type IN ('stamps', 'points')) DEFAULT 'stamps',
  reward_threshold        INTEGER NOT NULL DEFAULT 10,
  reward_description      VARCHAR(200),
  subscription_status     TEXT CHECK (subscription_status IN ('trial', 'active', 'expired')) DEFAULT 'trial',
  trial_ends_at           TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  stripe_customer_id      VARCHAR(255),
  stripe_subscription_id  VARCHAR(255),
  logo_url                TEXT,
  auto_reminders_enabled  BOOLEAN DEFAULT false,
  auto_reminder_message   VARCHAR(140) DEFAULT 'Vous nous manquez ! Venez nous voir pour compléter votre carte de fidélité.',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE : customers
CREATE TABLE IF NOT EXISTS public.customers (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email                VARCHAR(255),
  first_name           VARCHAR(100),
  phone                VARCHAR(30),
  onesignal_player_id  TEXT,
  gdpr_accepted_at     TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE : loyalty_cards
CREATE TABLE IF NOT EXISTS public.loyalty_cards (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id       UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  merchant_id       UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  balance           INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned      INTEGER NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  last_scan_at      TIMESTAMPTZ,
  last_reminded_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_customer_merchant UNIQUE (customer_id, merchant_id)
);

-- TABLE : transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id        UUID NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
  customer_id    UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  merchant_id    UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('earn', 'redeem')),
  amount         INTEGER NOT NULL DEFAULT 1,
  qr_token_used  VARCHAR(255),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE : qr_tokens
CREATE TABLE IF NOT EXISTS public.qr_tokens (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id  UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  token        VARCHAR(255) NOT NULL UNIQUE,
  valid_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE : rewards
CREATE TABLE IF NOT EXISTS public.rewards (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id          UUID NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
  customer_id      UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  merchant_id      UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  status           TEXT NOT NULL CHECK (status IN ('available', 'redeemed', 'expired')) DEFAULT 'available',
  reward_qr_token  VARCHAR(255) NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  redeemed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE : notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id       UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  message           VARCHAR(140) NOT NULL,
  segment           TEXT NOT NULL CHECK (segment IN ('all', 'active', 'inactive')),
  recipients_count  INTEGER DEFAULT 0,
  status            TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. SECURITY (RLS)
-- ============================================================
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Exemples de politiques (voir 01_rls.sql pour le détail complet)
CREATE POLICY "merchants_select_own" ON public.merchants FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "merchants_insert_own" ON public.merchants FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "merchants_update_own" ON public.merchants FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "customers_select_own" ON public.customers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "qr_tokens_select_public" ON public.qr_tokens FOR SELECT USING (true);
-- ... (Plus de politiques peuvent être ajoutées via 01_rls.sql)

-- ============================================================
-- 3. FUNCTIONS (RPC)
-- ============================================================

-- Attribution atomique d'un tampon (upsert_stamp)
CREATE OR REPLACE FUNCTION public.upsert_stamp(
  p_customer_id    UUID,
  p_merchant_id    UUID,
  p_qr_token_used  TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card          public.loyalty_cards%ROWTYPE;
  v_merchant      public.merchants%ROWTYPE;
  v_minutes_left  INTEGER;
  v_new_balance   INTEGER;
  v_reward_id     UUID;
  v_reward_token  TEXT;
BEGIN
  -- Récupérer le commerçant
  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'merchant_not_found');
  END IF;

  -- Vérifier que l'abonnement est actif
  IF v_merchant.subscription_status = 'expired' THEN
    RETURN jsonb_build_object('success', false, 'error', 'subscription_expired');
  END IF;

  -- Récupérer la loyalty_card existante
  SELECT * INTO v_card
  FROM public.loyalty_cards
  WHERE customer_id = p_customer_id AND merchant_id = p_merchant_id;

  -- Anti-fraude : 1 scan par heure
  IF FOUND AND v_card.last_scan_at IS NOT NULL THEN
    v_minutes_left := CEIL(EXTRACT(EPOCH FROM (v_card.last_scan_at + INTERVAL '60 minutes' - NOW())) / 60);
    IF v_minutes_left > 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'too_soon',
        'minutes_left', v_minutes_left
      );
    END IF;
  END IF;

  -- Upsert de la carte
  INSERT INTO public.loyalty_cards (customer_id, merchant_id, balance, total_earned, last_scan_at, created_at, updated_at)
  VALUES (p_customer_id, p_merchant_id, 1, 1, NOW(), NOW(), NOW())
  ON CONFLICT (customer_id, merchant_id) DO UPDATE SET
    balance = public.loyalty_cards.balance + 1,
    total_earned = public.loyalty_cards.total_earned + 1,
    last_scan_at = NOW(),
    updated_at = NOW()
  RETURNING * INTO v_card;

  v_new_balance := v_card.balance;

  -- Créer transaction
  INSERT INTO public.transactions (card_id, customer_id, merchant_id, type, amount, qr_token_used)
  VALUES (v_card.id, p_customer_id, p_merchant_id, 'earn', 1, p_qr_token_used);

  -- Reward check : balance >= threshold → créer récompense et reset
  IF v_new_balance >= v_merchant.reward_threshold THEN
    v_reward_token := gen_random_uuid()::TEXT;

    INSERT INTO public.rewards (card_id, customer_id, merchant_id, status, reward_qr_token, expires_at)
    VALUES (v_card.id, p_customer_id, p_merchant_id, 'available', v_reward_token, NOW() + INTERVAL '30 days')
    RETURNING id INTO v_reward_id;

    UPDATE public.loyalty_cards SET balance = 0, updated_at = NOW() WHERE id = v_card.id;
    v_new_balance := 0;
  END IF;

  RETURN jsonb_build_object(
    'success',            true,
    'card_id',            v_card.id,
    'new_balance',        v_new_balance,
    'total_earned',       v_card.total_earned,
    'reward_unlocked',    v_reward_id IS NOT NULL,
    'reward_token',       v_reward_token,
    'threshold',          v_merchant.reward_threshold,
    'reward_description', v_merchant.reward_description
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_stamp(UUID, UUID, TEXT) TO authenticated;

-- Fonction de validation de QR token
CREATE OR REPLACE FUNCTION public.validate_qr_token(p_token TEXT, p_merchant_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_token public.qr_tokens%ROWTYPE; v_merchant public.merchants%ROWTYPE;
BEGIN
  SELECT * INTO v_token FROM public.qr_tokens WHERE token = p_token AND merchant_id = p_merchant_id AND is_active = true AND valid_date = CURRENT_DATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'error', 'invalid_token'); END IF;
  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;
  RETURN jsonb_build_object('valid', true, 'merchant_name', v_merchant.name, 'sector', v_merchant.sector);
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_qr_token(TEXT, UUID) TO anon, authenticated;
