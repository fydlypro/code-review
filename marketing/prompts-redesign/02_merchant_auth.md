# Redesign — Merchant Login & Register

**Pages actuelles :** `merchant/LoginPage.tsx` · `merchant/RegisterPage.tsx`

---

```
[INCLURE LE DESIGN SYSTEM V2]

Redesigne les pages Login et Register du merchant Fydly en un design split-screen premium.

FORMAT : Desktop (1440×900) + Mobile (375×812)

## LOGIN PAGE

### Panneau gauche (55%) — Branding immersif
- Fond : gradient sombre de #0F172A vers #1E293B
- Pattern géométrique subtil en arrière-plan (lignes diagonales fines, opacity 3%)
- En haut : logo Fydly⚡ blanc + "Espace professionnel" en pill ghost (border-white/10)
- Centre : headline display 48px, blanc :
  "Pilotez votre fidélisation."
  Ligne 2 en gradient bleu→violet : "En temps réel."
- Sous-titre : "Dashboard analytics, notifications push, segmentation clients — tout au même endroit."
- En dessous : 3 mini-cards glass (bg-white/5, border-white/8, backdrop-blur) :
  - "247 clients ce mois" avec mini sparkline verte
  - "96% satisfaction" avec 5 étoiles
  - "Score Fydly : 78/100" avec micro jauge circulaire
- Animation : les cards apparaissent en stagger avec un léger float
- En bas : "© 2026 Fydly" + liens Confidentialité · CGV

### Panneau droit (45%) — Formulaire
- Fond blanc pur
- Centré verticalement
- En-tête :
  - Pill : "CONNEXION SÉCURISÉE 🔒" (slate-100, text-slate-500)
  - H1 display : "Bon retour !" (36px)
  - Sous-titre : "Accédez à votre tableau de bord."
- Formulaire :
  - Input "Email" — icône Mail, placeholder "contact@commerce.com"
  - Input "Mot de passe" — icône Lock, toggle show/hide (Eye/EyeOff)
  - Lien "Mot de passe oublié ?" aligné à droite, text-xs bleu
  - Les inputs : height 52px, border-radius 14px, border 2px slate-200, focus: blue-500 + ring-4 blue/8
  - Au focus : label animé qui monte au-dessus de l'input (floating label)
- CTA : "Se connecter →" pleine largeur, 52px height, primary blue, shadow glow
- Séparateur "ou" avec lignes
- Boutons OAuth : Google (outlined) + Apple (filled dark) — height 48px
- En bas : "Pas encore de compte ? Créer un compte →" lien blue bold

### Mobile
- Le panneau gauche devient un header compact (logo + headline condensé)
- Le formulaire prend tout l'écran en dessous
- Les OAuth en premier, le formulaire email en dessous après un "ou"

## REGISTER PAGE
- Même layout split-screen
- Panneau gauche : headline "Démarrez en 10 minutes." + aperçu du dashboard (mockup)
- Panneau droit :
  - H1 : "Créer votre compte Pro"
  - Fields : Nom du commerce · Email · Mot de passe · Secteur (select dropdown stylisé)
  - Checkbox RGPD avec lien cliquable
  - CTA : "Créer mon compte gratuitement →"
  - Mention : "30 jours d'essai · Sans carte bancaire"
  - "Déjà un compte ? Se connecter →"
- Progress indicator en haut : étape 1/2 (inscription → onboarding)

TOUCHES PREMIUM :
- Transition fluide entre login ↔ register (shared layout animation)
- Password strength indicator animé (barre qui se remplit + couleur)
- Input validation en temps réel (✓ vert quand valide)
- Skeleton shimmer sur le panneau gauche pendant le chargement
- Confetti micro quand l'inscription est validée
```
