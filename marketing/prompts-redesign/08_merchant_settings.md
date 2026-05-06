# Redesign — Merchant Settings

**Page actuelle :** `merchant/MerchantSettingsPage.tsx`

---

```
[INCLURE LE DESIGN SYSTEM V2]

Redesigne la page Paramètres du merchant Fydly. Structure claire, sections bien délimitées, sensation de contrôle total.

FORMAT : Desktop (1440×900) + Mobile (375×812)

## LAYOUT
- Desktop : sidebar de navigation à gauche (240px) + contenu à droite
- Mobile : navigation en pills horizontales scrollables en haut + contenu en stack

## HEADER
- Avatar large (56px) avec initiales, fond gradient bleu→violet
- Titre display : "Paramètres"
- Sous-titre : "Configurez votre boutique, votre programme et vos préférences."
- Breadcrumb rapide : pills "Profil · Programme · Marketing · Sécurité · ⚠️ Danger" (scroll horizontal)

## SIDEBAR (desktop only)
- Card avec border subtle
- Label "Navigation" en caption uppercase
- Items : icône + label, 48px height, rounded-xl hover
  - 🏪 Profil Boutique
  - ⭐ Programme Fidélité
  - 🔔 Marketing Auto
  - 🔒 Accès & Sécurité
  - Séparateur
  - 🗑️ Danger Zone (text red)
- Item actif : bg-slate-50, text-slate-900, font-bold
- Sticky en scroll

## SECTION 1 — PROFIL BOUTIQUE
- Card avec header : icône Store + "Profil Boutique" + badge "GÉNÉRAL"
- Zone logo : 
  - Avatar large 80px avec initiales (dynamiques)
  - Overlay upload au hover (icône Upload, fond dark/40)
  - Bouton "Choisir un fichier" à côté
  - Texte : "PNG/JPG · 512×512 recommandé" + "En attendant, vos initiales sont affichées."
  - Le tout dans une card interne bg-gradient subtle
- Champs : grille 2 colonnes
  - "Nom commercial" : input 48px, label floating
  - "Secteur d'activité" : select custom stylisé avec icônes par secteur
- CTA : "✓ Enregistrer" (primary, aligné à droite)

## SECTION 2 — PROGRAMME FIDÉLITÉ
- Card avec header : icône Star filled + "Programme Fidélité" + badge "CORE VALUE" (dark)
- Layout 2 colonnes (input/aperçu) :
  - GAUCHE : compteur de tampons
    - Input numérique géant (display 56px) dans un cadre arrondi
    - Label "points / carte" en pill caption en dessous
    - Info "Entre 2 et 20"
  - DROITE : description récompense
    - Input text 56px avec label star icône
    - Preview : "Après X tampons → "{description}""
    - Tip : "Soignez votre offre, c'est ce qui fera revenir vos clients !"
- CTA : "✓ Mettre à jour l'offre" (secondary)

## SECTION 3 — MARKETING AUTOMATIQUE
- Card avec header : icône BellRing + "Marketing Automatique" + badge dynamique (ACTIF vert / INACTIF gris)
- Toggle row :
  - Card interne bg-slate-50
  - Titre : "Notifications de rappel"
  - Description : "Relancez les clients absents depuis 30 jours."
  - Toggle switch (56px × 32px) — actif: blue-600, inactif: slate-200
  - Le knob a une shadow et une transition 300ms
- Si activé : section expandable avec animation slide-down
  - Textarea "Message de relance personnalisé"
  - Compteur caractères
  - Info : "💡 Ce message sera envoyé automatiquement aux clients inactifs."
- CTA : "✓ Enregistrer les relances" (primary)

## SECTION 4 — ACCÈS & SÉCURITÉ
- Card avec header : icône KeyRound + "Accès & Sécurité" + badge "PROTÉGÉ" (vert)
- Grille 2 colonnes :
  - Email (disabled, icône Mail, fond slate-50, opacity 70%)
  - Mot de passe (input password avec toggle Eye/EyeOff)
    - Password strength meter : 4 barres qui se remplissent (rouge→orange→vert→bleu)
- Info sécurité : "🔒 Chiffrement AES-256 · Supabase Auth"
- CTA : "Mettre à jour le mot de passe" (secondary)

## SECTION 5 — DANGER ZONE
- Card spéciale : border 2px red-200, bg gradient red-50/60 → white
- Header : 3 dots rouges (pulse) + "ZONE DE DANGER — Actions irréversibles"
- Contenu :
  - Icône Trash2 dans carré red-100 (48px)
  - Titre : "Supprimer le compte" + pill "IRRÉVERSIBLE" (red)
  - Description : texte d'avertissement
  - Bouton : "🗑️ Fermer mon commerce" (bg-red-600, text white, shadow red)
  - Confirmation : double confirm (modal avec input "SUPPRIMER" à taper)

INTERACTIONS :
- Chaque section sauvegarde indépendamment
- Toast de confirmation après chaque save
- Loading spinner dans les boutons pendant la requête
- Smooth scroll vers la section quand on clique dans la sidebar/breadcrumb
- Les toggles ont un feedback haptique visuel (léger bounce du knob)
```
