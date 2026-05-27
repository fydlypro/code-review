-- ============================================================
-- FYDLY — Migration 07 : Corrections sécurité & bugs restants
-- ============================================================

-- ============================================================
-- 1. FIX upsert_stamp : ajouter auth.uid() + FOR UPDATE lock
-- ============================================================
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
  v_result        JSONB;
  v_new_balance   INTEGER;
  v_reward_id     UUID;
  v_reward_token  TEXT;
  v_caller_customer public.customers%ROWTYPE;
BEGIN
  -- Vérifier que le caller est bien le customer
  SELECT * INTO v_caller_customer FROM public.customers WHERE user_id = auth.uid();
  IF NOT FOUND OR v_caller_customer.id != p_customer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'merchant_not_found');
  END IF;

  IF v_merchant.subscription_status NOT IN ('trial', 'active', 'pro', 'business') THEN
    RETURN jsonb_build_object('success', false, 'error', 'subscription_expired');
  END IF;

  -- FOR UPDATE lock to prevent race condition (double-stamp)
  SELECT * INTO v_card
  FROM public.loyalty_cards
  WHERE customer_id = p_customer_id AND merchant_id = p_merchant_id
  FOR UPDATE;

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

  INSERT INTO public.transactions (card_id, customer_id, merchant_id, type, amount, qr_token_used)
  VALUES (v_card.id, p_customer_id, p_merchant_id, 'earn', 1, p_qr_token_used);

  IF v_new_balance >= v_merchant.reward_threshold THEN
    v_reward_token := gen_random_uuid()::TEXT;

    INSERT INTO public.rewards (card_id, customer_id, merchant_id, status, reward_qr_token, expires_at)
    VALUES (v_card.id, p_customer_id, p_merchant_id, 'available', v_reward_token, NOW() + INTERVAL '30 days')
    RETURNING id INTO v_reward_id;

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

-- ============================================================
-- 2. FIX attribute_stamp (001_fydly_init version) : auth + lock + reset balance
-- ============================================================
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
  v_caller_customer public.customers%ROWTYPE;
BEGIN
  -- Auth check: caller must own this customer profile
  SELECT * INTO v_caller_customer FROM public.customers WHERE user_id = auth.uid();
  IF NOT FOUND OR v_caller_customer.id != p_customer_id THEN
    RETURN jsonb_build_object('error', 'unauthorized', 'message', 'Accès non autorisé.');
  END IF;

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

  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'merchant_not_found');
  END IF;

  -- FOR UPDATE lock to prevent double-stamp race condition
  SELECT * INTO v_card
  FROM public.loyalty_cards
  WHERE customer_id = p_customer_id AND merchant_id = p_merchant_id
  FOR UPDATE;

  IF FOUND AND v_card.last_scan_at IS NOT NULL
     AND v_card.last_scan_at > NOW() - INTERVAL '60 minutes' THEN
    v_minutes_left := CEIL(60 - EXTRACT(EPOCH FROM (NOW() - v_card.last_scan_at)) / 60);
    RETURN jsonb_build_object(
      'error', 'too_soon',
      'minutes_left', v_minutes_left,
      'message', 'Vous avez déjà scanné ici récemment. Revenez dans ' || v_minutes_left || ' minutes.'
    );
  END IF;

  INSERT INTO public.loyalty_cards (customer_id, merchant_id, balance, total_earned, last_scan_at)
  VALUES (p_customer_id, p_merchant_id, 1, 1, NOW())
  ON CONFLICT (customer_id, merchant_id)
  DO UPDATE SET
    balance      = public.loyalty_cards.balance + 1,
    total_earned = public.loyalty_cards.total_earned + 1,
    last_scan_at = NOW(),
    updated_at   = NOW()
  RETURNING * INTO v_card;

  INSERT INTO public.transactions (card_id, customer_id, merchant_id, type, amount, qr_token_used)
  VALUES (v_card.id, p_customer_id, p_merchant_id, 'earn', 1, p_qr_token);

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

      -- Reset balance after reward (was missing!)
      UPDATE public.loyalty_cards
      SET balance = 0, updated_at = NOW()
      WHERE id = v_card.id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success',          true,
    'balance',          CASE WHEN v_reward_id IS NOT NULL THEN 0 ELSE v_card.balance END,
    'total_earned',     v_card.total_earned,
    'reward_threshold', v_merchant.reward_threshold,
    'reward_unlocked',  (v_reward_id IS NOT NULL),
    'card_id',          v_card.id
  );
END;
$$;

-- ============================================================
-- 3. FIX get_dashboard_kpis (001_fydly_init version) : add auth check
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(p_merchant_id UUID)
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
  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;
  IF NOT FOUND OR v_merchant.user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  SELECT COUNT(*) INTO v_total_clients
  FROM public.loyalty_cards
  WHERE merchant_id = p_merchant_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_stamps_month
  FROM public.transactions
  WHERE merchant_id = p_merchant_id
    AND type = 'earn'
    AND created_at >= date_trunc('month', NOW());

  SELECT COUNT(*) INTO v_rewards_month
  FROM public.rewards
  WHERE merchant_id = p_merchant_id
    AND status = 'redeemed'
    AND redeemed_at >= date_trunc('month', NOW());

  SELECT COUNT(*) INTO v_inactive_clients
  FROM public.loyalty_cards
  WHERE merchant_id = p_merchant_id
    AND (last_scan_at IS NULL OR last_scan_at < NOW() - INTERVAL '30 days');

  RETURN jsonb_build_object(
    'success',         true,
    'total_clients',   v_total_clients,
    'stamps_month',    v_stamps_month,
    'rewards_month',   v_rewards_month,
    'inactive_clients', v_inactive_clients
  );
END;
$$;

-- ============================================================
-- 4. FIX get_analytics_data : retention query (GROUP BY + INTO bug)
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
  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;
  IF NOT FOUND OR v_merchant.user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

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

  SELECT COUNT(*) INTO v_total
  FROM public.loyalty_cards
  WHERE merchant_id = p_merchant_id;

  -- FIX: wrap in subquery so COUNT gets total rows, not one row per group
  SELECT COUNT(*) INTO v_returning
  FROM (
    SELECT customer_id
    FROM public.transactions
    WHERE merchant_id = p_merchant_id
      AND type = 'earn'
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY customer_id
    HAVING COUNT(*) >= 2
  ) returning_customers;

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

-- ============================================================
-- 5. FIX rotate_daily_qr : include 'pro' and 'business' statuses
-- ============================================================
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
  UPDATE public.qr_tokens
  SET is_active = false
  WHERE valid_date < CURRENT_DATE
    AND is_active = true
    AND (p_merchant_id IS NULL OR merchant_id = p_merchant_id);

  FOR v_merchant IN
    SELECT id FROM public.merchants
    WHERE subscription_status IN ('trial', 'active', 'pro', 'business')
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

-- ============================================================
-- 6. FIX redeem_reward (001_fydly_init version) : add auth check
-- ============================================================
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
  -- Auth: verify caller owns this merchant
  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;
  IF NOT FOUND OR v_merchant.user_id != auth.uid() THEN
    RETURN jsonb_build_object('error', 'unauthorized', 'message', 'Accès non autorisé.');
  END IF;

  SELECT * INTO v_reward
  FROM public.rewards
  WHERE reward_qr_token = p_reward_qr_token
    AND merchant_id = p_merchant_id
    AND status = 'available'
    AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'error', 'invalid_reward',
      'message', 'Cette récompense est invalide, déjà utilisée ou expirée.'
    );
  END IF;

  SELECT first_name INTO v_customer_first_name
  FROM public.customers WHERE id = v_reward.customer_id;

  UPDATE public.rewards
  SET status = 'redeemed', redeemed_at = NOW()
  WHERE id = v_reward.id;

  UPDATE public.loyalty_cards
  SET
    balance    = GREATEST(0, balance - v_merchant.reward_threshold),
    updated_at = NOW()
  WHERE id = v_reward.card_id;

  INSERT INTO public.transactions (card_id, customer_id, merchant_id, type, amount)
  VALUES (v_reward.card_id, v_reward.customer_id, p_merchant_id, 'redeem', v_merchant.reward_threshold);

  RETURN jsonb_build_object(
    'success',       true,
    'customer_id',   v_reward.customer_id,
    'customer_name', COALESCE(v_customer_first_name, 'le client')
  );
END;
$$;
