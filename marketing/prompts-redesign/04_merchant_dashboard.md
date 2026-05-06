# Redesign — Merchant Dashboard

**Page actuelle :** `merchant/DashboardPage.tsx`

---

```
[INCLURE LE DESIGN SYSTEM V2]

Redesigne le Dashboard principal du merchant Fydly. C'est l'écran que le commerçant voit chaque jour — il doit être actionable, vivant et donner une sensation de contrôle.

FORMAT : Desktop (1440×900) + Mobile (375×812)

## SIDEBAR NAVIGATION (desktop)
- Largeur : 260px, fond white, border-right slate-100
- En haut : logo Fydly⚡ + nom du commerce (truncated) + badge plan "Pro"
- Navigation verticale :
  - 📊 Dashboard (actif : bg-blue-50, text-blue-700, border-left 3px blue)
  - 📈 Statistiques
  - 👥 Clients
  - 🔔 Campagnes
  - ⚙️ Paramètres
- Séparateur
- "💳 Facturation" + "❓ Support"
- En bas : avatar initiales du merchant + email tronqué + bouton déconnexion
- Hover : bg-slate-50, transition 150ms
- Collapse sur tablette : icônes only (60px width)

## MOBILE BOTTOM BAR
- 5 items : Dashboard · Stats · Scanner (center, prominent) · Clients · Plus
- Le bouton Scanner : cercle 56px, gradient bleu→violet, ombre glow, légèrement surélevé (-12px)
- Item actif : icône blue, dot indicateur en dessous
- Glass effect : bg-white/90 backdrop-blur-xl

## HEADER ZONE
- Greeting : "Bonjour, {nom} 👋" en display 28px
- Sous-titre : date du jour en français + météo locale (icône)
- À droite : bouton "Actualiser" (ghost, icône RefreshCw avec animation rotate au clic)
- Pastille "LIVE" verte avec pulse si realtime actif

## ZONE HERO — QR CODE + SCANNER (2 colonnes)
- COLONNE GAUCHE (60%) : QR Code du jour
  - Card premium avec border gradient subtil (bleu→violet, 1px)
  - QR Code centré, grande taille (240px), avec logo Fydly⚡ au centre
  - En dessous : URL courte du lien (copiable en 1 clic avec animation "Copié ✓")
  - Timer countdown : "Expire dans {Xh Xm}" avec barre de progression circulaire
  - Boutons d'action : "📋 Copier le lien" · "🖨 Imprimer" · "📱 Partager"
  - Badge sécurité : "🔒 Token dynamique — Renouvelé chaque jour"
  
- COLONNE DROITE (40%) : Action "Valider récompense"
  - Card dark (slate-900) avec gradient mesh subtil (bleu/violet)
  - Icône Scanner/Gift dans cercle glass (64px)
  - Titre : "🎁 Valider une récompense" en white display
  - Description : "Scannez le QR Code client" en white/70%
  - Tout le composant est cliquable (cursor pointer, hover scale 1.02)
  - Animation : glow pulse subtil en continu pour attirer l'attention
  - Sur mobile : bouton plein largeur sous le QR, même style

## KPIs (grille 4 colonnes, 2×2 sur mobile)
- Titre de section : "📊 Ce mois-ci" avec filtre temporel (7j · 30j · 3m) en pills
- 4 cards KPI redesignées :
  1. **Clients fidèles** (icône Users) — border-left 3px blue-500
     - Chiffre display 36px + variation badge ("+X% ↑" vert ou "-X% ↓" rouge)
     - Sparkline miniature (48px wide) en arrière-plan
     - Cliquable → navigue vers /customers
  2. **Tampons ce mois** (icône Stamp) — border-left 3px violet-500
     - Même structure
  3. **Récompenses** (icône Gift) — border-left 3px amber-500
     - Même structure
  4. **À relancer** (icône AlertTriangle) — border-left 3px red-400
     - Si > 5 : card border rouge, background rouge ultra-light
     - CTA inline "Envoyer une relance →"
- Hover sur chaque card : shadow-lg, translateY -2px

## SECTION ACTIVITÉ RÉCENTE + NOTIFICATIONS (2 colonnes)
- GAUCHE (60%) : Activité récente
  - Timeline verticale avec ligne continue à gauche
  - Chaque entrée : avatar initiale client, nom, type (earn/redeem), heure
  - Type "earn" : pill verte "⚡ +1 tampon"
  - Type "redeem" : pill dorée "🎁 Récompense validée"
  - Max 8 entrées, avec "Voir tout →" en bas
  - Realtime : nouvelle entrée s'ajoute en haut avec animation slide-down + highlight 2s

- DROITE (40%) : Quick Notification Composer
  - Card avec header "📣 Message rapide"
  - Textarea : 3 lignes, placeholder "Un petit mot pour vos clients..."
  - 3 pills de segment : "Tous" · "Actifs" (vert) · "Inactifs" (orange)
  - Compteur caractères avec barre de progression (bleu→amber→rouge)
  - Bouton "Envoyer →" (primary)
  - En dessous : card dark "🚀 Booster mes ventes" avec CTA vers /notifications

## RESPONSIVE
- Mobile : tout en stack vertical
- QR Code full-width, Scanner en bouton flottant
- KPIs en grille 2×2
- Activité : cards compactes au lieu de timeline
- Notification composer : bottom sheet accessible via FAB
```
