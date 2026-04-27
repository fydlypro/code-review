-- ============================================================
-- FYDLY — Fix RLS sur table rewards
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================
-- 
-- PROBLÈME : Le client ne peut pas lire ses récompenses car
-- la politique RLS rewards_select_customer n'a jamais été 
-- appliquée en production.
-- ============================================================

-- Supprimer les policies existantes (si elles existent) pour éviter les conflits
DROP POLICY IF EXISTS "rewards_select_customer" ON public.rewards;
DROP POLICY IF EXISTS "customer_read_own_rewards" ON public.rewards;
DROP POLICY IF EXISTS "rewards_select_merchant" ON public.rewards;
DROP POLICY IF EXISTS "merchant_read_own_rewards" ON public.rewards;

-- S'assurer que RLS est activé
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Le client peut lire ses propres récompenses
CREATE POLICY "rewards_select_customer"
  ON public.rewards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = rewards.customer_id
        AND c.user_id = auth.uid()
    )
  );

-- Le commerçant peut lire les récompenses de ses clients
CREATE POLICY "rewards_select_merchant"
  ON public.rewards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = rewards.merchant_id
        AND m.user_id = auth.uid()
    )
  );

-- Vérification : lister les policies actives sur rewards
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'rewards';
