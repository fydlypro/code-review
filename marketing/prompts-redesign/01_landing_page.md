# Redesign — Landing Page

**Page actuelle :** `src/pages/LandingPage.tsx`

---

```
[INCLURE LE DESIGN SYSTEM V2]

Redesigne la Landing Page de Fydly. C'est la page la plus importante — elle doit convertir des commerçants en utilisateurs.

FORMAT : Desktop (1440×900) + Mobile (375×812)

STRUCTURE REDESIGNÉE :

## NAVBAR (sticky)
- Logo Fydly⚡ à gauche
- Navigation : Fonctionnalités · Tarifs · Témoignages (pas de "Comment ça marche" séparé)
- À droite : "Se connecter" (text link) + "Essai gratuit" (bouton primary glow-blue)
- Au scroll : fond glass (white/80 backdrop-blur-xl), border-bottom subtle
- Mobile : burger menu avec full-screen overlay, animation slide-down

## HERO (above the fold)
- Layout asymétrique : texte 50% gauche, visual 50% droite
- Headline en 2 lignes max, display 72px :
  "Faites revenir vos clients." (slate-900)
  "Sans effort." (gradient bleu→violet, italique)
- Sous-headline 20px slate-600 : "Carte de fidélité 100% digitale. Un scan QR, un tampon. Vos clients reviennent — et vous avez les données pour le prouver."
- Social proof inline : avatars empilés (5 cercles avec initiales) + "Rejoint par 7+ commerces locaux"
- 2 CTAs côte à côte :
  - Primary : "Démarrer gratuitement →" (blue glow shadow, 56px height)
  - Secondary : "Voir la démo ▶" (ghost button, outline)
- VISUAL DROITE : 
  - Mockup 3D-isometric d'un iPhone montrant la carte de fidélité client (tampons ⚡, progression 8/10)
  - Pastilles flottantes animées autour du phone :
    - "+1 tampon !" (notification bleue, bounce subtil)
    - "🎁 Récompense débloquée" (pill verte)
    - Mini chart "+34% visites" (card avec sparkline)
  - Fond : mesh gradient très subtil (bleu/violet/cyan ultra-light, opacity 30%)

## BARRE DE LOGOS / STATS
- Fond slate-50, border-top/bottom subtle
- 4 métriques en ligne : "7 commerces" · "300+ clients" · "96% satisfaction" · "+47% visites"
- Chaque stat avec icône Lucide, chiffre display bold, label caption
- Animation count-up au scroll

## SECTION "COMMENT ÇA MARCHE" (3 étapes)
- Titre : "3 étapes. Zéro friction."
- 3 cartes horizontales connectées par une ligne/flèche en pointillés
- Chaque carte :
  - Numéro "01" en display très grand, couleur primary ultra-light
  - Icône dans un carré arrondi blue-50
  - Titre bold 20px
  - Description 14px slate-600
  - Mini illustration/mockup spécifique :
    1. QR Code affiché sur un comptoir (isometric)
    2. Téléphone avec animation "tampon ajouté" (confetti micro)
    3. Écran récompense avec QR code client
- Hover : card monte de 4px, shadow-lg apparaît

## SECTION FEATURES (grille 2×3)
- Titre : "Tout pour fidéliser. Rien de superflu."
- Grille de 6 feature cards :
  1. QR Code dynamique (renouvellement quotidien, anti-fraude)
  2. Carte 100% digitale (pas d'app, navigateur)
  3. Notifications push intelligentes (relance inactifs)
  4. Analytics temps réel (graphiques, heatmap, score)
  5. Segmentation clients (VIP, inactifs, nouveau)
  6. Expérience micro-animée (satisfaction client)
- Design : chaque card a un gradient subtle en fond (différent), icône colorée, titre + 2 lignes
- Hover : border se colore selon l'accent de la feature

## SECTION SOCIAL PROOF / TÉMOIGNAGE
- Design "spotlight" : fond dark (slate-900) en pleine largeur
- Citation en display 32px, italique, blanc
- 5 étoiles dorées au-dessus
- Avatar + nom + commerce + ville en dessous
- Effet : guillemets géants en filigrane, glow subtil derrière la citation

## SECTION PRICING
- 2 cartes côte à côte (Pro 59,99€ + Business 109,99€)
- Pro : background dark (slate-900), badge "POPULAIRE", features avec check marks bleus
- Business : fond blanc, border slate-200
- Les deux : "30 jours gratuits — Sans carte bancaire"
- CTA sur chaque carte, le Pro est plus prominent (glow shadow)
- FAQ mini (3 questions) en accordion sous les cartes

## CTA FINAL
- Fond gradient mesh (bleu/violet, subtil)
- Titre display : "Prêt à transformer vos visites ?"
- Sous-titre + CTA primary + ghost CTA
- Badge "Sans carte bancaire requise ✨"

## FOOTER
- Compact, 4 colonnes : Produit · Entreprise · Légal · Contact
- Logo Fydly⚡ + baseline
- Social links (minimaliste)
- "© 2026 Fydly — Fait pour le commerce local."

DIRECTIVES DESIGN :
- Animations au scroll (fade-in-up, stagger 100ms entre éléments)
- Parallax léger sur le hero visual
- Cursor custom sur les CTAs (pointer glow)
- Chaque section a au minimum 120px de padding vertical
- Alternance fond blanc / slate-50 / dark pour rythmer
- Les illustrations doivent montrer des vrais mockups de l'app, pas des placeholders
```
