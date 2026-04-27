-- ============================================================
-- FYDLY — Fix complet policies rewards + loyalty_cards UPDATE
-- À exécuter dans : Supabase Dashboard → SQL Editor  
-- ============================================================

-- 1. REWARDS : Ajouter les policies UPDATE (pour validation commerçant)
DROP POLICY IF EXISTS "rewards_update_merchant" ON public.rewards;

CREATE POLICY "rewards_update_merchant"
  ON public.rewards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = rewards.merchant_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = rewards.merchant_id
        AND m.user_id = auth.uid()
    )
  );

-- 2. LOYALTY_CARDS : Ajouter UPDATE pour le commerçant (fallback validateReward)
DROP POLICY IF EXISTS "loyalty_cards_update_merchant" ON public.loyalty_cards;

CREATE POLICY "loyalty_cards_update_merchant"
  ON public.loyalty_cards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = loyalty_cards.merchant_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = loyalty_cards.merchant_id
        AND m.user_id = auth.uid()
    )
  );

-- 3. TRANSACTIONS : Ajouter INSERT pour les utilisateurs authentifiés  
-- (nécessaire pour le fallback dans validateReward du dashboard)
DROP POLICY IF EXISTS "transactions_insert_authenticated" ON public.transactions;

CREATE POLICY "transactions_insert_authenticated"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. Vérification finale
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('rewards', 'loyalty_cards', 'transactions')
ORDER BY tablename, policyname;
