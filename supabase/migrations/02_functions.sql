-- ============================================================
-- FYDLY — Migration 02 : Fonctions SQL
-- Fonctions RPC appelables depuis le frontend avec service_role
-- ============================================================

-- ============================================================
-- FONCTION : upsert_stamp
-- Attribution atomique d'un tampon avec anti-fraude intégré
-- Appelée depuis le frontend après authentification client
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_stamp(
  p_customer_id    UUID,
  p_merchant_id    UUID,
  p_qr_token_used  TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER   -- Exécutée avec les droits du propriétaire (service_role)
SET search_path = public
AS $$
DECLARE
  v_card          public.loyalty_cards%ROWTYPE;
  v_merchant      public.merchants%ROWTYPE;
  v_minutes_left  INTEGER;
  v_result        JSONB;
  v_new_balance   INTEGER;
  v_reward_id     UUID;
  v_reward_token  TEXT;
BEGIN
  -- Récupérer le commerçant
  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'merchant_not_found');
  END IF;

  -- Vérifier que l'abonnement est actif (trial ou active)
  IF v_merchant.subscription_status = 'expired' THEN
    RETURN jsonb_build_object('success', false, 'error', 'subscription_expired');
  END IF;

  -- Récupérer la loyalty_card existante si elle existe
  SELECT * INTO v_card
  FROM public.loyalty_cards
  WHERE customer_id = p_customer_id AND merchant_id = p_merchant_id;

  -- Anti-fraude : 1 scan maximum par heure
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

  -- Upsert atomique de la loyalty_card
  INSERT INTO public.loyalty_cards (customer_id, merchant_id, balance, total_earned, last_scan_at, created_at, updated_at)
  VALUES (p_customer_id, p_merchant_id, 1, 1, NOW(), NOW(), NOW())
  ON CONFLICT (customer_id, merchant_id)
  DO UPDATE SET
    balance       = public.loyalty_cards.balance + 1,
    total_earned  = public.loyalty_cards.total_earned + 1,
    last_scan_at  = NOW(),
    updated_at    = NOW()
  RETURNING * INTO v_card;

  v_new_balance := v_card.balance;

  -- Créer la transaction
  INSERT INTO public.transactions (card_id, customer_id, merchant_id, type, amount, qr_token_used)
  VALUES (v_card.id, p_customer_id, p_merchant_id, 'earn', 1, p_qr_token_used);

  -- Vérifier si récompense débloquée
  -- Condition : balance atteint le seuil → créer la récompense et reset
  IF v_new_balance >= v_merchant.reward_threshold THEN
    -- Créer la récompense
    v_reward_token := gen_random_uuid()::TEXT;

    INSERT INTO public.rewards (card_id, customer_id, merchant_id, status, reward_qr_token, expires_at)
    VALUES (v_card.id, p_customer_id, p_merchant_id, 'available', v_reward_token, NOW() + INTERVAL '30 days')
    RETURNING id INTO v_reward_id;

    -- Remettre le balance à zéro (on garde total_earned intact)
    UPDATE public.loyalty_cards
    SET balance = 0, updated_at = NOW()
    WHERE id = v_card.id;

    v_new_balance := 0;
  END IF;

  RETURN jsonb_build_object(
    'success',        true,
    'card_id',        v_card.id,
    'new_balance',    v_new_balance,
    'total_earned',   v_card.total_earned,
    'reward_unlocked', v_reward_id IS NOT NULL,
    'reward_token',    v_reward_token,
    'threshold',       v_merchant.reward_threshold,
    'reward_description', v_merchant.reward_description
  );
END;
$$;

-- Grant d'exécution pour les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.upsert_stamp(UUID, UUID, TEXT) TO authenticated;

-- ============================================================
-- FONCTION : redeem_reward
-- Validation atomique d'une récompense par le commerçant
-- ============================================================
CREATE OR REPLACE FUNCTION public.redeem_reward(
  p_reward_qr_token  TEXT,
  p_merchant_user_id UUID  -- auth.uid() du commerçant
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward    public.rewards%ROWTYPE;
  v_merchant  public.merchants%ROWTYPE;
  v_card      public.loyalty_cards%ROWTYPE;
  v_customer  public.customers%ROWTYPE;
BEGIN
  -- Récupérer le commerçant
  SELECT * INTO v_merchant FROM public.merchants WHERE user_id = p_merchant_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'merchant_not_found');
  END IF;

  -- Récupérer la récompense
  SELECT * INTO v_reward FROM public.rewards
  WHERE reward_qr_token = p_reward_qr_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'reward_not_found');
  END IF;

  -- Vérifications
  IF v_reward.merchant_id != v_merchant.id THEN
    RETURN jsonb_build_object('success', false, 'error', 'wrong_merchant');
  END IF;

  IF v_reward.status != 'available' THEN
    RETURN jsonb_build_object('success', false, 'error', 'reward_' || v_reward.status);
  END IF;

  IF v_reward.expires_at < NOW() THEN
    UPDATE public.rewards SET status = 'expired' WHERE id = v_reward.id;
    RETURN jsonb_build_object('success', false, 'error', 'reward_expired');
  END IF;

  -- Récupérer la carte et le client
  SELECT * INTO v_card FROM public.loyalty_cards WHERE id = v_reward.card_id;
  SELECT * INTO v_customer FROM public.customers WHERE id = v_reward.customer_id;

  -- Transaction atomique : marquer la récompense + créer transaction redeem
  UPDATE public.rewards
  SET status = 'redeemed', redeemed_at = NOW()
  WHERE id = v_reward.id;

  INSERT INTO public.transactions (card_id, customer_id, merchant_id, type, amount, qr_token_used)
  VALUES (v_card.id, v_reward.customer_id, v_merchant.id, 'redeem', v_merchant.reward_threshold, p_reward_qr_token);

  RETURN jsonb_build_object(
    'success',      true,
    'customer_id',  v_customer.id,
    'first_name',   v_customer.first_name,
    'email',        v_customer.email,
    'onesignal_player_id', v_customer.onesignal_player_id,
    'reward_description',  v_merchant.reward_description,
    'merchant_name',       v_merchant.name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_reward(TEXT, UUID) TO authenticated;

-- ============================================================
-- FONCTION : get_merchant_kpis
-- Agrégats pour le dashboard — appelée via RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_merchant_kpis(p_merchant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant         public.merchants%ROWTYPE;
  v_total_clients    INTEGER;
  v_stamps_month     INTEGER;
  v_rewards_month    INTEGER;
  v_inactive_clients INTEGER;
BEGIN
  -- Vérifier que le demandeur est bien le commerçant
  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;
  IF NOT FOUND OR v_merchant.user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- Total clients
  SELECT COUNT(*) INTO v_total_clients
  FROM public.loyalty_cards
  WHERE merchant_id = p_merchant_id;

  -- Tampons ce mois
  SELECT COALESCE(SUM(amount), 0) INTO v_stamps_month
  FROM public.transactions
  WHERE merchant_id = p_merchant_id
    AND type = 'earn'
    AND created_at >= date_trunc('month', NOW());

  -- Récompenses données ce mois
  SELECT COUNT(*) INTO v_rewards_month
  FROM public.rewards
  WHERE merchant_id = p_merchant_id
    AND status = 'redeemed'
    AND redeemed_at >= date_trunc('month', NOW());

  -- Clients inactifs (pas de scan depuis 30 jours)
  SELECT COUNT(*) INTO v_inactive_clients
  FROM public.loyalty_cards
  WHERE merchant_id = p_merchant_id
    AND last_scan_at < NOW() - INTERVAL '30 days';

  RETURN jsonb_build_object(
    'success',         true,
    'total_clients',   v_total_clients,
    'stamps_month',    v_stamps_month,
    'rewards_month',   v_rewards_month,
    'inactive_clients', v_inactive_clients
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_merchant_kpis(UUID) TO authenticated;

-- ============================================================
-- FONCTION : get_analytics_data
-- Données pour les graphiques Recharts
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_analytics_data(
  p_merchant_id  UUID,
  p_period_days  INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant      public.merchants%ROWTYPE;
  v_visits        JSONB;
  v_hourly        JSONB;
  v_weekly_new    JSONB;
  v_retention     NUMERIC;
  v_total         INTEGER;
  v_returning     INTEGER;
BEGIN
  -- Vérification accès
  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;
  IF NOT FOUND OR v_merchant.user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- Évolution des visites par jour
  SELECT jsonb_agg(
    jsonb_build_object('date', day::TEXT, 'count', cnt)
    ORDER BY day
  ) INTO v_visits
  FROM (
    SELECT date_trunc('day', created_at)::DATE AS day, COUNT(*) AS cnt
    FROM public.transactions
    WHERE merchant_id = p_merchant_id
      AND type = 'earn'
      AND created_at >= NOW() - (p_period_days || ' days')::INTERVAL
    GROUP BY day
  ) t;

  -- Affluence par heure de la journée
  SELECT jsonb_agg(
    jsonb_build_object('hour', hour, 'count', cnt)
    ORDER BY hour
  ) INTO v_hourly
  FROM (
    SELECT EXTRACT(HOUR FROM created_at)::INTEGER AS hour, COUNT(*) AS cnt
    FROM public.transactions
    WHERE merchant_id = p_merchant_id
      AND type = 'earn'
      AND created_at >= NOW() - (p_period_days || ' days')::INTERVAL
    GROUP BY hour
  ) t;

  -- Nouveaux clients par semaine
  SELECT jsonb_agg(
    jsonb_build_object('week', week::TEXT, 'count', cnt)
    ORDER BY week
  ) INTO v_weekly_new
  FROM (
    SELECT date_trunc('week', lc.created_at)::DATE AS week, COUNT(*) AS cnt
    FROM public.loyalty_cards lc
    WHERE lc.merchant_id = p_merchant_id
      AND lc.created_at >= NOW() - (p_period_days || ' days')::INTERVAL
    GROUP BY week
  ) t;

  -- Taux de rétention (clients ayant scanné 2+ fois sur la période)
  SELECT COUNT(*) INTO v_total
  FROM public.loyalty_cards
  WHERE merchant_id = p_merchant_id;

  SELECT COUNT(DISTINCT customer_id) INTO v_returning
  FROM public.transactions
  WHERE merchant_id = p_merchant_id
    AND type = 'earn'
    AND created_at >= NOW() - INTERVAL '30 days'
  GROUP BY customer_id
  HAVING COUNT(*) >= 2;

  v_retention := CASE WHEN v_total > 0 THEN ROUND((v_returning::NUMERIC / v_total) * 100, 1) ELSE 0 END;

  RETURN jsonb_build_object(
    'success',         true,
    'visits_by_day',   COALESCE(v_visits, '[]'::jsonb),
    'hourly_traffic',  COALESCE(v_hourly, '[]'::jsonb),
    'new_per_week',    COALESCE(v_weekly_new, '[]'::jsonb),
    'retention_rate',  v_retention
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_analytics_data(UUID, INTEGER) TO authenticated;

-- ============================================================
-- FONCTION : validate_qr_token
-- Validation publique d'un token QR (appelée depuis /scan)
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_qr_token(
  p_token       TEXT,
  p_merchant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token    public.qr_tokens%ROWTYPE;
  v_merchant public.merchants%ROWTYPE;
BEGIN
  -- Vérifier le token
  SELECT * INTO v_token
  FROM public.qr_tokens
  WHERE token = p_token
    AND merchant_id = p_merchant_id
    AND is_active = true
    AND valid_date = CURRENT_DATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'invalid_or_expired_token');
  END IF;

  -- Récupérer le nom du commerçant pour affichage
  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;

  RETURN jsonb_build_object(
    'valid',         true,
    'merchant_id',   v_merchant.id,
    'merchant_name', v_merchant.name,
    'sector',        v_merchant.sector
  );
END;
$$;

-- Accessible sans authentification (validation publique du QR)
GRANT EXECUTE ON FUNCTION public.validate_qr_token(TEXT, UUID) TO anon, authenticated;

-- ============================================================
-- FONCTION : get_customer_loyalty_cards
-- Retourne les cartes fidélité du client connecté avec les
-- données commerçant — SECURITY DEFINER pour bypasser RLS sur merchants
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_customer_loyalty_cards()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_result   JSONB;
BEGIN
  SELECT * INTO v_customer FROM public.customers WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id',           lc.id,
      'customer_id',  lc.customer_id,
      'merchant_id',  lc.merchant_id,
      'balance',      lc.balance,
      'total_earned', lc.total_earned,
      'last_scan_at', lc.last_scan_at,
      'created_at',   lc.created_at,
      'updated_at',   lc.updated_at,
      'merchants', jsonb_build_object(
        'name',               m.name,
        'sector',             m.sector,
        'reward_threshold',   m.reward_threshold,
        'reward_description', m.reward_description
      )
    )
    ORDER BY lc.last_scan_at DESC NULLS LAST
  ) INTO v_result
  FROM public.loyalty_cards lc
  JOIN public.merchants m ON m.id = lc.merchant_id
  WHERE lc.customer_id = v_customer.id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_loyalty_cards() TO authenticated;

-- ============================================================
-- FONCTION : get_merchant_recent_scans
-- Retourne les 5 dernières transactions du commerçant avec
-- le prénom client — SECURITY DEFINER pour bypasser RLS
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_merchant_recent_scans(p_merchant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant public.merchants%ROWTYPE;
  v_result   JSONB;
BEGIN
  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;
  IF NOT FOUND OR v_merchant.user_id != auth.uid() THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id',         t.id,
      'type',       t.type,
      'amount',     t.amount,
      'created_at', t.created_at,
      'customers',  jsonb_build_object('first_name', c.first_name)
    )
    ORDER BY t.created_at DESC
  ) INTO v_result
  FROM (
    SELECT * FROM public.transactions
    WHERE merchant_id = p_merchant_id
    ORDER BY created_at DESC
    LIMIT 5
  ) t
  LEFT JOIN public.customers c ON c.id = t.customer_id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_merchant_recent_scans(UUID) TO authenticated;

-- ============================================================
-- FONCTION : get_merchant_customers
-- Retourne les clients + cartes fidélité du commerçant
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_merchant_customers(p_merchant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant public.merchants%ROWTYPE;
  v_cards    JSONB;
  v_rewards  JSONB;
BEGIN
  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;
  IF NOT FOUND OR v_merchant.user_id != auth.uid() THEN
    RETURN jsonb_build_object('cards', '[]'::jsonb, 'reward_customer_ids', '[]'::jsonb);
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id',           lc.id,
      'customer_id',  lc.customer_id,
      'balance',      lc.balance,
      'total_earned', lc.total_earned,
      'last_scan_at', lc.last_scan_at,
      'customers', jsonb_build_object(
        'email',      c.email,
        'first_name', c.first_name,
        'phone',      c.phone,
        'created_at', c.created_at
      )
    )
    ORDER BY lc.last_scan_at DESC NULLS LAST
  ) INTO v_cards
  FROM public.loyalty_cards lc
  LEFT JOIN public.customers c ON c.id = lc.customer_id
  WHERE lc.merchant_id = p_merchant_id;

  SELECT jsonb_agg(r.customer_id) INTO v_rewards
  FROM public.rewards r
  WHERE r.merchant_id = p_merchant_id AND r.status = 'available';

  RETURN jsonb_build_object(
    'cards',               COALESCE(v_cards, '[]'::jsonb),
    'reward_customer_ids', COALESCE(v_rewards, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_merchant_customers(UUID) TO authenticated;

-- ============================================================
-- FONCTION : get_merchant_stats
-- Retourne les transactions + cartes fidélité brutes pour analytics
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_merchant_stats(p_merchant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant     public.merchants%ROWTYPE;
  v_transactions JSONB;
  v_cards        JSONB;
BEGIN
  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;
  IF NOT FOUND OR v_merchant.user_id != auth.uid() THEN
    RETURN jsonb_build_object('transactions', '[]'::jsonb, 'loyalty_cards', '[]'::jsonb);
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'created_at', t.created_at,
      'type',       t.type,
      'amount',     t.amount
    )
    ORDER BY t.created_at ASC
  ) INTO v_transactions
  FROM public.transactions t
  WHERE t.merchant_id = p_merchant_id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'balance',      lc.balance,
      'last_scan_at', lc.last_scan_at
    )
  ) INTO v_cards
  FROM public.loyalty_cards lc
  WHERE lc.merchant_id = p_merchant_id;

  RETURN jsonb_build_object(
    'transactions',  COALESCE(v_transactions, '[]'::jsonb),
    'loyalty_cards', COALESCE(v_cards, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_merchant_stats(UUID) TO authenticated;

-- ============================================================
-- FONCTION : get_customer_history
-- Retourne les transactions du client connecté avec le nom
-- du commerçant — SECURITY DEFINER pour bypasser RLS sur merchants
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_customer_history()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_result   JSONB;
BEGIN
  SELECT * INTO v_customer FROM public.customers WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id',          t.id,
      'type',        t.type,
      'amount',      t.amount,
      'created_at',  t.created_at,
      'customer_id', t.customer_id,
      'merchant_id', t.merchant_id,
      'merchants',   jsonb_build_object('name', m.name)
    )
    ORDER BY t.created_at DESC
  ) INTO v_result
  FROM public.transactions t
  JOIN public.merchants m ON m.id = t.merchant_id
  WHERE t.customer_id = v_customer.id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_history() TO authenticated;
