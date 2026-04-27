-- ============================================================
-- FYDLY — Migration 00 : Schéma complet
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";   -- Supabase Pro uniquement
                                             -- Supprimer si non disponible

-- ============================================================
-- TABLE : merchants
-- ============================================================
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
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.merchants IS 'Profils commerçants Fydly';

-- ============================================================
-- TABLE : customers
-- ============================================================
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

COMMENT ON TABLE public.customers IS 'Profils clients Fydly';

-- ============================================================
-- TABLE : loyalty_cards
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loyalty_cards (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id   UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  merchant_id   UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  balance       INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned  INTEGER NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  last_scan_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_customer_merchant UNIQUE (customer_id, merchant_id)
);

COMMENT ON TABLE public.loyalty_cards IS 'Carte fidélité par couple client/commerçant';
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_merchant_id ON public.loyalty_cards(merchant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_customer_id ON public.loyalty_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_last_scan ON public.loyalty_cards(last_scan_at);

-- ============================================================
-- TABLE : transactions
-- ============================================================
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

COMMENT ON TABLE public.transactions IS 'Historique de toutes les transactions (gains et rachats)';
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON public.transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON public.transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON public.transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);

-- ============================================================
-- TABLE : qr_tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS public.qr_tokens (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id  UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  token        VARCHAR(255) NOT NULL UNIQUE,
  valid_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.qr_tokens IS 'Tokens QR du jour — rotation quotidienne à 00h00 UTC';
CREATE INDEX IF NOT EXISTS idx_qr_tokens_merchant_id ON public.qr_tokens(merchant_id);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_token ON public.qr_tokens(token);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_active ON public.qr_tokens(is_active, valid_date);

-- ============================================================
-- TABLE : rewards
-- ============================================================
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

COMMENT ON TABLE public.rewards IS 'Récompenses débloquées par les clients';
CREATE INDEX IF NOT EXISTS idx_rewards_merchant_id ON public.rewards(merchant_id);
CREATE INDEX IF NOT EXISTS idx_rewards_customer_id ON public.rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON public.rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_expires_at ON public.rewards(expires_at);

-- ============================================================
-- TABLE : notifications
-- ============================================================
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

COMMENT ON TABLE public.notifications IS 'Historique des notifications push envoyées par les commerçants';
CREATE INDEX IF NOT EXISTS idx_notifications_merchant_id ON public.notifications(merchant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- ============================================================
-- Triggers : updated_at automatique
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_loyalty_cards_updated_at
  BEFORE UPDATE ON public.loyalty_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
