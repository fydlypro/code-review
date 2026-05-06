# Redesign — Customer History & Settings

**Pages actuelles :** `customer/HistoryPage.tsx` · `customer/SettingsPage.tsx` · `customer/SupportPage.tsx`

---

```
[INCLURE LE DESIGN SYSTEM V2]

Redesigne les pages secondaires du client Fydly : Historique, Paramètres et Support.

FORMAT : Mobile-first (375×812) + Desktop (max-width 480px centré)

---

## PAGE HISTORIQUE

### Header
- Bouton retour (ChevronLeft) + titre "Mes visites"
- Badge avec le total : "X visites" en pill slate-100

### Filtres
- Segment control : "Toutes" · "Tampons" · "Récompenses"
- Actif : bg-slate-900 text-white, inactif : text-slate-500 hover bg-slate-50
- Filtre par commerçant si multi-cartes : pills avec noms des commerces

### Timeline
- Ligne verticale continue à gauche (2px, slate-100)
- Chaque entrée :
  - Dot sur la ligne : bleu (earn) ou doré (redeem)
  - Card compacte :
    - Nom du commerce en bold 14px
    - Type : "⚡ Tampon gagné" (pill blue-50) ou "🎁 Récompense validée" (pill amber-50)
    - Date + heure en caption slate-400
    - Séparateur si changement de jour : "Aujourd'hui" · "Hier" · date
- Hover : bg-slate-50/50
- Infinite scroll ou "Charger plus"

### État vide
- Icône History dans cercle slate-50
- "Aucune visite pour l'instant"
- CTA "Scanner un QR Code →"

---

## PAGE PARAMÈTRES CLIENT

### Header
- Titre : "Mon compte"
- Avatar initiales large (56px) avec nom + email en dessous

### Section Profil
- Card avec :
  - Input Prénom (modifiable)
  - Input Email (disabled, grisé)
  - Téléphone (optionnel)
- CTA : "Enregistrer" (primary)

### Section Notifications
- Toggle : "Recevoir les notifications push"
  - Switch 56×32px, blue-600 quand actif
  - Description : "Soyez prévenu quand vous gagnez une récompense."

### Section Données
- Card avec :
  - "Mes données" : lien vers export RGPD
  - "Politique de confidentialité" : lien externe
  - "Conditions d'utilisation" : lien externe

### Danger Zone
- Card border red-200 :
  - "Supprimer mon compte" avec icône Trash2
  - Texte d'avertissement
  - Bouton red : "Supprimer" → confirmation modale

### Déconnexion
- Bouton full-width, ghost, text-red-500 : "Se déconnecter"

---

## PAGE SUPPORT CLIENT

### Header
- Titre : "Aide & Support"
- Icône HelpCircle dans carré blue-50

### FAQ rapide
- Accordion (3-5 questions) :
  - "Comment gagner des tampons ?"
  - "Où trouver ma récompense ?"
  - "Comment activer les notifications ?"
  - "Mes données sont-elles protégées ?"
- Chaque item : icône chevron qui rotate à l'ouverture, animation slide-down du contenu

### Contact
- Card : "Besoin d'aide ?"
  - "Envoyez-nous un email" → mailto:support@fydly.com
  - Bouton "Envoyer un email" (primary, icône Mail)
  - Temps de réponse : "Réponse sous 48h" en caption

### Version
- "Fydly v2.0 — Fait avec ❤️ pour le commerce local"
- En tiny caption tout en bas

ANIMATIONS :
- Accordion : smooth slide-down avec spring easing
- Timeline : entries en stagger fade-in-up
- Toggle : knob bounce + color transition 200ms
- Page transitions : fade cross
```
