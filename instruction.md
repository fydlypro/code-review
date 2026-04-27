# Fydly — Instructions complètes

## 🎯 Objectif

Fydly est une plateforme SaaS B2B de fidélité digitale.  
Elle permet à des commerçants indépendants de créer et gérer un programme de fidélité pour leurs clients via un QR code affiché en caisse.  
Le client scanne, s'inscrit ou se connecte, et cumule des tampons — sans télécharger d'application.

---

## ⚙️ Stack technique

- **Frontend** : React 19 + Vite
- **Routing** : React Router DOM v7
- **Style** : Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Notifications push** : OneSignal
- **Paiement** : Stripe
- **Scanner QR** : html5-qrcode
- **Génération QR** : qrcode.react
- **Graphiques** : Recharts
- **Icônes** : Lucide React
- **Hébergement** : Vercel

---

## 🔐 Configuration

```env
VITE_SUPABASE_URL=https://qscmjpzxyqvoyougxvdq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_9ydJyWHmHioTdlrxerh9DQ_2uL-ri-z
VITE_MERCHANT_ACCESS_CODE=FYDLY2026PRO
VITE_ONESIGNAL_APP_ID=(à configurer)
VITE_STRIPE_PUBLIC_KEY=(à configurer)
```

---

## 🗄️ Base de données Supabase

Toutes les tables sont créées et le RLS est activé.  
**Toutes les données affichées dans l'application doivent provenir de Supabase en temps réel. Aucune donnée mockée ou hardcodée n'est autorisée.**

### Tables

```sql
merchants
  id UUID PRIMARY KEY
  user_id UUID REFERENCES auth.users UNIQUE
  name VARCHAR(100)
  sector VARCHAR(50)
  program_type TEXT ('stamps' | 'points')
  reward_threshold INTEGER DEFAULT 10
  reward_description VARCHAR(200)
  subscription_status TEXT ('trial' | 'active' | 'expired')
  trial_ends_at TIMESTAMPTZ DEFAULT NOW() + 30 days
  stripe_customer_id VARCHAR
  stripe_subscription_id VARCHAR
  created_at TIMESTAMPTZ

customers
  id UUID PRIMARY KEY
  user_id UUID REFERENCES auth.users UNIQUE
  email VARCHAR
  first_name VARCHAR
  phone VARCHAR
  onesignal_player_id TEXT
  created_at TIMESTAMPTZ

loyalty_cards
  id UUID PRIMARY KEY
  customer_id UUID REFERENCES customers
  merchant_id UUID REFERENCES merchants
  balance INTEGER DEFAULT 0
  total_earned INTEGER DEFAULT 0
  last_scan_at TIMESTAMPTZ
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
  UNIQUE(customer_id, merchant_id)

transactions
  id UUID PRIMARY KEY
  card_id UUID REFERENCES loyalty_cards
  customer_id UUID REFERENCES customers
  merchant_id UUID REFERENCES merchants
  type TEXT ('earn' | 'redeem')
  amount INTEGER DEFAULT 1
  qr_token_used VARCHAR
  created_at TIMESTAMPTZ

qr_tokens
  id UUID PRIMARY KEY
  merchant_id UUID REFERENCES merchants
  token VARCHAR UNIQUE
  valid_date DATE
  is_active BOOLEAN DEFAULT true
  created_at TIMESTAMPTZ

rewards
  id UUID PRIMARY KEY
  card_id UUID REFERENCES loyalty_cards
  customer_id UUID REFERENCES customers
  merchant_id UUID REFERENCES merchants
  status TEXT ('available' | 'redeemed' | 'expired')
  reward_qr_token VARCHAR UNIQUE
  expires_at TIMESTAMPTZ DEFAULT NOW() + 30 days
  redeemed_at TIMESTAMPTZ
  created_at TIMESTAMPTZ

notifications
  id UUID PRIMARY KEY
  merchant_id UUID REFERENCES merchants
  message VARCHAR(140)
  segment TEXT ('all' | 'active' | 'inactive')
  recipients_count INTEGER
  status TEXT ('pending' | 'sent' | 'failed')
  sent_at TIMESTAMPTZ
  created_at TIMESTAMPTZ
```

---

## 🎨 Design system

```
Fond de page :       #E3F2FD
Cards :              #FFFFFF + box-shadow: 0 2px 12px rgba(25,118,210,0.10)
Boutons CTA :        #2196F3 texte blanc border-radius 12px
Titres :             #0D47A1 bold
Textes courants :    #1565C0
Textes secondaires : #1976D2
Écran scanner :      #1976D2 (seul fond sombre autorisé)
Border-radius :      12px sur toutes les cards et boutons
Transitions :        200ms ease sur tous les éléments interactifs
Langue :             100% français — aucun texte en anglais visible
```

---

## 🔒 Séparation stricte des espaces

L'application contient deux espaces totalement indépendants.  
Un commerçant connecté ne peut jamais accéder à l'espace client.  
Un client connecté ne peut jamais accéder à l'espace commerçant.  
Deux composants de protection distincts : `MerchantRoute` et `CustomerRoute`.

---

---

# 👤 PARTIE CLIENT

---

## Routes client

```
/scan                → scanner QR code (publique)
/customer/auth       → connexion ou inscription (publique)
/customer/card       → carte fidélité (protégée)
/customer/reward     → écran récompense (protégée)
/customer/history    → historique des visites (protégée)
/customer/settings   → paramètres et déconnexion (protégée)
```

---

## Écran 1 — Scanner QR code `/scan`

**Comportement**
- La caméra s'ouvre **automatiquement** au chargement de la page via `html5-qrcode` — aucun clic requis
- Demande de permission caméra automatique au chargement
- Si permission refusée → message d'aide en français avec instructions pour iOS et Android
- Fond `#1976D2`, titre "Scanner le QR Code" en blanc, cadre de scan centré 250×250px

**Après détection du QR**
- Extraire `token` et `merchant_id` depuis l'URL scannée
- Sauvegarder les deux dans `sessionStorage` pour ne pas les perdre pendant la navigation
- Vérifier côté Supabase que le token est valide : existe dans `qr_tokens`, `valid_date` = aujourd'hui UTC, `is_active` = true
- Si token invalide → "Ce QR code n'est plus valide. Demandez au commerçant le QR du jour."
- Si client déjà connecté → aller directement à l'attribution du tampon
- Si client non connecté → rediriger vers `/customer/auth?token=X&m=Y`

---

## Écran 2 — Connexion / Inscription client `/customer/auth`

**Contexte**
- Afficher en haut le nom du commerçant récupéré depuis Supabase avec le `merchant_id`
- Message d'accroche : "Gagnez vos tampons chez [Nom commerce] !"

**Formulaire unique — gère connexion ET inscription**
- Bouton "Continuer avec Google" → Google OAuth Supabase
- Bouton "Continuer avec Apple" → Apple OAuth Supabase
- Champ email + champ mot de passe + bouton "Continuer"
- Logique : tenter `signInWithPassword()` en premier. Si erreur "Invalid login credentials" → tenter `signUp()` automatiquement avec les mêmes identifiants
- Case RGPD non pré-cochée affichée uniquement pour les nouveaux comptes
- **Pas d'email de confirmation — accès immédiat**

**Après authentification réussie**
- Créer un profil dans `customers` si inexistant : `INSERT ... ON CONFLICT DO NOTHING`
- Déclencher immédiatement l'attribution du tampon
- Rediriger vers `/customer/card?new_stamp=true`

---

## Attribution du tampon — logique critique

**Cette logique s'exécute après chaque authentification réussie et après chaque scan d'un client déjà connecté.**

```
1. Vérifier anti-fraude :
   Récupérer loyalty_card pour ce couple customer_id/merchant_id
   Si last_scan_at < 60 minutes → "Vous avez déjà scanné ici récemment. 
   Revenez dans [X] minutes." → arrêter

2. Upsert loyalty_card (une seule opération atomique) :
   INSERT INTO loyalty_cards (customer_id, merchant_id, balance, total_earned, last_scan_at)
   VALUES (..., 1, 1, NOW())
   ON CONFLICT (customer_id, merchant_id) 
   DO UPDATE SET 
     balance = loyalty_cards.balance + 1,
     total_earned = loyalty_cards.total_earned + 1,
     last_scan_at = NOW(),
     updated_at = NOW()

3. Créer une transaction :
   INSERT INTO transactions (card_id, customer_id, merchant_id, type, amount, qr_token_used)
   VALUES (..., 'earn', 1, [token])

4. Vérifier si récompense débloquée :
   Si balance >= reward_threshold ET pas de reward 'available' existante :
   - Créer reward avec reward_qr_token = crypto.randomUUID()
   - expires_at = NOW() + 30 jours
   - Envoyer notification push OneSignal au client

5. Rediriger vers /customer/card?new_stamp=true
```

---

## Écran 3 — Carte fidélité `/customer/card`

**Contenu**
- Nom du commerce en haut
- Animation "+1 Tampon !" pendant 2 secondes si `?new_stamp=true` dans l'URL
- Tampons visuels en grille : 🟡 pour tampons validés, ○ pour tampons vides
- Barre de progression `#2196F3` indiquant l'avancement vers la récompense
- Texte "Plus que X tampons pour [reward_description]"
- Date de la dernière visite
- Bouton "Voir mon historique" → `/customer/history`

**Si reward disponible**
- Remplacer tout l'affichage par l'écran de récompense
- Fond `#0D47A1`, animation confettis
- QR code blanc généré depuis `reward_qr_token`
- Texte "Montrez ce QR au commerçant"
- Date d'expiration visible

**Si le client a des cartes chez plusieurs commerçants**
- Afficher la liste de toutes ses cartes avec possibilité de naviguer entre elles

---

## Écran 4 — Historique `/customer/history`

- Liste de toutes les transactions du client chez ce commerçant
- Date, heure, type (gain ou récompense utilisée)
- Nombre de tampons total gagné depuis le début

---

## Écran 5 — Paramètres `/customer/settings`

- Toggle notifications push (OneSignal)
- Bouton déconnexion
- Bouton suppression de compte (RGPD) — suppression de toutes les données sous 48h

---

---

# 🏪 PARTIE COMMERÇANT

---

## Routes commerçant

```
/merchant/login          → connexion (publique)
/merchant/register       → inscription avec code secret (publique)
/merchant/onboarding     → configuration programme (protégée)
/merchant/dashboard      → tableau de bord principal (protégée)
/merchant/customers      → liste et fiches clients (protégée)
/merchant/customers/:id  → fiche client détaillée (protégée)
/merchant/analytics      → statistiques détaillées (protégée)
/merchant/notifications  → historique des notifications (protégée)
/merchant/billing        → abonnement Stripe (protégée)
/merchant/settings       → paramètres du compte (protégée)
```

---

## Écran 1 — Inscription commerçant `/merchant/register`

**Formulaire détaillé**
- Champ "Code d'accès professionnel" — vérifié en premier contre `VITE_MERCHANT_ACCESS_CODE`
  - Coche verte ✅ si correct
  - Croix rouge ❌ si incorrect
  - Bouton d'inscription désactivé tant que code incorrect
- Nom du commerce (obligatoire)
- Secteur d'activité — dropdown : Restaurant, Boulangerie, Coiffeur, Boutique, Café, Autre
- Email (obligatoire)
- Mot de passe minimum 8 caractères (obligatoire)
- Confirmation mot de passe (obligatoire)
- Téléphone (optionnel)
- Case CGU non pré-cochée (obligatoire)
- **Pas d'email de confirmation — accès immédiat**
- Après inscription → créer profil dans `merchants` → rediriger vers `/merchant/onboarding`

---

## Écran 2 — Connexion commerçant `/merchant/login`

- Email + mot de passe
- Messages d'erreur en français
- Lien "Mot de passe oublié" fonctionnel
- Session persistante 30 jours
- Redirection automatique vers dashboard si déjà connecté

---

## Écran 3 — Onboarding `/merchant/onboarding`

**Étape 1/2 — Choix du programme**
- Deux cards cliquables : "🟡 Tampons" et "⭐ Points"
- Card sélectionnée avec bordure `#2196F3`
- Bouton Suivant activé après sélection

**Étape 2/2 — Configuration de la récompense**
- Champ numérique : "Nombre de tampons pour une récompense" (défaut : 10)
- Champ texte : "Description de la récompense" (ex: "1 café offert")
- Aperçu de la carte fidélité en temps réel pendant la saisie
- Bouton "Terminer et accéder au dashboard"
- Génération automatique du premier QR token du jour
- Redirect vers `/merchant/dashboard`

---

## Écran 4 — Dashboard `/merchant/dashboard`

**Toutes les données sont réelles et proviennent de Supabase en temps réel via Realtime subscriptions.**  
**Le dashboard doit être responsive : parfaitement utilisable sur mobile ET desktop.**

### Section QR Code du jour
- QR code affiché en grand — encode l'URL `/scan?token=X&m=Y`
- Mention "Valable jusqu'à 00h00 ce soir"
- Countdown des heures restantes avant expiration
- Bouton "🖨️ Imprimer" → page A5 dédiée avec QR grand format
- Bouton "📺 Plein écran" → QR en plein écran fond blanc pour tablette en caisse
- Régénération automatique chaque jour à 00h00 UTC

### KPIs temps réel (Supabase Realtime)
- 👥 **Total clients** : COUNT loyalty_cards WHERE merchant_id = moi
- 🟡 **Tampons ce mois** : SUM transactions.amount WHERE type='earn' AND ce mois
- 🎁 **Récompenses données** : COUNT rewards WHERE status='redeemed' AND ce mois
- ⚠️ **Clients inactifs** : COUNT loyalty_cards WHERE last_scan_at < NOW - 30j

### Section notifications push
- Champ texte message (140 caractères max avec compteur visible)
- Dropdown segment : "Tous les clients" / "Clients actifs" / "Clients inactifs 30j+"
- Bouton "📤 Envoyer" avec confirmation "Vous allez envoyer ce message à X clients"
- Envoi réel via OneSignal API
- Toast de confirmation après envoi

### Derniers scans (temps réel)
- Liste des 5 derniers scans avec prénom client, nombre de tampons, heure
- Mise à jour automatique sans rechargement via Supabase Realtime
- Dès qu'un client scanne, le +1 apparaît ici en moins de 2 secondes

### Bouton "🎁 Scanner une récompense"
- Ouvre la caméra automatiquement via html5-qrcode
- Scan du QR de récompense du client
- Vérification : token valide + status=available + bon commerçant + non expiré
- Popup confirmation "Valider la récompense de [Prénom] ?"
- Si confirmé → transaction atomique Supabase :
  - rewards.status → 'redeemed'
  - loyalty_cards.balance - reward_threshold
  - INSERT transaction type 'redeem'
  - Notification push client "✅ Récompense validée !"
- Confirmation visuelle 3 secondes

---

## Écran 5 — Liste clients `/merchant/customers`

**Données réelles depuis Supabase — jointure loyalty_cards + customers.**  
**Mise à jour en temps réel : dès qu'un nouveau client scanne, il apparaît dans la liste.**

### Liste
- Prénom + email du client
- Solde actuel / seuil (ex: 7/10 🟡)
- Date de dernière visite calculée depuis last_scan_at
- Badge "⚠️ Inactif" en orange si last_scan_at > 30 jours
- Badge "⭐ VIP" si total_earned > 2 × reward_threshold
- Badge "🎁 Récompense dispo" si reward status='available'
- Bouton "Valider Récompense" si reward disponible

### Filtres et recherche
- Barre de recherche temps réel sur prénom et email
- Filtre : Tous / Actifs / Inactifs / VIP / Récompense disponible

### Export
- Bouton "📥 Exporter CSV" — colonnes : Prénom, Email, Téléphone, Tampons, Dernière visite, Date inscription

---

## Écran 6 — Fiche client `/merchant/customers/:id`

- Prénom, email, téléphone, date d'inscription
- Solde actuel avec tampons visuels 🟡
- Historique complet des transactions avec dates et heures
- Historique des récompenses (gagnées, validées, expirées)
- Bouton "Valider Récompense" si disponible
- Bouton "Envoyer une notification personnalisée"

---

## Écran 7 — Statistiques détaillées `/merchant/analytics`

**Toutes les données sont calculées dynamiquement depuis Supabase.**

### Graphiques (Recharts)
- **Évolution des visites** (LineChart) — filtre 7j / 30j / 3 mois
- **Heures d'affluence moyennes** (BarChart) — transactions groupées par heure de la journée
- **Nouveaux clients par semaine** (BarChart)
- **Taux de rétention** — clients avec 2+ scans sur 30j / total clients

### KPIs analytiques
- Jour le plus fréquenté (calculé depuis transactions)
- Heure de pointe moyenne
- Taux de retour 30j (%)
- Récompenses validées ce mois
- Clients proches de la récompense (balance >= threshold - 2)
- Clients à risque de churn (inactifs 20j+)

### Section "Actions recommandées"
Calculées dynamiquement selon les vraies données :
- Si clients inactifs 30j+ → "X clients n'ont pas visité depuis 30 jours → [Envoyer une relance]"
- Si clients proches récompense → "X clients sont à 1 tampon de leur récompense → [Les encourager]"
- Si pic le samedi → "Le samedi est votre jour le plus fréquenté → [Programmer une promo vendredi soir]"
- Si aucun client encore → "Dès que vous aurez vos premiers clients, nous vous proposerons ici des actions ciblées (promos, relances, cadeaux) pour booster votre fidélité."
- Chaque action a un bouton qui ouvre directement la section notification avec le bon segment pré-rempli

### Historique des actions effectuées
- Liste chronologique de toutes les notifications envoyées
- Message, segment ciblé, nombre de destinataires, date d'envoi
- Statut : envoyé ✅ / échoué ❌

---

## Écran 8 — Abonnement `/merchant/billing`

- Bannière d'essai avec jours restants calculés depuis `trial_ends_at`
- Couleur orange si moins de 7 jours restants
- 3 plans Stripe :
  - Starter 29€/mois — jusqu'à 200 clients, push 4/mois
  - Pro 59€/mois — jusqu'à 1000 clients, push illimités, analytics
  - Business 99€/mois — illimité, API, multi-établissements
- Bouton "Choisir ce plan" → Stripe Checkout réel
- Webhook Stripe → update `subscription_status` en base
- Si trial expiré → dashboard en lecture seule + QR désactivé + modal de conversion forcée
- Bouton "Gérer mon abonnement" → Stripe Customer Portal

---

## Écran 9 — Paramètres `/merchant/settings`

- Modifier nom du commerce, secteur
- Modifier seuil de récompense et description
- Upload logo (optionnel — JPG/PNG max 2Mo, stocké Supabase Storage)
- Modifier email et mot de passe
- Déconnexion
- Suppression de compte

---

---

# 🔔 Notifications push — OneSignal

### Automatiques (déclenchées par le système)
- Récompense débloquée → "🎁 Vous avez gagné : [reward_description] chez [merchant_name] !"
- Récompense validée → "✅ Profitez de votre [reward_description] !"
- Récompense expirée → "⚠️ Votre récompense chez [merchant_name] a expiré."
- Relance inactif 30j → Edge Function Supabase chaque nuit à 02h00 UTC
- Rappel trial commerçant J-7 et J-1

### Manuelles (envoyées par le commerçant)
- Message libre 140 caractères
- Segments : tous / actifs / inactifs
- Confirmation avant envoi avec nombre de destinataires
- Historique dans `/merchant/notifications`

---

# 🔄 Synchronisation temps réel — règle absolue

**Dès qu'un client crée un compte après scan QR :**
- Il apparaît immédiatement dans la liste clients du commerçant
- Son tampon est compté dans les KPIs du dashboard
- La transaction apparaît dans les statistiques
- Le graphique d'évolution des visites est mis à jour

**Tout cela via Supabase Realtime subscriptions — sans rechargement de page.**

---

# 🛡️ Sécurité

- Anti-fraude : 1 scan maximum par heure par client par commerce
- QR tokens : UUID v4 généré côté serveur uniquement
- Rotation QR : quotidienne à 00h00 UTC via Edge Function Supabase
- Rate limiting : 10 tentatives de connexion par heure par IP
- RLS Supabase respecté sur tous les appels
- Variables secrètes jamais dans les variables VITE_
- HTTPS obligatoire

---

# 📱 PWA

```json
{
  "name": "Fydly",
  "short_name": "Fydly",
  "theme_color": "#2196F3",
  "background_color": "#E3F2FD",
  "display": "standalone",
  "orientation": "portrait"
}
```

- Installable iOS Safari 16.4+
- Installable Android Chrome 80+
- Notifications push sans app native

---

# ✅ Règles de qualité — non négociables

- **Aucune donnée mockée ou hardcodée** — tout depuis Supabase
- **Tout en français** — aucun texte anglais visible par l'utilisateur
- **Spinner** sur tous les boutons pendant les appels API
- **Boutons désactivés** pendant le chargement (pas de double clic)
- **Skeleton loaders** pendant le chargement des listes
- **Messages d'erreur explicites** en français sur chaque action
- **Toast notifications** pour confirmer les actions réussies
- **Responsive** — parfaitement lisible sur mobile ET desktop
- **Aucune erreur** dans la console du navigateur

---

# 🗓️ Ordre de développement

```
1. Configuration Supabase client
2. Système auth + MerchantRoute + CustomerRoute
3. Inscription/connexion commerçant
4. Onboarding commerçant
5. Page scan QR avec caméra automatique
6. Page auth client + flux tampon complet
7. Carte fidélité client avec animation
8. Dashboard commerçant responsive + temps réel
9. Liste clients + fiche client
10. Système récompense (QR client + scan commerçant)
11. Statistiques avec graphiques Recharts
12. Notifications push OneSignal
13. Abonnement Stripe
14. PWA manifest
```

---

*Fydly — instructions.md v1.0 — Mars 2026*