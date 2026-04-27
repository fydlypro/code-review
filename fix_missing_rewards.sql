-- ============================================================
-- FYDLY — Fix des récompenses manquantes
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- APRÈS avoir exécuté fix_upsert_stamp.sql
-- ============================================================
--
-- Ce script détecte tous les clients qui ont atteint le seuil
-- de tampons mais n'ont pas reçu de récompense, et crée les
-- récompenses manquantes.
-- ============================================================

-- 1. D'abord, voyons combien de clients sont affectés
SELECT 
  lc.id AS card_id,
  lc.customer_id,
  lc.merchant_id,
  lc.balance,
  m.reward_threshold,
  m.name AS merchant_name,
  c.email AS customer_email,
  c.first_name
FROM public.loyalty_cards lc
JOIN public.merchants m ON m.id = lc.merchant_id
JOIN public.customers c ON c.id = lc.customer_id
WHERE lc.balance >= m.reward_threshold
  AND NOT EXISTS (
    SELECT 1 FROM public.rewards r
    WHERE r.card_id = lc.id 
      AND r.status = 'available'
  );

-- 2. Créer les récompenses manquantes et reset les balances
-- DÉCOMMENTEZ les lignes ci-dessous après avoir vérifié les résultats du SELECT
/*
DO $$
DECLARE
  rec RECORD;
  v_reward_token TEXT;
BEGIN
  FOR rec IN 
    SELECT lc.id AS card_id, lc.customer_id, lc.merchant_id, lc.balance, m.reward_threshold
    FROM public.loyalty_cards lc
    JOIN public.merchants m ON m.id = lc.merchant_id
    WHERE lc.balance >= m.reward_threshold
      AND NOT EXISTS (
        SELECT 1 FROM public.rewards r
        WHERE r.card_id = lc.id 
          AND r.status = 'available'
      )
  LOOP
    v_reward_token := gen_random_uuid()::TEXT;
    
    -- Créer la récompense
    INSERT INTO public.rewards (card_id, customer_id, merchant_id, status, reward_qr_token, expires_at)
    VALUES (rec.card_id, rec.customer_id, rec.merchant_id, 'available', v_reward_token, NOW() + INTERVAL '30 days');
    
    -- Reset le balance (garder le surplus éventuel)
    UPDATE public.loyalty_cards 
    SET balance = balance - rec.reward_threshold, 
        updated_at = NOW()
    WHERE id = rec.card_id;
    
    RAISE NOTICE 'Reward created for card % (customer: %, merchant: %)', rec.card_id, rec.customer_id, rec.merchant_id;
  END LOOP;
END;
$$;
*/
