-- ============================================================
-- FYDLY — Migration 03 : Cron Jobs (pg_cron)
-- Nécessite pg_cron activé dans Supabase (Plan Pro)
-- Alternative : utiliser l'approche GitHub Actions (voir README)
-- ============================================================

-- Activer pg_cron (à activer dans Extensions Supabase Dashboard en premier)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── Rotation QR : chaque jour à 00h00 UTC ──────────────────────────────
-- Appelle l'Edge Function rotate-qr-tokens via HTTP
SELECT cron.schedule(
  'rotate-qr-tokens-daily',
  '0 0 * * *',   -- Tous les jours à minuit UTC
  $$
  SELECT net.http_post(
    url      := current_setting('app.edge_function_url') || '/rotate-qr-tokens',
    headers  := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret')
    ),
    body     := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ── Expiration rewards : chaque nuit à 02h00 UTC ────────────────────────
SELECT cron.schedule(
  'expire-rewards-nightly',
  '0 2 * * *',   -- Tous les jours à 02h00 UTC
  $$
  SELECT net.http_post(
    url      := current_setting('app.edge_function_url') || '/expire-rewards',
    headers  := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret')
    ),
    body     := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ── Relance inactifs : chaque matin à 10h00 UTC ──────────────────────────
SELECT cron.schedule(
  'notify-inactive-daily',
  '0 10 * * *',   -- Tous les jours à 10h00 UTC
  $$
  SELECT net.http_post(
    url      := current_setting('app.edge_function_url') || '/notify-inactive',
    headers  := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret')
    ),
    body     := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ── Configurer les paramètres d'application ─────────────────────────────
-- Remplacer les valeurs par vos vraies URLs/secrets
ALTER DATABASE postgres SET app.edge_function_url = 'https://qvtttsyfjsmsozfpllzq.supabase.co/functions/v1';
ALTER DATABASE postgres SET app.cron_secret = 'VOTRE_CRON_SECRET_ICI';

-- ── Vérifier les cron jobs configurés ─────────────────────────────────
-- SELECT * FROM cron.job;
