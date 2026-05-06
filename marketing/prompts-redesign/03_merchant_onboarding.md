# Redesign — Merchant Onboarding

**Page actuelle :** `merchant/OnboardingPage.tsx`

---

```
[INCLURE LE DESIGN SYSTEM V2]

Redesigne la page d'Onboarding merchant de Fydly. C'est la première expérience du commerçant après inscription — elle doit être magique, guidée et rassurante.

FORMAT : Desktop (1440×900) + Mobile (375×812)

CONCEPT : Un wizard full-screen en 3 étapes (au lieu de 2) avec un aperçu live de la carte client qui évolue en temps réel.

## BARRE DE PROGRESSION (fixe en haut)
- Barre fine (3px) qui se remplit progressivement avec gradient bleu→violet
- En dessous : 3 étapes avec icônes + labels (Store · Star · Rocket)
- Étape active : icône dans cercle blue filled, label bold
- Étape complétée : cercle vert avec check ✓
- Étape future : cercle slate-200, label muted
- Connectées par des lignes qui se colorent progressivement
- En haut à droite : bouton "Déconnexion" discret (ghost, slate-400)

## ÉTAPE 1 — "Votre commerce" (nouveau)
- Layout : formulaire à gauche (55%), illustration à droite (45%)
- Titre display 40px : "Présentez votre commerce"
- Sous-titre : "Ces informations seront visibles par vos clients."
- Champs :
  - Nom du commerce (input 56px height, placeholder "Ex: Boulangerie Martin")
  - Secteur d'activité (select custom avec icônes par secteur : 🥐 Boulangerie, ☕ Café, 💇 Coiffeur, 🍕 Restaurant, 👗 Boutique, ✨ Autre)
  - Zone de drop pour le logo (drag & drop area avec icône Upload, texte "Glissez votre logo ici ou cliquez pour choisir", format "PNG/JPG · 512×512 recommandé")
- ILLUSTRATION DROITE : 
  - Preview live d'une "mini storefront card" qui se met à jour en temps réel quand l'utilisateur tape le nom
  - La card montre : avatar initiales (dynamique), nom du commerce (dynamique), secteur avec emoji
  - Fond gradient mesh subtil derrière la preview
- CTA : "Continuer →" (primary, 56px, full-width sur mobile)

## ÉTAPE 2 — "Votre programme"
- Layout : formulaire à gauche, aperçu téléphone à droite
- Titre : "Définissez votre récompense"
- Sous-titre : "Quel cadeau ferez-vous à vos clients les plus fidèles ?"
- Champs :
  - Sélecteur de type : 2 cards (Tampons ✓ sélectionné / Points 🔒 bientôt)
  - Compteur de tampons : design slider + input hybride
    - Slider horizontal (8 → 2 min, 20 max) avec bulles de valeur
    - OU input numérique géant au centre (font display 64px)
    - Boutons -/+ de chaque côté (cercles 48px)
    - Label en dessous : "visites avant récompense"
    - Suggestion : "💡 La moyenne recommandée est 10 tampons"
  - Description récompense (input avec emoji picker intégré à gauche)
    - Placeholder : "Ex: 1 café offert ☕, -20% sur votre achat..."
    - Compteur de caractères animé (barre + chiffre)
- APERÇU DROITE :
  - iPhone frame (notch, rounded corners, shadow-xl)
  - À l'intérieur : carte de fidélité client mise à jour en temps réel
    - Header : nom du commerce + avatar
    - Grille de tampons (5 colonnes, dynamique selon le threshold)
    - 3 tampons remplis (⚡ bleus), le reste en pointillés
    - Barre de progression "3/X tampons"
    - Bandeau récompense en bas : "{description}" sur fond dark
  - Le phone a un léger rotate 3D (perspective, rotateY -5deg)
  - Pastille "Mode aperçu" en dessous

## ÉTAPE 3 — "Vous êtes prêt !" (nouveau)
- Full-screen celebration
- Animation d'arrivée : confetti burst + scale-up du contenu
- Icône : 🚀 dans un cercle géant avec glow gradient
- Titre display : "Votre programme est prêt !"
- Sous-titre : "Votre QR Code a été généré. Affichez-le en caisse et commencez dès maintenant."
- Récapitulatif dans une card glass :
  - Nom du commerce
  - Récompense : "X tampons → {description}"
  - QR Code preview (miniature, blurred pour teasing)
- CTA géant : "Accéder à mon Dashboard →" (gradient bleu→violet, glow, 60px)
- CTA secondaire : "Imprimer mon QR Code" (ghost)
- En dessous : "Besoin d'aide ? On est là → support@fydly.com"

ANIMATIONS :
- Transition entre étapes : slide-left avec crossfade (300ms ease-out)
- Les inputs ont des micro-animations de validation (shake si erreur, bounce si OK)
- Le compteur de tampons fait un "pop" satisfaisant à chaque changement
- L'aperçu téléphone se met à jour avec une transition fluide (morph)
- Étape 3 : confetti canvas-confetti + fade-in stagger sur chaque élément
```
