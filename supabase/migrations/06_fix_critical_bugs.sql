-- ============================================================
-- FYDLY — Migration 06 : Corrections bugs critiques
-- ============================================================

-- ── Fix C-1 / H-5 : subscription_status CHECK trop restrictif ──
-- Le webhook Stripe écrit 'pro', 'business', 'cancelled' mais le CHECK
-- n'autorise que 'trial', 'active', 'expired'.
ALTER TABLE public.merchants DROP CONSTRAINT IF EXISTS merchants_subscription_status_check;
ALTER TABLE public.merchants ADD CONSTRAINT merchants_subscription_status_check
  CHECK (subscription_status IN ('trial', 'active', 'pro', 'business', 'expired', 'cancelled'));

-- ── Fix C-7 : RLS INSERT trop permissive sur merchants ──
-- 'OR user_id IS NOT NULL' rend la policy toujours vraie.
DROP POLICY IF EXISTS merchants_insert_own ON public.merchants;
CREATE POLICY merchants_insert_own ON public.merchants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── Fix C-7 : RLS INSERT trop permissive sur customers ──
DROP POLICY IF EXISTS customers_insert_own ON public.customers;
CREATE POLICY customers_insert_own ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── Fix C-6 : RLS SELECT merchants trop ouverte ──
-- Remplace la policy USING(true) par une lecture restreinte.
DROP POLICY IF EXISTS customer_read_merchant_public ON public.merchants;
CREATE POLICY customer_read_merchant_public ON public.merchants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.loyalty_cards lc
      WHERE lc.merchant_id = id AND lc.customer_id IN (
        SELECT c.id FROM public.customers c WHERE c.user_id = auth.uid()
      )
    )
  );

-- ── Fix B-5 : qr_tokens lisibles par tous ──
DROP POLICY IF EXISTS qr_tokens_select ON public.qr_tokens;
DROP POLICY IF EXISTS "Tout le monde peut lire les tokens actifs" ON public.qr_tokens;
CREATE POLICY qr_tokens_select ON public.qr_tokens
  FOR SELECT TO authenticated
  USING (is_active = true AND valid_date = CURRENT_DATE);
