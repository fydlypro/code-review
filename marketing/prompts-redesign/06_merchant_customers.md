# Redesign — Merchant Customers

**Page actuelle :** `merchant/CustomersPage.tsx` + `merchant/CustomerDetailPage.tsx`

---

```
[INCLURE LE DESIGN SYSTEM V2]

Redesigne la page Clients du merchant Fydly + la page détail d'un client. L'objectif : une base clients explorable, segmentable et actionable — façon CRM léger.

FORMAT : Desktop (1440×900) + Mobile (375×812)

## PAGE LISTE CLIENTS

### Header
- Titre display : "Vos clients" + icône Users dans carré slate-50
- Sous-titre : "Gérez votre communauté fidèle."
- À droite : bouton "📥 Exporter CSV" (secondary, ghost border)

### Toolbar (sticky sous le header)
- Barre de recherche : input 48px, icône Search, placeholder "Rechercher par nom ou email..."
  - Full-width sur mobile, 400px max sur desktop
  - Focus : ring blue, icône change de couleur
- Filtres en pills :
  - "Tous" (slate, actif par défaut)
  - "Actifs" (emerald, dot vert)
  - "Inactifs" (slate-400, dot orange)
  - "🎁 Cadeau dispo" (violet, dot violet)
  - Chaque pill montre le count entre parenthèses
  - Pill active : fond filled + text white + shadow
  - Pill inactive : fond transparent, border, text muted
- Mobile : pills en scroll horizontal

### Table Desktop (hidden on mobile)
- Headers : Client · Fidélité · Statut · Dernière visite · →
- Headers en uppercase 10px, tracking-widest, slate-400
- Chaque row :
  - Avatar initiales (carré arrondi 14px, couleur déterministe basée sur le nom)
  - Nom bold 15px + email caption en dessous
  - Barre de progression fidélité (120px wide, 6px height) + "X/10" en mono
  - Badges : "🎁 Cadeau dispo" (pill emerald) ou "—"
  - Date dernière visite en bold slate-600
  - Chevron → dans cercle hover
- Row hover : bg-slate-50/50, transition 150ms
- Alternance : pas de zebra stripes, juste hover
- Footer : "X clients affichés" + filtre actif

### Cards Mobile
- Chaque client = card compacte :
  - Avatar initiales + nom bold + email caption
  - Ligne 2 : pill "X/10" + badge cadeau si applicable
  - À droite : date + chevron dans cercle
  - Tap : navigation vers détail
  - Active : scale 0.98

### État vide
- Illustration : icône User géante dans cercle slate-50
- "Aucun résultat" + "Essayez un autre filtre."

---

## PAGE DÉTAIL CLIENT

### Header avec breadcrumb
- "Clients → {Prénom}" en breadcrumb cliquable
- Bouton retour (ChevronLeft)

### Profil Hero
- Card premium avec gradient subtil en header (blue-50 → white)
- Avatar large (64px) avec initiales
- Nom display 28px + email caption
- Badges en ligne : "🟢 Actif" ou "🟠 Inactif" + "Client depuis {date}"
- Actions rapides : "📩 Envoyer un message" (primary) + "📥 Exporter" (ghost)

### Stats du client (3 cards en ligne)
- "Tampons actuels" : X/10 avec circular progress mini
- "Total gagné" : X tampons (lifetime)
- "Récompenses utilisées" : X

### Barre de fidélité visuelle
- Grande barre de progression (12px height) avec gradient bleu
- Marqueurs : chaque tampon = point sur la barre
- Si proche de la récompense : glow animé sur le dernier segment

### Historique des visites
- Timeline verticale avec ligne continue
- Chaque visite : date · heure · type (earn/redeem) · montant
- Type earn : dot bleu + "⚡ Tampon gagné"
- Type redeem : dot doré + "🎁 Récompense validée"
- Pagination ou infinite scroll

### Récompenses
- Si récompense dispo : card dorée avec CTA "Voir le QR de récompense"
- Historique récompenses passées en liste simple

RESPONSIVE :
- Le profil hero passe en stack vertical sur mobile
- Stats en scroll horizontal (snap scroll)
- Timeline pleine largeur
```
