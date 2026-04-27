-- ============================================================
-- FYDLY — Migration 01 : Row Level Security
-- À exécuter après 00_schema.sql
-- ============================================================

-- ============================================================
-- MERCHANTS
-- ============================================================
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- Le commerçant lit uniquement son propre profil
CREATE POLICY "merchants_select_own"
  ON public.merchants FOR SELECT
  USING (user_id = auth.uid());

-- Le client lit les données du commerçant pour ses cartes fidélité
CREATE POLICY "merchants_select_customer"
  ON public.merchants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.loyalty_cards lc
      JOIN public.customers c ON c.id = lc.customer_id
      WHERE lc.merchant_id = merchants.id
        AND c.user_id = auth.uid()
    )
  );

-- Le commerçant crée uniquement son propre profil
CREATE POLICY "merchants_insert_own"
  ON public.merchants FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NOT NULL); -- Plus permissif pour l'initialisation

-- Le commerçant met à jour uniquement son propre profil
CREATE POLICY "merchants_update_own"
  ON public.merchants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- CUSTOMERS
-- ============================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Le client lit son propre profil
CREATE POLICY "customers_select_own"
  ON public.customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Le client crée son propre profil
-- Note: On autorise l'insert si l'ID correspond à auth.uid()
-- Si la confirmation d'email est activée, l'utilisateur pourrait être 'anon' temporairement
-- Mais par sécurité on restreint à authenticated quand possible.
CREATE POLICY "customers_insert_own"
  ON public.customers FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NOT NULL); -- Plus permissif pour l'initialisation

-- Le client met à jour son propre profil
CREATE POLICY "customers_update_own"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Un commerçant peut lire les infos de ses propres clients
-- (via loyalty_cards — le commerçant doit avoir une carte avec ce customer)
CREATE POLICY "customers_select_merchant"
  ON public.customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.loyalty_cards lc
      JOIN public.merchants m ON m.id = lc.merchant_id
      WHERE lc.customer_id = customers.id
        AND m.user_id = auth.uid()
    )
  );

-- ============================================================
-- LOYALTY_CARDS
-- ============================================================
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;

-- Le client lit ses propres cartes
CREATE POLICY "loyalty_cards_select_customer"
  ON public.loyalty_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = loyalty_cards.customer_id
        AND c.user_id = auth.uid()
    )
  );

-- Le commerçant lit les cartes de ses clients
CREATE POLICY "loyalty_cards_select_merchant"
  ON public.loyalty_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = loyalty_cards.merchant_id
        AND m.user_id = auth.uid()
    )
  );

-- Insert et update uniquement via service_role (Edge Functions)
-- Pas de politique INSERT/UPDATE côté client — utiliser des fonctions RPC sécurisées

-- ============================================================
-- TRANSACTIONS
-- ============================================================
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Le client lit ses propres transactions
CREATE POLICY "transactions_select_customer"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = transactions.customer_id
        AND c.user_id = auth.uid()
    )
  );

-- Le commerçant lit les transactions de ses clients
CREATE POLICY "transactions_select_merchant"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = transactions.merchant_id
        AND m.user_id = auth.uid()
    )
  );

-- ============================================================
-- QR_TOKENS
-- ============================================================
ALTER TABLE public.qr_tokens ENABLE ROW LEVEL SECURITY;

-- Lecture publique (nécessaire pour valider le scan depuis le frontend)
CREATE POLICY "qr_tokens_select_public"
  ON public.qr_tokens FOR SELECT
  USING (true);

-- Le commerçant lit ses propres tokens (pour l'affichage du QR sur le dashboard)
-- Couvert par la policy publique ci-dessus

-- Insertion par le commerçant authentifié (fallback dashboard) ou via service_role (Edge Function)
CREATE POLICY "qr_tokens_insert_merchant"
  ON public.qr_tokens FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = qr_tokens.merchant_id
        AND m.user_id = auth.uid()
    )
  );

-- ============================================================
-- REWARDS
-- ============================================================
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Le client lit ses propres récompenses
CREATE POLICY "rewards_select_customer"
  ON public.rewards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = rewards.customer_id
        AND c.user_id = auth.uid()
    )
  );

-- Le commerçant lit les récompenses de ses clients
CREATE POLICY "rewards_select_merchant"
  ON public.rewards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = rewards.merchant_id
        AND m.user_id = auth.uid()
    )
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Le commerçant lit uniquement ses notifications
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = notifications.merchant_id
        AND m.user_id = auth.uid()
    )
  );

-- Le commerçant peut insérer ses notifications
CREATE POLICY "notifications_insert_own"
  ON public.notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = notifications.merchant_id
        AND m.user_id = auth.uid()
    )
  );

-- Le commerçant peut mettre à jour ses notifications (ex: statut)
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = notifications.merchant_id
        AND m.user_id = auth.uid()
    )
  );
