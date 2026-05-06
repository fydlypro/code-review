# Redesign — Merchant Billing & Support

**Pages actuelles :** `merchant/BillingPage.tsx` · `merchant/SupportPage.tsx`

---

```
[INCLURE LE DESIGN SYSTEM V2]

Redesigne les pages Facturation et Support du merchant Fydly.

FORMAT : Desktop (1440×900) + Mobile (375×812)

---

## PAGE FACTURATION

### Header
- Icône CreditCard dans carré gradient bleu→violet
- Titre display : "Facturation"
- Sous-titre : "Gérez votre abonnement et vos paiements."

### Card Plan actuel
- Card premium, border gradient subtil (bleu→violet, 1px)
- Layout 2 colonnes :
  - GAUCHE :
    - Badge plan : "PRO" (pill bg-blue-600, text white, uppercase tracking-widest)
    - Prix : "59,99€" display 40px + "/mois" caption
    - Status : pill verte "Actif" ou pill amber "Essai gratuit — X jours restants"
    - Date prochain renouvellement
  - DROITE :
    - Bouton "Changer de plan" (secondary)
    - Bouton "Annuler l'abonnement" (ghost red, petit)

### Section Features incluses
- Grille 2×3 de mini-cards (icône + label) :
  - ✓ Clients illimités
  - ✓ Notifications push illimitées
  - ✓ Analytics complets + IA
  - ✓ Segmentation clients
  - ✓ Support email sous 48h
  - ✓ Anti-fraude natif
- Chaque item : icône CheckCircle blue + texte

### Historique des paiements
- Table simple :
  - Colonnes : Date · Montant · Statut · Facture
  - Statut : pill verte "Payé" ou pill red "Échoué"
  - Facture : lien "Télécharger PDF" (icône Download)
- Mobile : cards compactes au lieu de table

### Méthode de paiement
- Card avec icône carte (Visa/Mastercard)
- "**** **** **** 4242" en mono
- Bouton "Modifier" (ghost)
- Powered by Stripe badge en bas

---

## PAGE SUPPORT MERCHANT

### Header
- Icône LifeBuoy dans carré blue-50
- Titre display : "Support"
- Sous-titre : "On est là pour vous aider."

### Quick Actions (3 cards)
1. "📧 Envoyer un email" → mailto:support@fydly.com
2. "💬 WhatsApp" → lien direct (plan Business)
3. "📖 Guide d'utilisation" → lien vers docs

### FAQ Merchant (accordion)
- 5-7 questions pertinentes :
  - "Comment afficher mon QR Code ?"
  - "Comment envoyer une notification push ?"
  - "Comment modifier ma récompense ?"
  - "Que se passe-t-il si un client perd son compte ?"
  - "Comment fonctionne l'anti-fraude ?"
  - "Comment exporter ma liste clients ?"
  - "Comment annuler mon abonnement ?"
- Design accordion : border-bottom, chevron qui rotate, contenu en slide-down
- Réponses avec des liens inline vers les pages concernées

### Formulaire de contact (optionnel)
- Card : "Votre message"
  - Input sujet
  - Textarea message (4 lignes)
  - CTA "Envoyer →"
  - "Réponse sous 48h" en caption

### Footer
- "Fydly v2.0 · Fait pour le commerce local · © 2026"
```
