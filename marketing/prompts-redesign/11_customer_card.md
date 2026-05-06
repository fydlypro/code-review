# Redesign — Customer Card & Reward

**Page actuelle :** `customer/CardPage.tsx`

---

```
[INCLURE LE DESIGN SYSTEM V2]

Redesigne la page Carte de fidélité du client Fydly. C'est l'écran principal du client — il doit être satisfaisant visuellement, gamifié et donner envie de revenir.

FORMAT : Mobile-first (375×812) + Desktop (max-width 480px centré)

CONCEPT : Une expérience type "wallet" premium. La carte de fidélité est l'élément central, avec des micro-animations et un système de récompense gamifié.

## BANNER NOTIFICATIONS (conditionnelle)
- Si les notifications ne sont pas activées :
  - Card compacte bg-slate-900, border-radius 16px, padding 12px 16px
  - Icône Bell dans carré blue-500 (36px), shadow blue glow
  - "Activez les notifications" bold white 14px
  - "Recevez vos récompenses en temps réel" caption white/60%
  - Bouton "Activer" (pill blue-500, text white, 12px bold)
  - Bouton X pour dismiss (white/40%)
  - Animation : slide-down à l'apparition (après 4s delay)

## ONGLETS COMMERÇANTS (si multi-cartes)
- Scroll horizontal, snap scroll
- Chaque tab : pill 44px height, border-radius 14px
  - Actif : bg-slate-900, text white, shadow-md, border 2px slate-900
  - Inactif : bg-white, border 2px slate-200, text slate-700
- Bouton "Scanner" toujours visible à droite :
  - Pill gradient bleu→violet, icône QrCode, text white, shadow glow
  - Animation : pulse subtil en continu

## ANIMATION "+1 TAMPON" (quand new_stamp=true)
- Card pleine largeur, gradient bleu→violet, border-radius 16px
- "🎉 +1 Tampon !" en display 24px white
- "Bien joué, continuez !" en white/80%
- Animation : bounce-in + confetti canvas en arrière-plan
- Disparaît automatiquement après 5s (fade-out)

## CARTE DE FIDÉLITÉ (élément principal)
- Card premium full-width :
  - Border-radius 24px
  - Fond : gradient subtil white → blue-50/30
  - Border : 1px slate-100, hover shadow-lg
  - Padding généreux (24px)

### Header de la carte
  - Ligne 1 : "CARTE FIDÉLITÉ" en caption 10px uppercase tracking-widest, slate-400
  - Ligne 2 : nom du commerce en display 24px slate-900
  - À droite : compteur dans un carré arrondi 48px, bg-blue-600, text white, display 20px
  - Secteur du commerce en tiny badge si disponible

### Grille de tampons
  - 5 colonnes, gap 10px
  - Chaque cellule : aspect-square, border-radius 14px
  - Tampon obtenu :
    - Fond gradient bleu (blue-500 → blue-600)
    - Icône ⚡ (Zap) blanche, shadow blue glow
    - Le dernier tampon obtenu a une animation pulse (2s, une fois)
  - Tampon vide :
    - Fond white, border 2px dashed slate-200
    - Hover/tap : border slate-300 (suggestion visuelle)
  - Si le dernier tampon vient d'être ajouté (new_stamp) :
    - Animation scale-pop : scale 0 → 1.2 → 1 avec bounce
    - Ring blue glow pendant 2s
    - Micro confetti autour du tampon

### Barre de progression
  - Height 8px, border-radius full
  - Track : slate-100
  - Fill : gradient blue-400 → blue-600
  - Si >= 80% : le fill a un shimmer animation (highlight qui se déplace)
  - Label en dessous : "Plus que X tampons pour votre récompense !" en 12px slate-500

### Récompense
  - Bandeau en bas de la carte
  - Icône Star filled blue + "Récompense : {description}" en 13px semi-bold blue-700
  - Fond blue-50, border-radius 14px, padding 12px

## BOUTON RÉCOMPENSE (si disponible)
- Card cliquable, bg-slate-900, border-radius 16px, padding 20px
- Gradient mesh subtil (bleu/violet) en arrière-plan
- Icône 🎁 dans carré glass (48px), hover scale 1.1
- "🎁 Votre récompense est prête !" bold white 16px
- "Appuyez pour afficher votre cadeau" caption white/60%
- Icône Sparkles à droite, opacity 60% → 100% au hover
- Animation : glow pulse subtil en continu
- Tap : ouvre l'écran récompense

## ÉCRAN RÉCOMPENSE (overlay full-screen)
- Backdrop : bg-black/60, backdrop-blur-xl
- Card centrée, bg-white, border-radius 32px, shadow-2xl
- Layout vertical centré :
  - Cercle doré/gradient (96px) avec icône Gift (48px)
  - Confetti animation en arrière-plan
  - Titre display 28px : "Félicitations ! 🎉"
  - Description de la récompense en display 20px blue-600
  - QR Code de la récompense (200px, avec logo Fydly⚡ au centre)
  - "Montrez ce QR Code au commerçant" en caption slate-500
  - Date d'expiration en pill warning si bientôt
  - Bouton "Fermer" (ghost, full-width)
- Animation d'entrée : scale 0.9 → 1 + fade-in

## LIEN HISTORIQUE
- "Voir mes visites →" en text link blue-600, centré, 14px semi-bold
- Hover : underline

## ÉTAT VIDE (aucune carte)
- Centré verticalement
- Cercle 96px bg-blue-50, icône Sparkles blue-500 (48px)
- Titre display 28px : "Prêts pour vos premiers tampons ?"
- Sous-titre 14px : "Scannez le QR code chez votre commerçant."
- CTA : "Scanner maintenant" (primary, 52px, icône Scan, shadow glow)

RESPONSIVE DESKTOP :
- Max-width 480px, centré horizontalement
- Optionnel : fond slate-50 avec la card "flottante" au milieu
```
