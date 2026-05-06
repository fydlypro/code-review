# Redesign — Merchant Notifications (Campagnes)

**Page actuelle :** `merchant/NotificationsPage.tsx`

---

```
[INCLURE LE DESIGN SYSTEM V2]

Redesigne la page Campagnes/Notifications du merchant Fydly. C'est l'historique des communications push — elle doit montrer la performance et encourager à envoyer plus.

FORMAT : Desktop (1440×900) + Mobile (375×812)

## HEADER
- Icône Radio dans carré gradient bleu→violet + shadow glow
- Titre display : "Campagnes"
- Sous-titre : "Historique et performance de vos communications push."
- À droite : bouton "✏️ Nouvelle campagne" (primary, glow) → ouvre le composer

## STATS ROW (3 cards)
- Design : cards compactes, border subtle, shadow-sm
1. **Total campagnes** — icône Bell, chiffre display
2. **Envoyées avec succès** — icône CheckCircle vert, chiffre
3. **Destinataires total** — icône Users blue, chiffre cumulé
- Hover : shadow-md, translateY -1px

## COMPOSER (modale ou section expandable)
- Quand "Nouvelle campagne" est cliqué :
  - Desktop : modale centrée avec backdrop blur
  - Mobile : bottom sheet full-height
- Header : icône Sparkles blue + "Envoyer un message" + "Notification push"
- Textarea : 4 lignes, border 2px, focus blue ring
  - Placeholder : "Écrivez votre message ici…"
  - Character counter animé : barre de progression sous le textarea
  - Couleurs : bleu (0-99) → amber (100-129) → rouge (130-140)
  - Affichage : "X/140" en mono
- Segment selector :
  - 3 boutons radio stylisés en cards :
    - "👥 Tous les clients" — sélection par défaut
    - "🟢 Clients actifs" — avec count
    - "🟠 Clients inactifs" — avec count
  - Card sélectionnée : border blue, bg blue-50, check mark
- Preview : mini notification mockup qui se met à jour en temps réel
  - "Comme une vraie notification push sur un téléphone"
  - iPhone notification card : icône Fydly⚡, "Commerce", message, "maintenant"
- Actions : "Annuler" (secondary) + "📤 Envoyer" (primary, avec loading spinner)

## HISTORIQUE (table/timeline)
- Toolbar : search input + count résultats
- Desktop : table avec colonnes :
  - **Message** : card avec border-left 2px blue, texte italique entre guillemets
  - **Audience** : emoji segment + label + "X destinataires" en caption
  - **Statut** : pill colorée :
    - ✅ Envoyé : bg-green-50, text-green-700
    - ⏳ En cours : bg-amber-50, text-amber-700
    - ❌ Échec : bg-red-50, text-red-700
  - **Date** : date bold + heure en pill caption
  - Row hover : bg-slate-50/50

- Mobile : timeline verticale
  - Ligne continue à gauche
  - Dot coloré selon statut (vert/orange/rouge)
  - Pour chaque entrée :
    - Date + heure en caption uppercase
    - Message dans bulle (bg-slate-50, border, italique)
    - Ligne de meta : pill statut + emoji segment + "X dest."

- Footer : "X campagnes enregistrées" + "✅ Services opérationnels" (vert)

## ÉTAT VIDE
- Illustration : icône Megaphone géante dans cercle slate-50
- Titre : "Aucune campagne"
- Texte : "Envoyez votre première notification push !"
- CTA : "Créer ma première campagne →" (primary)

ANIMATIONS :
- Les stats count-up au premier affichage
- Le composer slide-up (mobile) ou scale-in (desktop)
- La preview notification a un bounce subtil quand le message change
- Nouvelle campagne envoyée : success toast + la timeline se met à jour en temps réel
```
