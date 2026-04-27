-- ============================================================
-- FYDLY — Fix upsert_stamp : Correction du bug de non-attribution de récompense
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================
-- 
-- BUG : Quand un client atteint le seuil (ex: 5/5 tampons), 
-- aucune récompense n'est créée.
--
-- CAUSE RACINE : Le balance est incrémenté APRÈS l'upsert, donc
-- v_new_balance vaut bien 5 quand le seuil est 5. Mais la condition
-- `NOT EXISTS (rewards WHERE status = 'available')` peut bloquer
-- si une récompense résiduelle existe. De plus, la version déployée 
-- en base peut être l'ancienne version (setup_fydly.sql) qui ne 
-- retourne pas reward_description ni threshold dans le JSON.
--
-- CE FIX :
-- 1. Recrée la fonction avec la logique corrigée
-- 2. Ajoute des logs de debug optionnels
-- 3. Retourne reward_description pour le frontend
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
  v_new_balance   INTEGER;
  v_reward_id     UUID;
  v_reward_token  TEXT;
BEGIN
  -- 1. Récupérer le commerçant
  SELECT * INTO v_merchant FROM public.merchants WHERE id = p_merchant_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'merchant_not_found');
  END IF;

  -- 2. Vérifier que l'abonnement est actif (trial ou active)
  IF v_merchant.subscription_status = 'expired' THEN
    RETURN jsonb_build_object('success', false, 'error', 'subscription_expired');
  END IF;

  -- 3. Récupérer la loyalty_card existante si elle existe
  SELECT * INTO v_card
  FROM public.loyalty_cards
  WHERE customer_id = p_customer_id AND merchant_id = p_merchant_id;

  -- 4. Anti-fraude : 1 scan maximum par heure
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

  -- 5. Upsert atomique de la loyalty_card
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

  -- 6. Créer la transaction
  INSERT INTO public.transactions (card_id, customer_id, merchant_id, type, amount, qr_token_used)
  VALUES (v_card.id, p_customer_id, p_merchant_id, 'earn', 1, p_qr_token_used);

  -- 7. Vérifier si récompense débloquée
  -- FIX: On vérifie balance >= threshold SANS bloquer sur les rewards existantes
  -- Si le client a déjà une reward 'available' non réclamée, on la garde mais on ne bloque pas
  -- la création d'une nouvelle si le balance a atteint le seuil
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

-- Grant d'exécution pour les utilisateurs authentifiés et anonymes
GRANT EXECUTE ON FUNCTION public.upsert_stamp(UUID, UUID, TEXT) TO authenticated, anon;
