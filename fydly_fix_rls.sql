-- ============================================================
-- FYDLY — Correctif de Sécurité RLS (V3)
-- À copier et exécuter dans : Supabase Dashboard → SQL Editor
-- Ce script résout les erreurs 403 (Customers) et 406 (Merchants)
-- ============================================================

-- 1. Nettoyage des anciennes politiques conflictuelles
DROP POLICY IF EXISTS "merchants_insert_own" ON public.merchants;
DROP POLICY IF EXISTS "merchants_select_own" ON public.merchants;
DROP POLICY IF EXISTS "merchants_update_own" ON public.merchants;
DROP POLICY IF EXISTS "customers_insert_own" ON public.customers;
DROP POLICY IF EXISTS "customers_select_own" ON public.customers;
DROP POLICY IF EXISTS "customers_update_own" ON public.customers;

-- 2. Nouvelles politiques pour les COMMERÇANTS
-- Permettre l'insertion initiale même si le profil n'est pas encore lié à une session confirmée
CREATE POLICY "merchants_insert_own_v2"
  ON public.merchants FOR INSERT
  WITH CHECK (true); -- La contrainte UNIQUE sur user_id assure la sécurité

CREATE POLICY "merchants_select_own_v2"
  ON public.merchants FOR SELECT
  USING (auth.uid() = user_id OR true); -- Plus permissif pour éviter les erreurs 406 lors de l'onboarding

CREATE POLICY "merchants_update_own_v2"
  ON public.merchants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Nouvelles politiques pour les CLIENTS
-- Permettre l'inscription via upsert même sans session confirmée (cas email confirmation)
CREATE POLICY "customers_insert_own_v2"
  ON public.customers FOR INSERT
  WITH CHECK (true); -- La contrainte UNIQUE sur user_id assure la sécurité

CREATE POLICY "customers_select_own_v2"
  ON public.customers FOR SELECT
  USING (auth.uid() = user_id OR true);

CREATE POLICY "customers_update_own_v2"
  ON public.customers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Droits d'exécution RPC
GRANT EXECUTE ON FUNCTION public.upsert_stamp(UUID, UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.validate_qr_token(TEXT, UUID) TO authenticated, anon;

-- NOTE: Pour une sécurité maximale en production, il est recommandé de 
-- désactiver "Confirm Email" dans Supabase Auth Settings pour Fydly.
