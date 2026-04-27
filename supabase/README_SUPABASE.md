# FYDLY — Guide de déploiement Backend Supabase

## Ordre d'exécution

### Étape 1 — Migrations SQL

Aller dans **Supabase Dashboard → SQL Editor** et exécuter dans cet ordre exact :

```
1. supabase/migrations/00_schema.sql   ← Tables + Triggers
2. supabase/migrations/01_rls.sql      ← Politiques RLS
3. supabase/migrations/02_functions.sql ← Fonctions RPC
4. supabase/migrations/03_cron.sql     ← Cron jobs (optionnel, Pro uniquement)
```

> ⚠️ **Important** : La migration `03_cron.sql` nécessite l'extension **pg_cron** (Supabase Pro).
> Si vous n'avez pas le plan Pro, utilisez l'alternative GitHub Actions ci-dessous.

---

### Étape 2 — Configuration Auth Supabase

Dans **Supabase Dashboard → Authentication → Settings** :

- **Confirm email** : `OFF` (accès immédiat sans confirmation)
- **Enable Sign Up** : `ON`

Dans **Authentication → Providers** :
- Activer **Google** (OAuth) et saisir les credentials Google Cloud
- Activer **Apple** (OAuth) et saisir les credentials Apple Developer

Dans **Authentication → Rate Limits** :
- Email sign-ins : `10 per hour per IP`

---

### Étape 3 — Déploiement des Edge Functions

#### Option A — Via Supabase CLI (recommandé)

```bash
# Installer Supabase CLI
npm install -g supabase

# Login
supabase login

# Lier le projet
supabase link --project-ref qscmjpzxyqvoyougxvdq

# Déployer toutes les functions
supabase functions deploy rotate-qr-tokens
supabase functions deploy expire-rewards
supabase functions deploy stripe-webhook
supabase functions deploy send-push-notification
```

#### Option B — Via Supabase Dashboard

Aller dans **Functions → Create new function** et copier-coller le contenu de chaque fichier `index.ts`.

---

### Étape 4 — Secrets des Edge Functions

Dans **Supabase Dashboard → Settings → Edge Functions → Secrets** :

| Clé | Valeur |
|-----|--------|
| `STRIPE_SECRET_KEY` | `sk_live_...` ou `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (depuis Stripe Dashboard) |
| `ONESIGNAL_API_KEY` | REST API Key OneSignal |
| `ONESIGNAL_APP_ID` | App ID OneSignal |
| `CRON_SECRET` | Secret aléatoire (générer avec `openssl rand -hex 32`) |

> Note : `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont automatiquement disponibles dans les Edge Functions.

---

### Étape 5 — Webhook Stripe

1. Dans **Stripe Dashboard → Developers → Webhooks**
2. Ajouter un endpoint : `https://qscmjpzxyqvoyougxvdq.supabase.co/functions/v1/stripe-webhook`
3. Sélectionner les événements :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.created`
4. Copier le **Signing Secret** (`whsec_...`) dans les secrets Edge Functions

---

### Étape 6 — Alternative cron sans pg_cron (GitHub Actions)

Créer `.github/workflows/cron.yml` :

```yaml
name: Fydly Cron Jobs
on:
  schedule:
    - cron: '0 0 * * *'    # Rotation QR — 00h00 UTC
    - cron: '0 2 * * *'    # Expiration rewards — 02h00 UTC

jobs:
  rotate-qr:
    runs-on: ubuntu-latest
    steps:
      - name: Rotation QR tokens
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://qscmjpzxyqvoyougxvdq.supabase.co/functions/v1/rotate-qr-tokens

  expire-rewards:
    runs-on: ubuntu-latest
    steps:
      - name: Expiration rewards
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://qscmjpzxyqvoyougxvdq.supabase.co/functions/v1/expire-rewards
```

---

### Étape 7 — Génération du premier QR token

Après avoir déployé l'Edge Function, appeler manuellement en HTTP :

```bash
curl -X POST https://qscmjpzxyqvoyougxvdq.supabase.co/functions/v1/rotate-qr-tokens \
  -H "Authorization: Bearer VOTRE_CRON_SECRET"
```

---

## Vérification

### Tables créées
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- Doit montrer : merchants, customers, loyalty_cards, transactions, qr_tokens, rewards, notifications
```

### RLS activé
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- Toutes les tables doivent avoir rowsecurity = true
```

### Fonctions disponibles
```sql
SELECT proname FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN ('upsert_stamp', 'redeem_reward', 'get_merchant_kpis', 'get_analytics_data', 'validate_qr_token');
```

### Tester upsert_stamp (depuis SQL Editor)
```sql
-- D'abord créer un merchant et customer de test
-- Ensuite :
SELECT public.upsert_stamp(
  'UUID_CUSTOMER_TEST'::UUID,
  'UUID_MERCHANT_TEST'::UUID,
  'TOKEN_QR_TEST'
);
```
