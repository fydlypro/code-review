# Redesign — Customer Auth

**Page actuelle :** `customer/AuthPage.tsx`

---

```
[INCLURE LE DESIGN SYSTEM V2]

Redesigne la page d'authentification client Fydly. Le client arrive souvent ici après avoir scanné un QR en boutique — l'UX doit être ultra-rapide, mobile-first, et contextualisée.

FORMAT : Mobile-first (375×812) + Desktop (1440×900)

CONCEPT : Une page d'auth conversationnelle qui s'adapte au contexte (scan en attente ou accès direct).

## FOND & AMBIANCE
- Fond : gradient subtil de white vers blue-50
- Blobs décoratifs : 2 cercles flous (blue-200/30 et blue-300/15) en coins opposés
- Pas de bruit visuel — l'attention est sur le formulaire

## BRANDING (haut de page)
- Logo Fydly⚡ dans un carré arrondi (64px), shadow-lg avec glow-blue
- Si scan en attente : badge doré animé (pulse) avec ⭐ en overlay sur le logo

## TEXTE CONTEXTUEL
- **Si token en attente** (vient d'un scan) :
  - Pill animée : "⚡ TAMPON EN ATTENTE" (gradient bleu→violet, text white, shadow)
  - Titre display 32px : "Gagnez vos tampons chez {merchantName} !"
  - Sous-titre : "Connectez-vous — votre tampon sera ajouté automatiquement."
  
- **Si accès direct** :
  - Titre display 32px : "Votre espace fidélité"
  - Sous-titre : "Connectez-vous pour voir vos cartes."

## CARD FORMULAIRE
- Card : bg-white, border-radius 24px, shadow-lg, border slate-100/80
- Bandeau de confiance en haut :
  - Gradient blue-50 → blue-100/40, border-bottom
  - Icône ShieldCheck verte + "Déjà client ? On vous reconnecte. Nouveau ? Compte créé en 1 clic."
  - Texte 12px, semi-bold

### OAuth (en premier — c'est le plus rapide)
- 2 boutons full-width, 52px height :
  - Google : fond white, border 2px slate-200, logo Google, "Continuer avec Google"
  - Apple : fond slate-900, text white, logo Apple inversé, "Continuer avec Apple"
- Hover : shadow-md, translateY -1px
- Active : scale 0.98

### Séparateur
- Ligne + "ou par email" en pill caption (bg-white, text-slate-300)

### Formulaire email
- Inputs :
  - Email : icône Mail, 52px height, border 2px, placeholder "votre@email.com"
  - Mot de passe : icône Lock, toggle Eye/EyeOff, placeholder "••••••••"
  - Focus : border blue-500, ring-4 blue/8%, label slide-up animation
  
- **Si nouveau compte détecté** (après submit) :
  - Section qui apparaît en slide-down animé
  - Séparateur "NOUVEAU COMPTE" en caption
  - Input Prénom : icône User, placeholder "Votre prénom" (optionnel)
  - Checkbox RGPD :
    - Card interne bg-blue-50, border blue-100, cursor pointer
    - Checkbox custom 20px (bleu quand coché, animation scale-pop)
    - Texte avec liens cliquables soulignés

- CTA : "Continuer →" (primary, full-width, 56px, glow shadow)
  - Loading : spinner + "Connexion..." 
  - Disabled : opacity 60%

## MENTION DE CONFIANCE (bas)
- "Fydly ne partage jamais vos données · 100% gratuit pour les clients"
- Texte 11px, slate-300

## DESKTOP
- Centré verticalement, max-width 440px
- Optionnel : illustration abstraite ou mockup carte fidélité à côté (comme un split-screen léger)

ANIMATIONS :
- Page : fade-in au chargement
- Si token en attente : le badge pulse et la pill a un shimmer gradient
- Les inputs ont un micro-bounce quand ils reçoivent le focus
- La section "Nouveau compte" a un slide-down avec spring easing
- Success : redirect avec fade-out
```
