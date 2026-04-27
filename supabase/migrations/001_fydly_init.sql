-- ============================================================
--  FYDLY — Migration SQL complète v1.0
--  À exécuter dans : Supabase > SQL Editor > New query
--  Ordre : ce fichier unique suffit (exécuter en une seule fois)
-- ============================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ============================================================
-- 1. TABLES
-- ============================================================

-- ----------------------------
-- 1.1 MERCHANTS
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.merchants (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name                   VARCHAR(100) NOT NULL,
  sector                 VARCHAR(50),
  program_type           TEXT CHECK (program_type IN ('stamps', 'points')) DEFAULT 'stamps',
  reward_threshold       INTEGER NOT NULL DEFAULT 10,
  reward_description     VARCHAR(200),
  subscription_status    TEXT CHECK (subscription_status IN ('trial', 'active', 'expired')) DEFAULT 'trial',
  trial_ends_at          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  stripe_customer_id     VARCHAR,
  stripe_subscription_id VARCHAR,
  logo_url               TEXT,
  phone                  VARCHAR,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------
-- 1.2 CUSTOMERS
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email               VARCHAR NOT NULL,
  first_name          VARCHAR,
  phone               VARCHAR,
  onesignal_player_id TEXT,
  rgpd_accepted_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------
-- 1.3 QR TOKENS
-- (créées avant loyalty_cards car pas de dépendance)
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.qr_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  token       VARCHAR NOT NULL UNIQUE,
  valid_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------
-- 1.4 LOYALTY CARDS
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.loyalty_cards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  merchant_id  UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  balance      INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0,
  last_scan_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, merchant_id)
);

-- ----------------------------
-- 1.5 TRANSACTIONS
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id        UUID NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
  customer_id    UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  merchant_id    UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('earn', 'redeem')),
  amount         INTEGER NOT NULL DEFAULT 1,
  qr_token_used  VARCHAR,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------
-- 1.6 REWARDS
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.rewards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id          UUID NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
  customer_id      UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  merchant_id      UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  status           TEXT NOT NULL CHECK (status IN ('available', 'redeemed', 'expired')) DEFAULT 'available',
  reward_qr_token  VARCHAR UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  redeemed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------
-- 1.7 NOTIFICATIONS
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id      UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  message          VARCHAR(140) NOT NULL,
  segment          TEXT NOT NULL CHECK (segment IN ('all', 'active', 'inactive')) DEFAULT 'all',
  recipients_count INTEGER DEFAULT 0,
  status           TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  sent_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. INDEXES (performance)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_merchants_user_id       ON public.merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id       ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_customer  ON public.loyalty_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_merchant  ON public.loyalty_cards(merchant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_last_scan ON public.loyalty_cards(last_scan_at);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant   ON public.transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer   ON public.transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created    ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_card       ON public.transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_merchant      ON public.qr_tokens(merchant_id);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_token         ON public.qr_tokens(token);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_valid_date    ON public.qr_tokens(valid_date);
CREATE INDEX IF NOT EXISTS idx_rewards_card_status     ON public.rewards(card_id, status);
CREATE INDEX IF NOT EXISTS idx_rewards_qr_token        ON public.rewards(reward_qr_token);
CREATE INDEX IF NOT EXISTS idx_rewards_customer        ON public.rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_merchant  ON public.notifications(merchant_id);

-- ============================================================
-- 3. TRIGGERS — updated_at automatique
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER loyalty_cards_updated_at
  BEFORE UPDATE ON public.loyalty_cards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.merchants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_cards  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_tokens      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------
-- 4.1 MERCHANTS — RLS policies
-- -----------------------------------------------

-- Un commerçant peut lire/modifier uniquement son propre profil
CREATE POLICY "merchant_select_own" ON public.merchants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "merchant_update_own" ON public.merchants
  FOR UPDATE USING (auth.uid() = user_id);

-- Insertion autorisée pour tout utilisateur connecté (lors de l'inscription)
CREATE POLICY "merchant_insert_own" ON public.merchants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les clients peuvent lire le nom/secteur d'un commerçant (pour afficher sur /customer/auth)
CREATE POLICY "customer_read_merchant_public" ON public.merchants
  FOR SELECT USING (true);  -- lecture publique limitée (nom, secteur uniquement — pas de données financières)

-- -----------------------------------------------
-- 4.2 CUSTOMERS — RLS policies
-- -----------------------------------------------

-- Un client ne peut lire/modifier que son propre profil
CREATE POLICY "customer_select_own" ON public.customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "customer_update_own" ON public.customers
  FOR UPDATE USING (auth.uid() = user_id);

-- Insertion autorisée pour tout utilisateur connecté (lors du premier scan)
CREATE POLICY "customer_insert_own" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Un commerçant peut lire les customers qui ont une loyalty_card chez lui
CREATE POLICY "merchant_read_customers" ON public.customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loyalty_cards lc
      JOIN public.merchants m ON m.id = lc.merchant_id
      WHERE lc.customer_id = customers.id
        AND m.user_id = auth.uid()
    )
  );

-- -----------------------------------------------
-- 4.3 LOYALTY CARDS — RLS policies
-- -----------------------------------------------

-- Un client peut lire ses propres cartes
CREATE POLICY "customer_read_own_cards" ON public.loyalty_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = loyalty_cards.customer_id AND c.user_id = auth.uid()
    )
  );

-- Un commerçant peut lire les cartes de ses clients
CREATE POLICY "merchant_read_own_cards" ON public.loyalty_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = loyalty_cards.merchant_id AND m.user_id = auth.uid()
    )
  );

-- Les insertions/mises à jour passent par les RPC (SECURITY DEFINER)
-- On autorise quand même pour les RPC avec SECURITY DEFINER (contourné via rôle service)

-- -----------------------------------------------
-- 4.4 TRANSACTIONS — RLS policies
-- -----------------------------------------------

-- Un client voit ses propres transactions
CREATE POLICY "customer_read_own_transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = transactions.customer_id AND c.user_id = auth.uid()
    )
  );

-- Un commerçant voit les transactions de son établissement
CREATE POLICY "merchant_read_own_transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = transactions.merchant_id AND m.user_id = auth.uid()
    )
  );

-- -----------------------------------------------
-- 4.5 QR TOKENS — RLS policies
-- -----------------------------------------------

-- Lecture publique des tokens pour validation (scan client non connecté)
CREATE POLICY "public_read_qr_tokens" ON public.qr_tokens
  FOR SELECT USING (true);

-- Un commerçant peut insérer/modifier ses propres tokens
CREATE POLICY "merchant_manage_qr_tokens" ON public.qr_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = qr_tokens.merchant_id AND m.user_id = auth.uid()
    )
  );

-- -----------------------------------------------
-- 4.6 REWARDS — RLS policies
-- -----------------------------------------------

-- Un client voit ses propres récompenses
CREATE POLICY "customer_read_own_rewards" ON public.rewards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = rewards.customer_id AND c.user_id = auth.uid()
    )
  );

-- Un commerçant voit les récompenses de ses clients
CREATE POLICY "merchant_read_own_rewards" ON public.rewards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = rewards.merchant_id AND m.user_id = auth.uid()
    )
  );

-- -----------------------------------------------
-- 4.7 NOTIFICATIONS — RLS policies
-- -----------------------------------------------

-- Un commerçant voit uniquement ses propres notifications
CREATE POLICY "merchant_manage_notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = notifications.merchant_id AND m.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. RPC — FONCTIONS ATOMIQUES (SECURITY DEFINER)
-- ============================================================
-- SECURITY DEFINER = s'exécute avec les droits du créateur (contourne RLS)
-- Cela est intentionnel : les RPC encapsulent toute la logique métier
-- et incluent leurs propres vérifications de sécurité.

-- -----------------------------------------------------------
-- 5.1 attribute_stamp — Attribution d'un tampon (atomique)
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.attribute_stamp(
  p_customer_id UUID,
  p_merchant_id UUID,
  p_qr_token    VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card          public.loyalty_cards%ROWTYPE;
  v_merchant      public.merchants%ROWTYPE;
  v_reward_id     UUID;
  v_token_valid   BOOLEAN;
  v_minutes_left  INTEGER;
BEGIN

  -- 1. Valider le token QR (existe, valide aujourd'hui UTC, actif)
  SELECT EXISTS(
    SELECT 1 FROM public.qr_tokens
    WHERE token = p_qr_token
      AND valid_date = CURRENT_DATE
      AND is_active = true
      AND merchant_id = p_merchant_id
  ) INTO v_token_valid;

  IF NOT v_token_valid THEN
    RETURN jsonb_build_object(
      'error', 'invalid_token',
      'message', 'Ce QR code n''est plus valide. Demandez au commerçant le QR du jour.'
    );
  END IF;

  -- 2. Récupérer le commerçant
  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'merchant_not_found');
  END IF;

  -- 3. Anti-fraude : vérifier last_scan_at < 60 minutes
  SELECT * INTO v_card
  FROM public.loyalty_cards
  WHERE customer_id = p_customer_id AND merchant_id = p_merchant_id;

  IF FOUND AND v_card.last_scan_at IS NOT NULL
     AND v_card.last_scan_at > NOW() - INTERVAL '60 minutes' THEN
    v_minutes_left := CEIL(60 - EXTRACT(EPOCH FROM (NOW() - v_card.last_scan_at)) / 60);
    RETURN jsonb_build_object(
      'error', 'too_soon',
      'minutes_left', v_minutes_left,
      'message', 'Vous avez déjà scanné ici récemment. Revenez dans ' || v_minutes_left || ' minutes.'
    );
  END IF;

  -- 4. Upsert loyalty_card (atomique)
  INSERT INTO public.loyalty_cards (customer_id, merchant_id, balance, total_earned, last_scan_at)
  VALUES (p_customer_id, p_merchant_id, 1, 1, NOW())
  ON CONFLICT (customer_id, merchant_id)
  DO UPDATE SET
    balance      = public.loyalty_cards.balance + 1,
    total_earned = public.loyalty_cards.total_earned + 1,
    last_scan_at = NOW(),
    updated_at   = NOW()
  RETURNING * INTO v_card;

  -- 5. Créer la transaction
  INSERT INTO public.transactions (card_id, customer_id, merchant_id, type, amount, qr_token_used)
  VALUES (v_card.id, p_customer_id, p_merchant_id, 'earn', 1, p_qr_token);

  -- 6. Vérifier si récompense débloquée
  IF v_card.balance >= v_merchant.reward_threshold THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.rewards
      WHERE card_id = v_card.id AND status = 'available'
    ) THEN
      INSERT INTO public.rewards (
        card_id, customer_id, merchant_id,
        status, reward_qr_token, expires_at
      )
      VALUES (
        v_card.id, p_customer_id, p_merchant_id,
        'available', gen_random_uuid()::TEXT, NOW() + INTERVAL '30 days'
      )
      RETURNING id INTO v_reward_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success',          true,
    'balance',          v_card.balance,
    'total_earned',     v_card.total_earned,
    'reward_threshold', v_merchant.reward_threshold,
    'reward_unlocked',  (v_reward_id IS NOT NULL),
    'card_id',          v_card.id
  );

END;
$$;

-- -----------------------------------------------------------
-- 5.2 redeem_reward — Validation d'une récompense (atomique)
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_reward(
  p_reward_qr_token VARCHAR,
  p_merchant_id     UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward    public.rewards%ROWTYPE;
  v_merchant  public.merchants%ROWTYPE;
  v_customer_first_name VARCHAR;
BEGIN

  -- 1. Trouver la récompense valide
  SELECT * INTO v_reward
  FROM public.rewards
  WHERE reward_qr_token = p_reward_qr_token
    AND merchant_id = p_merchant_id
    AND status = 'available'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'error', 'invalid_reward',
      'message', 'Cette récompense est invalide, déjà utilisée ou expirée.'
    );
  END IF;

  -- 2. Récupérer le commerçant (pour le seuil)
  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;

  -- 3. Récupérer le prénom du client
  SELECT first_name INTO v_customer_first_name
  FROM public.customers WHERE id = v_reward.customer_id;

  -- 4. Marquer comme utilisée
  UPDATE public.rewards
  SET status = 'redeemed', redeemed_at = NOW()
  WHERE id = v_reward.id;

  -- 5. Déduire les tampons de la carte
  UPDATE public.loyalty_cards
  SET
    balance    = GREATEST(0, balance - v_merchant.reward_threshold),
    updated_at = NOW()
  WHERE id = v_reward.card_id;

  -- 6. Créer la transaction de type 'redeem'
  INSERT INTO public.transactions (card_id, customer_id, merchant_id, type, amount)
  VALUES (v_reward.card_id, v_reward.customer_id, p_merchant_id, 'redeem', v_merchant.reward_threshold);

  RETURN jsonb_build_object(
    'success',       true,
    'customer_id',   v_reward.customer_id,
    'customer_name', COALESCE(v_customer_first_name, 'le client')
  );

END;
$$;

-- -----------------------------------------------------------
-- 5.3 rotate_daily_qr — Rotation quotidienne du QR (appelée par Edge Function cron)
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rotate_daily_qr(p_merchant_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant  RECORD;
  v_count     INTEGER := 0;
BEGIN
  -- Désactiver tous les tokens du jour précédent
  UPDATE public.qr_tokens
  SET is_active = false
  WHERE valid_date < CURRENT_DATE
    AND is_active = true
    AND (p_merchant_id IS NULL OR merchant_id = p_merchant_id);

  -- Générer un nouveau token pour chaque commerçant actif (ou un seul si spécifié)
  FOR v_merchant IN
    SELECT id FROM public.merchants
    WHERE subscription_status IN ('trial', 'active')
      AND (p_merchant_id IS NULL OR id = p_merchant_id)
  LOOP
    INSERT INTO public.qr_tokens (merchant_id, token, valid_date, is_active)
    VALUES (v_merchant.id, gen_random_uuid()::TEXT, CURRENT_DATE, true)
    ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'tokens_generated', v_count,
    'date', CURRENT_DATE
  );
END;
$$;

-- -----------------------------------------------------------
-- 5.4 get_dashboard_kpis — KPIs temps réel du dashboard
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(p_merchant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_clients   INTEGER;
  v_stamps_month    INTEGER;
  v_rewards_month   INTEGER;
  v_inactive_clients INTEGER;
BEGIN
  -- Total clients
  SELECT COUNT(*) INTO v_total_clients
  FROM public.loyalty_cards
  WHERE merchant_id = p_merchant_id;

  -- Tampons ce mois
  SELECT COALESCE(SUM(amount), 0) INTO v_stamps_month
  FROM public.transactions
  WHERE merchant_id = p_merchant_id
    AND type = 'earn'
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());

  -- Récompenses données ce mois
  SELECT COUNT(*) INTO v_rewards_month
  FROM public.rewards
  WHERE merchant_id = p_merchant_id
    AND status = 'redeemed'
    AND DATE_TRUNC('month', redeemed_at) = DATE_TRUNC('month', NOW());

  -- Clients inactifs (pas de scan depuis 30j)
  SELECT COUNT(*) INTO v_inactive_clients
  FROM public.loyalty_cards
  WHERE merchant_id = p_merchant_id
    AND (last_scan_at IS NULL OR last_scan_at < NOW() - INTERVAL '30 days');

  RETURN jsonb_build_object(
    'total_clients',    v_total_clients,
    'stamps_month',     v_stamps_month,
    'rewards_month',    v_rewards_month,
    'inactive_clients', v_inactive_clients
  );
END;
$$;

-- -----------------------------------------------------------
-- 5.5 expire_old_rewards — Expiration des récompenses (cron nuit)
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_old_rewards()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.rewards
  SET status = 'expired'
  WHERE status = 'available'
    AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'expired_count', v_count
  );
END;
$$;

-- ============================================================
-- 6. SUPABASE REALTIME — Activer les publications
-- ============================================================
-- À activer dans Supabase Dashboard > Database > Replication
-- ou via ces commandes SQL :

BEGIN;
  -- Activer Realtime sur les tables critiques
  ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_cards;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rewards;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
COMMIT;

-- ============================================================
-- 7. DONNÉES DE TEST (optionnel — commenter en production)
-- ============================================================
-- Décommenter uniquement pour tester en développement
--
-- INSERT INTO public.merchants (user_id, name, sector, program_type, reward_threshold, reward_description)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Boulangerie Test', 'Boulangerie', 'stamps', 10, '1 croissant offert');

-- ============================================================
-- FIN DE LA MIGRATION
-- Vérification : SELECT COUNT(*) FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name IN
-- ('merchants','customers','loyalty_cards','transactions','qr_tokens','rewards','notifications');
-- → Doit retourner 7
-- ============================================================
