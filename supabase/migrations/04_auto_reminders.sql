-- ============================================================
-- FYDLY — Migration 04 : Relances Automatisées
-- Ajout des champs pour la fonction notify-inactive
-- ============================================================

-- 1. Configuration Merchants
ALTER TABLE public.merchants 
ADD COLUMN IF NOT EXISTS auto_reminders_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_reminder_message VARCHAR(140) DEFAULT 'Vous nous manquez ! Venez nous voir pour compléter votre carte de fidélité.';

COMMENT ON COLUMN public.merchants.auto_reminders_enabled IS 'Active les relances push automatiques pour les clients inactifs';
COMMENT ON COLUMN public.merchants.auto_reminder_message IS 'Message personnalisé de relance (140 caractères max)';

-- 2. Suivi des relances sur les cartes de fidélité
ALTER TABLE public.loyalty_cards
ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMPTZ;

COMMENT ON COLUMN public.loyalty_cards.last_reminded_at IS 'Date de la dernière notification automatique envoyée';

-- 3. Index pour performance du cron notify-inactive
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_reminder_check 
ON public.loyalty_cards (last_scan_at, last_reminded_at) 
WHERE last_scan_at IS NOT NULL;
