-- ============================================================
-- FYDLY — Migration 05 : Politiques RLS Admin
-- À exécuter dans : Supabase Dashboard → SQL Editor
--
-- Pré-requis : définir app_metadata.role = 'admin' sur votre
-- compte admin via le Supabase Dashboard :
--   Authentication → Users → cliquez sur votre user → Edit
--   app_metadata : {"role": "admin"}
-- ============================================================

-- Helper function : vérifie si l'utilisateur connecté est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- MERCHANTS — lecture & mise à jour globale pour l'admin
-- ============================================================
CREATE POLICY "admin_select_merchants"
  ON public.merchants FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admin_update_merchants"
  ON public.merchants FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- CUSTOMERS — lecture globale pour l'admin
-- ============================================================
CREATE POLICY "admin_select_customers"
  ON public.customers FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- LOYALTY_CARDS — lecture globale pour l'admin
-- ============================================================
CREATE POLICY "admin_select_loyalty_cards"
  ON public.loyalty_cards FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- TRANSACTIONS — lecture globale pour l'admin
-- ============================================================
CREATE POLICY "admin_select_transactions"
  ON public.transactions FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- REWARDS — lecture globale pour l'admin
-- ============================================================
CREATE POLICY "admin_select_rewards"
  ON public.rewards FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- NOTIFICATIONS — lecture globale pour l'admin
-- ============================================================
CREATE POLICY "admin_select_notifications"
  ON public.notifications FOR SELECT
  USING (public.is_admin());
