# Redesign — Customer Scan Page

**Page actuelle :** `customer/ScanPage.tsx`

---

```
[INCLURE LE DESIGN SYSTEM V2]

Redesigne la page Scanner du client Fydly. C'est l'écran le plus immersif — plein écran caméra, UI minimale mais premium.

FORMAT : Mobile-first (375×812) — cette page est presque exclusivement mobile.

CONCEPT : Expérience scanner immersive, cinématique, inspirée par l'app Caméra d'Apple et les scanners de paiement mobile.

## ÉTAT : SCANNER ACTIF

### Fond
- Vidéo caméra en plein écran (object-cover), absolument aucune marge
- Canvas caché pour la détection jsQR

### Overlay sombre
- Zones autour du cadre central : fond noir/60% semi-transparent
- Le "trou" central est net — tout le reste est assombri
- Transition fluide entre les zones (pas de bords durs)

### Cadre de scan (centré)
- Carré 280×280px
- 4 coins en L stylisés : stroke blanc 3px, border-radius 20px, longueur 48px
- Drop shadow bleue sur les coins (0 0 12px rgba(96,165,250,0.8))
- Ligne de scan animée : gradient horizontal (transparent → blue-400 → transparent)
  - Animation : translate-y de haut en bas en boucle, 2s linear
  - Shadow glow bleue (0 0 20px rgba(96,165,250,1))
- Fond subtil : légère grille de points en filigrane dans le cadre (opacity 5%)

### Header flottant (haut)
- Safe area padding (env(safe-area-inset-top) + 20px)
- 3 éléments en flex justify-between :
  - Bouton retour : cercle 44px, bg-black/30, backdrop-blur-xl, border white/15, icône ChevronLeft
  - Badge central : pill "SCANNER" (bg-black/30, backdrop-blur, icône ScanLine + texte uppercase tracking-widest)
  - Bouton torche (si disponible) : cercle 44px, même style
    - Torche active : bg-amber-400, border-amber-300, icône Zap filled amber-900
    - Torche inactive : bg-black/30, icône Zap white

### Instructions (bas)
- Safe area padding (env(safe-area-inset-bottom) + 40px)
- Titre display 24px blanc : "Pointez vers le QR Code"
- Sous-titre white/60% 14px : "Placez le code dans le cadre — le tampon s'ajoute automatiquement"
- Si caméra pas encore prête : pill loading "Activation caméra…" (bg-white/10, spinner, backdrop-blur)

## ÉTAT : TRAITEMENT EN COURS
- Fond : gradient bleu foncé (blue-800) immersif
- Blob lumineux central (blue-500/20, blur-3xl)
- Card blanche centrée (max-width 360px, border-radius 28px, shadow-2xl) :
  - Spinner double : cercle principal (border-4 blue-500 + border-t transparent, spin) + cercle extérieur pointillé (spin inverse, 8s)
  - Titre display 24px : "Validation en cours…"
  - Sous-titre : "On enregistre votre tampon !"
  - 3 dots bounce en dessous (delay stagger 150ms)
- L'ensemble a une animation fade-in douce

## ÉTAT : ERREUR
- Fond : slate-50
- Card blanche centrée (border-radius 28px, shadow-xl) :
  - Cercle rouge-50 (80px) avec icône AlertCircle rouge-400 (36px)
  - Titre display : "Un problème est survenu"
  - Message d'erreur en text slate-600, 14px, leading-relaxed
  - Boutons :
    - Si connecté : "Voir ma carte" (primary) + "Réessayer le scan" (text link)
    - Si non connecté : "Réessayer" (primary)
  - Les boutons font 52px height

## ÉTAT : SUCCÈS (transition)
- Flash blanc rapide (100ms) quand le QR est détecté
- Vibration haptic (navigator.vibrate si disponible)
- Redirect immédiat vers /customer/card?new_stamp=true

TOUCHES PREMIUM :
- Le cadre de scan a un effet "breathing" très subtil (scale 1.0 → 1.01 → 1.0, 3s)
- Les coins L du cadre ont une animation de rotation très lente (360° en 30s)
- Le bouton torche a un feedback visuel immédiat (background change en <50ms)
- En mode paysage (tablette) : le layout s'adapte, le cadre reste centré
```
