# Prompt — Vidéo Tuto Fydly avec Remotion

> Ce prompt est destiné à Claude pour générer le code Remotion complet d'une vidéo tutorielle explicative de Fydly pour les commerçants.

---

## Le Prompt

```
Tu es un développeur Remotion expert. Crée une vidéo tutorielle explicative de 60 secondes pour Fydly, une application de fidélité digitale pour commerçants. La vidéo doit expliquer le fonctionnement de l'app aux commerçants en 6 scènes fluides et animées.

## Setup technique

- Scaffold le projet avec : npx create-video@latest --yes --blank --no-tailwind fydly-tuto
- Format : 1080×1920 (vertical, format Story/Reel/TikTok)
- FPS : 30
- Durée totale : ~60 secondes (1800 frames)
- Installer les dépendances : @remotion/transitions, @remotion/google-fonts

## RÈGLES REMOTION CRITIQUES
- ❌ INTERDIT d'utiliser des animations CSS (transitions, @keyframes, animation: ...)
- ❌ INTERDIT d'utiliser des classes Tailwind d'animation
- ✅ Tout animer avec useCurrentFrame() + interpolate() + Easing.bezier()
- ✅ Utiliser <Sequence> pour séquencer les éléments dans le temps
- ✅ Utiliser <TransitionSeries> avec fade() ou slide() pour les transitions entre scènes
- ✅ Utiliser @remotion/google-fonts pour charger les polices
- ✅ Placer les assets dans public/ et les référencer avec staticFile()
- ✅ Toujours clamp les interpolations (extrapolateLeft: "clamp", extrapolateRight: "clamp")

## Polices

```tsx
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";

const { fontFamily: inter } = loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
const { fontFamily: outfit } = loadOutfit("normal", { weights: ["600", "700", "800"], subsets: ["latin"] });
```

- outfit : titres display, headlines
- inter : body text, labels, descriptions

## Palette de couleurs

```tsx
const COLORS = {
  primary: "#2563EB",       // Bleu Fydly
  primaryDark: "#0F172A",   // Fond dark
  primaryLight: "#DBEAFE",  // Bleu très clair
  surface: "#F8FAFC",       // Fond clair
  white: "#FFFFFF",
  success: "#059669",       // Vert
  warning: "#D97706",       // Ambre
  danger: "#DC2626",        // Rouge
  textPrimary: "#0F172A",   // Texte principal
  textSecondary: "#475569", // Texte secondaire
  textMuted: "#94A3B8",     // Texte discret
  gradient: "linear-gradient(135deg, #2563EB, #7C3AED)", // Bleu → Violet
};
```

## Structure de la vidéo — 6 scènes

Utiliser <TransitionSeries> pour enchaîner les scènes avec des transitions fade de 15 frames entre chaque.

### SCÈNE 1 — Intro / Hook (0s → 8s = 240 frames)
**Message :** "Vos clients ne reviennent pas ? On a la solution."

ANIMATIONS :
- Frame 0-30 : Fond primaryDark, logo Fydly ⚡ apparaît au centre
  - Le logo scale de 0 à 1 avec Easing.bezier(0.34, 1.56, 0.64, 1) (overshoot)
  - Glow circulaire bleu qui pulse (opacity interpolée en sinus)
- Frame 30-60 : Le logo monte vers le haut (translateY interpolé)
- Frame 60-120 : Titre apparaît en typewriter effect :
  "Vos clients ne reviennent pas ?"
  - Font outfit, 56px, blanc, centré
  - Chaque caractère apparaît via string.slice(0, visibleChars)
  - Curseur clignotant à la fin (opacity 0/1 toutes les 15 frames)
- Frame 120-180 : Sous-titre fade-in :
  "Fydly change ça." en gradient bleu→violet (en texte ou pill)
  - opacity 0→1, translateY 20→0, Easing.bezier(0.16, 1, 0.3, 1)
- Frame 180-240 : Transition vers scène 2

ÉLÉMENTS VISUELS :
- Particules/points lumineux qui flottent en arrière-plan (5-8 petits cercles blancs, opacity 10-30%, positions animées lentement via interpolation)
- Ligne de progression fine en bas (width 0% → 13% du total)

### SCÈNE 2 — Le problème (8s → 18s = 300 frames)
**Message :** "Les cartes papier, c'est fini."

ANIMATIONS :
- Frame 0-60 : Titre "Le problème" apparaît (fade-in up)
- Frame 30-150 : 4 items apparaissent en stagger (50 frames de délai entre chaque)
  Chaque item = icône + texte, slide-in depuis la droite :
  - ❌ "Cartes perdues et oubliées"
  - ❌ "Aucune donnée client"
  - ❌ "Tampons falsifiables"
  - ❌ "Impossible de relancer"
  - Chaque item : translateX de 100 à 0, opacity 0 à 1
  - Les ❌ sont des cercles rouges avec une croix blanche
- Frame 150-210 : Les items se compressent/réduisent
- Frame 210-270 : Grosse croix rouge qui s'affiche par-dessus (scale pop)
- Frame 270-300 : Fade out

FOND : surface (gris clair), items sur des cards blanches arrondies avec ombre

### SCÈNE 3 — La solution Fydly (18s → 30s = 360 frames)
**Message :** "Avec Fydly, tout change."

ANIMATIONS :
- Frame 0-45 : Fond transition vers primaryDark
  Titre display "Avec Fydly ⚡" en blanc, scale-in (0.8→1, opacity 0→1)
- Frame 45-180 : 3 étapes visuelles en séquence (45 frames chacune) :
  1. "📱 Affichez le QR Code" — illustration d'un QR code qui apparaît dans un mockup de téléphone
     - Le QR code se dessine progressivement (grille de carrés qui apparaissent en stagger)
  2. "⚡ Client scanne → Tampon" — mockup d'un téléphone avec une carte fidélité
     - Un tampon (carré bleu avec ⚡) scale-pop dans la grille
     - Animation de particules/confetti autour du tampon
  3. "🎁 Récompense débloquée !" — la carte se complète et un bandeau doré apparaît
     - Bandeau slide-in depuis le bas, glow doré
- Frame 180-300 : Les 3 étapes se réduisent et s'alignent en 3 colonnes
  - Numéros "01" "02" "03" en gros en arrière-plan (opacity 15%)
  - Chaque colonne a un titre court + icône
  - Flèches entre les colonnes (opacity fade-in)
- Frame 300-360 : Texte "Sans app à télécharger !" slide-in depuis le bas dans une pill blanche

### SCÈNE 4 — Le Dashboard (30s → 42s = 360 frames)
**Message :** "Votre business en temps réel."

ANIMATIONS :
- Frame 0-30 : Titre "Votre tableau de bord" fade-in
- Frame 30-150 : Mockup du dashboard qui se construit pièce par pièce :
  - Frame 30-50 : La sidebar slide-in depuis la gauche
  - Frame 50-70 : Le header apparaît (fade)
  - Frame 70-110 : Les 4 KPIs apparaissent un par un (stagger, scale-pop)
    - "247 clients" — compteur qui s'incrémente de 0 à 247 (chaque frame = un incrément)
    - "+47%" badge vert qui pop
  - Frame 110-150 : Le graphique se dessine (la courbe area chart qui se "draw" de gauche à droite via clipPath/width animé)
- Frame 150-240 : Zoom sur les fonctionnalités :
  - Frame 150-180 : Le QR code brille (glow pulse)
  - Frame 180-210 : Section notifications slide-in → message "Vous nous manquez !" s'écrit en typewriter
  - Frame 210-240 : Bouton "Envoyer" pulse → checkmark vert apparaît
- Frame 240-360 : Les KPIs s'animent (les chiffres augmentent) avec texte overlay "Données en temps réel"

FOND : surface (gris très clair), mockup en card blanche arrondie avec shadow

### SCÈNE 5 — Analytics & IA (42s → 50s = 240 frames)
**Message :** "L'IA travaille pour vous."

ANIMATIONS :
- Frame 0-30 : Titre "Analytics intelligents" fade-in-up
- Frame 30-90 : Heatmap animée (grille 7×6) :
  - Les cellules apparaissent en stagger (5 frames de delay)
  - Chaque cellule change de couleur (du transparent au bleu avec intensité variable)
  - La cellule "heure de pointe" pulse en bleu vif
- Frame 90-150 : Score Fydly (jauge circulaire) :
  - Le cercle SVG se remplit de 0 à 78/100 avec Easing.bezier(0.16, 1, 0.3, 1)
  - Le chiffre au centre s'incrémente de 0 à 78
  - Texte "Excellent" apparaît en fade
- Frame 150-210 : Recommandation IA slide-in :
  - Card avec icône ⚠️ et texte "3 clients vont bientôt partir"
  - Bouton "Envoyer une relance" qui pulse
- Frame 210-240 : Texte "Fydly analyse, vous agissez." centré, fade-in

FOND : alternance primaryDark / surface

### SCÈNE 6 — CTA Final (50s → 60s = 300 frames)
**Message :** "Démarrez gratuitement."

ANIMATIONS :
- Frame 0-30 : Fond gradient bleu→violet (apparition douce)
- Frame 30-90 : Logo Fydly⚡ centré, scale-pop avec glow maximal
  - Anneau lumineux qui rayonne depuis le logo (rayon en expansion)
- Frame 90-150 : Stats en ligne apparaissent en stagger :
  "7 commerces · 300+ clients · 96% satisfaction"
  - Chaque stat slide-up + fade-in, delay 20 frames
- Frame 150-210 : CTA bouton blanc apparaît
  "Essai gratuit — 30 jours →"
  - Scale 0.8→1 avec overshoot, glow blanc
- Frame 210-260 : Sous-texte fade-in :
  "Sans carte bancaire · fydly.com"
- Frame 260-300 : Le tout reste visible, le logo pulse doucement
  - Barre de progression atteint 100%

## Architecture des fichiers

```
src/
├── Root.tsx                    # Définition de la composition (1080×1920, 30fps, ~1800 frames)
├── FydlyTuto.tsx               # Composition principale avec <TransitionSeries>
├── scenes/
│   ├── IntroScene.tsx          # Scène 1 — Hook
│   ├── ProblemScene.tsx        # Scène 2 — Le problème
│   ├── SolutionScene.tsx       # Scène 3 — La solution
│   ├── DashboardScene.tsx      # Scène 4 — Le dashboard
│   ├── AnalyticsScene.tsx      # Scène 5 — Analytics & IA
│   └── CtaScene.tsx            # Scène 6 — CTA Final
├── components/
│   ├── FydlyLogo.tsx           # Logo ⚡ animé (réutilisable)
│   ├── ProgressBar.tsx         # Barre de progression en bas
│   ├── AnimatedCounter.tsx     # Compteur animé (0 → N)
│   ├── TypewriterText.tsx      # Effet typewriter
│   ├── StaggerList.tsx         # Liste d'items avec stagger
│   ├── PhoneMockup.tsx         # Mockup téléphone
│   ├── StampCard.tsx           # Carte fidélité animée
│   ├── HeatmapGrid.tsx        # Grille heatmap animée
│   ├── CircularGauge.tsx       # Jauge circulaire SVG
│   ├── KpiCard.tsx             # Card KPI avec compteur
│   └── GlowCircle.tsx         # Cercle lumineux avec glow
├── styles/
│   └── colors.ts               # Palette COLORS exportée
└── fonts.ts                    # Chargement des Google Fonts
```

## Composants réutilisables clés

### AnimatedCounter
```tsx
// Compteur qui s'incrémente de 0 à `target` sur `durationInFrames` frames
const AnimatedCounter: React.FC<{target: number; durationInFrames: number; suffix?: string}> = ({target, durationInFrames, suffix = ""}) => {
  const frame = useCurrentFrame();
  const value = Math.round(interpolate(frame, [0, durationInFrames], [0, target], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  }));
  return <span style={{fontFamily: mono, fontVariantNumeric: "tabular-nums"}}>{value}{suffix}</span>;
};
```

### TypewriterText
```tsx
// Effet typewriter — string.slice, pas opacity par caractère
const TypewriterText: React.FC<{text: string; startFrame?: number; speed?: number}> = ({text, startFrame = 0, speed = 2}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;
  if (localFrame < 0) return null;
  const visibleChars = Math.min(Math.floor(localFrame / speed), text.length);
  const showCursor = Math.floor(frame / 15) % 2 === 0;
  return (
    <span>
      {text.slice(0, visibleChars)}
      {visibleChars < text.length && <span style={{opacity: showCursor ? 1 : 0}}>|</span>}
    </span>
  );
};
```

### GlowCircle
```tsx
// Cercle lumineux qui pulse
const GlowCircle: React.FC<{color: string; size: number}> = ({color, size}) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame * 0.05), [-1, 1], [0.4, 0.8]);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, opacity: pulse,
      filter: `blur(${size * 0.4}px)`,
      position: "absolute",
    }} />
  );
};
```

## Transitions entre scènes

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

// Dans FydlyTuto.tsx :
<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={240}>
    <IntroScene />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 15 })}
  />
  <TransitionSeries.Sequence durationInFrames={300}>
    <ProblemScene />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={slide({ direction: "from-right" })}
    timing={linearTiming({ durationInFrames: 20 })}
  />
  {/* ... etc pour chaque scène */}
</TransitionSeries>
```

## Directives de style

- Tous les textes sont centrés horizontalement
- Padding safe zone : 60px en haut, 80px en bas, 48px sur les côtés
- Les cards/mockups : border-radius 24px, boxShadow "0 12px 40px rgba(0,0,0,0.08)"
- Les badges/pills : border-radius 100px, padding "6px 16px"
- Le texte display : fontWeight 800, letterSpacing -1
- Le body text : fontWeight 500, lineHeight 1.5
- Les ombres bleues : boxShadow "0 0 40px rgba(37,99,235,0.15)"
- Barre de progression en bas : height 3px, position absolute bottom 0, width animée de 0% à 100%
- Le tout doit être fluide, premium, et donner une impression de qualité Apple/Stripe

## Rendu

Pour preview : npx remotion studio
Pour render : npx remotion render FydlyTuto --codec=h264 out/fydly-tuto.mp4
```

---

## Résumé de la vidéo

| Scène | Durée | Frames | Contenu |
|-------|-------|--------|---------|
| 1. Intro | 8s | 240 | Hook + logo animé + typewriter |
| 2. Problème | 10s | 300 | Les défauts des cartes papier |
| 3. Solution | 12s | 360 | Parcours Fydly en 3 étapes |
| 4. Dashboard | 12s | 360 | Mockup dashboard interactif |
| 5. Analytics | 8s | 240 | Heatmap + Score + IA |
| 6. CTA | 10s | 300 | Logo + stats + call-to-action |
| **Total** | **~60s** | **~1800** | |

> [!IMPORTANT]
> La durée réelle sera légèrement inférieure à 1800 frames car les transitions (fade/slide de 15-20 frames) chevauchent les scènes adjacentes. Calculer la durée exacte avec `getDurationInFrames()` sur chaque timing.

> [!TIP]
> Pour ajouter une voix-off, utiliser le composant `<Audio>` de `@remotion/media` avec un fichier MP3 narré, synchronisé avec les séquences. Voir `rules/voiceover.md` dans le skill Remotion pour la génération TTS.
