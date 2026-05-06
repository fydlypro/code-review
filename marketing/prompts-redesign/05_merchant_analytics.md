# Redesign — Merchant Analytics

**Page actuelle :** `merchant/AnalyticsPage.tsx`

---

```
[INCLURE LE DESIGN SYSTEM V2]

Redesigne la page Analytics du merchant Fydly. C'est la page la plus data-rich — elle doit transformer des données brutes en insights actionnables, façon Linear/Stripe.

FORMAT : Desktop (1440×900) + Mobile (375×812)

## HEADER
- Titre display : "Statistiques" + icône TrendingUp dans carré gradient
- Sous-titre avec date du jour
- À droite : bouton "Actualiser" (ghost) + filtre temporel (7j · 30j · 3m) en segment control glass
- Navigation par ancres : tabs horizontaux scrollables — "Vue d'ensemble" · "Fréquentation" · "Horaires" · "Score Fydly" · "Recommandations"
- Tab actif : fond slate-900, text white, shadow-sm
- Tabs inactifs : text-slate-500, hover bg-slate-50

## SECTION 1 — KPIs AVANCÉS (grille 4 colonnes)
4 cards premium, chacune avec une couleur d'accent unique :
1. **Nouveaux clients** (accent blue)
   - Chiffre display 40px (JetBrains Mono)
   - Variation badge : "+X%" vert avec TrendingUp ou "-X%" rouge avec TrendingDown
   - Mini bar chart (5 barres) en arrière-plan, opacity 15%
   - Ligne de contexte : "Nouveaux membres ce mois."
   
2. **Taux de fidélité** (accent emerald)
   - Pourcentage display + micro circular progress (32px) à côté du chiffre
   - Texte contextuel dynamique selon le score
   
3. **Passages ce mois** (accent violet)
   - Chiffre + variation vs mois précédent
   
4. **Récompenses offertes** (accent amber)
   - Chiffre + texte "clients récompensés"

- Design : border-left 3px accent, hover: shadow-lg + translateY(-2px)
- Mobile : grille 2×2, cards compactes

## SECTION 2 — GRAPHIQUE DE FRÉQUENTATION
- Card pleine largeur
- Header : "Comment évolue votre fréquentation ?" + badge total visites
- Filtre temporel en segment control (7j · 30j · 3m) à droite du header
- Graphique : Area Chart avec :
  - Gradient fill : du bleu-500/20 au transparent
  - Ligne stroke 3px bleu-500
  - Points : invisibles par défaut, apparaissent au hover (rayon 7px, blanc avec border bleu)
  - Grille : lignes horizontales seulement, pointillées, slate-100
  - Axe X : dates en caption, rotate 0°
  - Axe Y : valeurs entières
  - Tooltip custom : card arrondie avec shadow-lg, montre "date · X visites"
- En dessous du graphique : insight card contextuelle
  - Si hausse : fond emerald-50, icône 📈, "Vos visites sont en hausse ! Bonne dynamique."
  - Si stable : fond slate-50, icône 📊, "Fréquentation stable."
  - Si baisse : fond red-50, icône 📉, "Baisse détectée" + CTA "Envoyer une relance"
- État vide : illustration SVG (barres fantômes) + texte "Les données apparaîtront ici."

## SECTION 3 — HEATMAP HORAIRE
- Card pleine largeur
- Header : "Quand vos clients viennent-ils ?" + sous-titre "Intensité par jour et créneau"
- Grille : 7 colonnes (Lun→Dim) × 6 lignes (8h-10h → 18h-20h)
- Chaque cellule : carré arrondi (12px), couleur selon l'intensité
  - 0 : slate-50
  - 1-3 : blue-100
  - 4-7 : blue-300
  - 8-12 : blue-500
  - 13+ : blue-800 (text white)
- Hover sur une cellule : scale 1.15, tooltip "Lundi 10h-12h : X visites"
- Légende en bas : gradient de couleurs avec labels
- Insights cards (2 colonnes) :
  - "🔥 Heure de pointe" — jour + créneau + fond amber-50
  - "🌙 Créneau calme" — jour + créneau + fond slate-50 + CTA "Créer une promo"
- Mobile : la grille scroll horizontalement, headers sticky

## SECTION 4 — SCORE FYDLY
- Layout 2 colonnes : jauge à gauche, détail à droite
- GAUCHE : Jauge circulaire grand format
  - SVG circle : rayon 90px, stroke-width 16px
  - Background track : slate-100
  - Progress arc : couleur dynamique (bleu ≥71, amber ≥41, red <41)
  - Animation : dashoffset transition 1.5s cubic-bezier
  - Centre : score display 48px + "/100" caption + label (Excellent/Bien/À améliorer)
  - Anneau décoratif extérieur en pointillés (opacity 20%)
- DROITE : Breakdown du score
  - 4 barres de progression avec labels :
    - "Taux de retour" (sur 40 pts) — emerald
    - "Croissance" (sur 20 pts) — blue
    - "Engagement notifs" (sur 20 pts) — violet
    - "Récompenses" (sur 20 pts) — amber
  - Chaque barre : height 8px, border-radius full, fond slate-100
  - Message contextuel dynamique selon le score total
- Mobile : stack vertical, jauge centrée au-dessus du breakdown

## SECTION 5 — RECOMMANDATIONS IA
- Header : "💡 Recommandations personnalisées"
- Cards empilées (max 3) avec design distinctif :
  - Recommandation urgente : border-left 3px red, fond red-50/30, icône ⚠️
  - Recommandation normale : border-left 3px blue, fond white
  - Chaque card : emoji + titre bold + texte 2 lignes + CTA bouton ("Envoyer une relance", "Créer une promo")
  - Le CTA ouvre une modale de composition de notification pré-remplie
- État "peu de données" : card illustration + "Vos recommandations arrivent bientôt !"
- Mobile : cards pleine largeur, CTA pleine largeur

## MODALE NOTIFICATION RAPIDE
- Bottom sheet sur mobile, modale centrée sur desktop
- Glass effect : bg-white, border-radius 28px, shadow-xl
- Header : icône Sparkles dans cercle blue + "Envoyer un message" + subtitle
- Textarea avec placeholder, maxLength 140
- Barre de progression caractères (bleu→amber→rouge)
- Boutons : "Annuler" (secondary) + "Envoyer →" (primary)
- Loading state : spinner dans le bouton

ANIMATIONS :
- Chiffres KPI : count-up animation au premier affichage
- Graphique : draw animation de la ligne (stroke-dashoffset)
- Heatmap : cells apparaissent en stagger (20ms delay chacune)
- Score : la jauge s'anime de 0 au score réel
- Recommandations : fade-in-up stagger
```
