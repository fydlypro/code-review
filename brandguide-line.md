# Fydly — Brand Guidelines v1.0

> Document de référence pour l'identité visuelle et éditoriale de Fydly.  
> À utiliser pour tout développement, design ou communication.

---

## 01 — Essence de la marque

### Mission
Fydly est la solution de fidélité digitale conçue pour les commerçants indépendants qui veulent offrir à leurs clients une expérience moderne — sans la complexité ni les coûts des grandes enseignes.

### Positionnement
**Pour** les commerçants indépendants (restaurants, boulangeries, coiffeurs, boutiques)  
**Qui veulent** fidéliser leurs clients sans matériel ni application complexe  
**Fydly est** une PWA SaaS B2B de fidélité digitale par QR code  
**Qui permet** de créer un programme de tampons/points en 10 minutes  
**Contrairement à** Boomerangme ou Loopy Loyalty  
**Fydly est** accessible, local, humain et connecté en temps réel

### Valeurs fondamentales

| Valeur | Description |
|---|---|
| ⚡ Simplicité radicale | Un QR code. Un scan. Un tampon. Pas d'app, pas de matériel. |
| 🤝 Proximité humaine | Ton chaleureux, direct, toujours du côté du commerçant. |
| 📊 Intelligence actionnable | Chaque donnée mène à une recommandation concrète. |
| 🔒 Confiance & sécurité | RGPD, données EU, anti-fraude intégré. |
| 🚀 Croissance partagée | Les plans évoluent avec le commerçant. |

### Personnalité de la marque
- **Chaleureux** mais pas désinvolte
- **Simple** mais pas basique
- **Moderne** mais pas froid
- **Local** mais pas limité

---

## 02 — Logo

### Construction
Le logo Fydly est composé du nom en **DM Serif Display** suivi d'un **point bleu**. Ce point représente le scan, le tampon, le moment de contact entre le client et le commerce.

```
Fydly·
```

Le point ne doit jamais être séparé du nom. Il est toujours en `#2196F3` sur fond clair, blanc sur fond coloré.

### Variantes autorisées

| Variante | Fond | Couleur texte | Couleur point |
|---|---|---|---|
| Principale | Blanc / #E3F2FD | #0D47A1 | #2196F3 |
| Inversée | #2196F3 | #FFFFFF | rgba(255,255,255,0.8) |
| Sombre | #0D47A1 | #FFFFFF | #42A5F5 |

### Règles d'usage du logo

✅ **Autorisé**
- Utiliser DM Serif Display uniquement
- Respecter les variantes définies ci-dessus
- Conserver le point bleu en toutes circonstances
- Zone d'exclusion minimale = hauteur de la lettre F autour du logo

❌ **Interdit**
- Changer la police du logo
- Appliquer un gradient sur le logo
- Supprimer le point
- Déformer les proportions
- Utiliser le logo sur un fond qui crée un mauvais contraste
- Écrire "fydly" en minuscules ou "FYDLY" en majuscules

---

## 03 — Couleurs

### Palette principale — Bleu Fydly

La palette est construite autour d'un bleu unique décliné en 10 nuances. Jamais de rouge, jamais de vert en usage primaire.

| Token | Hex | Nom | Usage |
|---|---|---|---|
| `blue-50` | `#E3F2FD` | Blue 50 | Fond de page, backgrounds |
| `blue-100` | `#BBDEFB` | Blue 100 | Bordures légères, hover states |
| `blue-200` | `#90CAF9` | Blue 200 | Bordures, séparateurs |
| `blue-300` | `#64B5F6` | Blue 300 | Icônes secondaires |
| `blue-400` | `#42A5F5` | Blue 400 | Accents, labels |
| `blue-500` | `#2196F3` | **Blue 500 ★** | **Boutons CTA, liens, actions** |
| `blue-600` | `#1E88E5` | Blue 600 | Hover des boutons |
| `blue-700` | `#1976D2` | Blue 700 | Textes secondaires |
| `blue-800` | `#1565C0` | Blue 800 | Textes courants |
| `blue-900` | `#0D47A1` | Blue 900 | Titres, fond sombre |

### Couleurs fonctionnelles

| Rôle | Hex | Contexte |
|---|---|---|
| Fond de page | `#E3F2FD` | Toutes les pages |
| Cards | `#FFFFFF` | Panneaux, cards |
| CTA principal | `#2196F3` | Boutons d'action |
| Titre H1/H2 | `#0D47A1` | Titres principaux |
| Texte corps | `#1565C0` | Paragraphes, descriptions |
| Texte secondaire | `#1976D2` | Sous-titres, labels |
| Fond scanner | `#1976D2` | Seul fond sombre autorisé |
| Succès | `#2E7D32` sur `#E8F5E9` | Validations, confirmations |
| Avertissement | `#E65100` sur `#FFF3E0` | Inactifs, expirations proches |
| Erreur | `#C62828` sur `#FFEBEE` | Erreurs, expirations |

### Ombres

```css
/* Card standard */
box-shadow: 0 2px 12px rgba(25, 118, 210, 0.10);

/* Card hover */
box-shadow: 0 4px 20px rgba(25, 118, 210, 0.18);

/* Modal */
box-shadow: 0 8px 40px rgba(25, 118, 210, 0.20);

/* Focus input */
box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.15);
```

---

## 04 — Typographie

### Familles de polices

```
Display  : DM Serif Display — titres d'impact, logo, couvertures
Interface: DM Sans — tout le reste (corps, labels, boutons, UI)
Mono     : DM Mono — codes, tokens, données techniques
```

Import Google Fonts :
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&family=DM+Mono&display=swap" rel="stylesheet">
```

### Échelle typographique

| Nom | Police | Taille | Poids | Line-height | Usage |
|---|---|---|---|---|---|
| Display | DM Serif Display | 64–120px | Regular | 1.0 | Logo, covers |
| H1 | DM Sans | 32–48px | 700 | 1.2 | Titres de page |
| H2 | DM Sans | 20–28px | 600 | 1.3 | Sous-titres de section |
| H3 | DM Sans | 16–20px | 600 | 1.4 | Titres de card |
| Body | DM Sans | 15–17px | 400 | 1.7 | Texte courant |
| Small | DM Sans | 13–14px | 400 | 1.6 | Métadonnées, aides |
| Label | DM Sans | 10–12px | 500 | — | Uppercase, letter-spacing 2px |
| Mono | DM Mono | 12–14px | 400 | 1.5 | Codes, hex, tokens |

### Règles typographiques

✅ **À faire**
- Toujours DM Serif Display pour les titres d'impact et le logo
- Toujours DM Sans pour l'interface
- Labels en uppercase avec letter-spacing: 2px
- Hiérarchie claire entre H1, H2, Body

❌ **À éviter**
- Inter, Roboto, Arial, System fonts
- Plus de 3 tailles de police différentes sur un même écran
- Texte gris clair sur fond blanc (mauvais contraste)
- Mélanger serif et sans-serif dans un même paragraphe

---

## 05 — Composants UI

### Border-radius

| Valeur | Usage |
|---|---|
| `8px` | Inputs, petits éléments |
| `12px` | Boutons, cards standards |
| `16px` | Grandes cards |
| `20px` | Modales, panneaux |
| `100px` | Badges, pills, tags |
| `50%` | Avatars, icônes rondes |

### Boutons

```css
/* Primaire — action principale */
background: #2196F3;
color: #FFFFFF;
border-radius: 12px;
padding: 14px 24px;
font-size: 15px;
font-weight: 500;
transition: all 200ms ease;

/* Secondaire — action alternative */
background: #E3F2FD;
color: #1565C0;
border: 1px solid #90CAF9;
border-radius: 12px;
padding: 14px 24px;

/* Ghost — action tertiaire */
background: transparent;
color: #1976D2;
border: 1.5px solid #64B5F6;
border-radius: 12px;
padding: 13px 24px;

/* Désactivé */
opacity: 0.5;
cursor: not-allowed;
```

### Cards

```css
/* Card standard */
background: #FFFFFF;
border-radius: 16px;
padding: 24px;
box-shadow: 0 2px 12px rgba(25, 118, 210, 0.10);

/* Card KPI */
background: #FFFFFF;
border-radius: 16px;
padding: 24px 28px;
box-shadow: 0 2px 12px rgba(25, 118, 210, 0.10);
/* Contient : icône 48px + grand chiffre DM Serif Display + label */

/* Card section */
background: #E3F2FD;
border: 1px solid #BBDEFB;
border-radius: 16px;
padding: 32px;
```

### Inputs

```css
/* Repos */
border: 1.5px solid #90CAF9;
border-radius: 12px;
padding: 14px 18px;
font-size: 15px;
color: #0D47A1;

/* Focus */
border-color: #2196F3;
box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.15);
```

### Badges / Tags

```css
/* Base */
display: inline-flex;
align-items: center;
gap: 6px;
padding: 6px 14px;
border-radius: 100px;
font-size: 12px;
font-weight: 600;

/* Bleu (défaut) */   background: #BBDEFB; color: #1565C0;
/* Succès */          background: #E8F5E9; color: #2E7D32;
/* Avertissement */   background: #FFF3E0; color: #E65100;
/* Erreur */          background: #FFEBEE; color: #C62828;
```

### Carte fidélité client

```
┌─────────────────────────────────────┐
│  [Nom du commerce]    [Secteur]     │
│                                     │
│  🟡 🟡 🟡 🟡 🟡 🟡 🟡 ○ ○ ○     │
│                                     │
│  ████████████████████░░░░░░ 70%    │
│  7/10 tampons · Plus que 3 !        │
└─────────────────────────────────────┘
```

- Tampons validés : cercle plein `#2196F3` avec ombre
- Tampons vides : cercle vide bordure `#90CAF9`
- Barre de progression : fond `#E3F2FD`, remplissage `#2196F3`

### Animations

```css
/* Transition standard */
transition: all 200ms ease;

/* Hover card */
transform: translateY(-2px);

/* Clic bouton */
transform: scale(0.98);

/* Fade in page */
animation: fadeIn 300ms ease;
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* +1 Tampon */
animation: bounce 600ms ease;
@keyframes bounce {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.4); }
  100% { transform: scale(1); }
}
```

---

## 06 — Ton éditorial

### Principes

1. **Court et direct** — chaque message tient en une ligne
2. **Toujours en français** — zéro anglais visible par l'utilisateur
3. **Humain et chaleureux** — parle comme un allié, pas comme un logiciel
4. **Actionnable** — chaque message invite à faire quelque chose
5. **Célébrer les petites victoires** — chaque nouveau client mérite une mention

### Exemples — Ce qu'on dit / Ce qu'on évite

| ✅ On dit | ❌ On évite |
|---|---|
| "Gagnez vos tampons chez [Nom] !" | "Accumulez des points de fidélité" |
| "🎉 Nouveau client ! Marie vient de vous rejoindre." | "Un nouvel enregistrement a été ajouté." |
| "Plus que 3 tampons pour votre café offert !" | "Solde restant : 3 unités avant déclenchement." |
| "Vos 12 clients inactifs attendent une relance !" | "12 utilisateurs n'ont pas effectué de transaction." |
| "Votre récompense a été validée ✅" | "Transaction de type redeem effectuée avec succès." |
| "Connectez-vous pour voir votre carte." | "Authentification requise pour accéder à la ressource." |

### Formules récurrentes

```
Accroche scan client :
"Gagnez vos tampons chez [Nom du commerce] !"

Confirmation tampon :
"+1 Tampon ajouté ! Plus que [X] pour [récompense]."

Récompense débloquée :
"🎁 Félicitations ! Vous avez gagné : [récompense] chez [Nom]."

Récompense validée commerçant :
"✅ Récompense validée pour [Prénom]. Solde remis à zéro."

Client inactif :
"[X] clients n'ont pas visité depuis 30 jours → Envoyer une relance"

Aucun client encore :
"Dès que vous aurez vos premiers clients, nous vous proposerons 
ici des actions ciblées pour booster votre fidélité."

Trial expirant :
"Votre essai gratuit expire dans [X] jours. Choisissez un plan 
pour continuer à fidéliser vos clients."
```

---

## 07 — Espacement & Grille

### Unité de base : 8px

| Valeur | Usage |
|---|---|
| `4px` | Micro-espacement interne |
| `8px` | Gap entre éléments inline |
| `12px` | Padding interne petit |
| `16px` | Gap entre éléments |
| `24px` | Padding card standard |
| `32px` | Gap entre sections |
| `48px` | Padding card large |
| `64px` | Espace entre blocs majeurs |
| `80px` | Padding de section |
| `100px` | Padding de section principale |

### Grille

```
Mobile  (< 768px)  : 1 colonne, padding 20px
Tablet  (768-1024) : 2 colonnes, padding 40px
Desktop (> 1024px) : 2-3 colonnes, padding 80px
```

### Règles d'espacement

- Les cards ont toujours un padding interne minimum de 24px
- Le gap entre deux cards est toujours de 24px minimum
- Aucun texte ne touche le bord d'un conteneur
- Les KPIs du dashboard sont en grille 2×2 sur mobile, 4×1 sur desktop

---

## 08 — Icônes

### Bibliothèque
**Lucide React** — icônes cohérentes, légères, disponibles via npm

```bash
npm install lucide-react
```

### Tailles standard

| Contexte | Taille |
|---|---|
| Inline dans texte | 16px |
| Bouton avec texte | 18px |
| Navigation | 20px |
| Card KPI | 24px |
| Illustration | 32–48px |

### Icônes clés Fydly

```
QR code         : QrCode
Scanner         : Scan
Tampon          : Stamp / Circle
Récompense      : Gift
Clients         : Users
Dashboard       : LayoutDashboard
Notification    : Bell
Statistiques    : BarChart2
Paramètres      : Settings
Déconnexion     : LogOut
Valider         : CheckCircle
Inactif         : AlertTriangle
VIP             : Star
Envoyer         : Send
Imprimer        : Printer
Plein écran     : Maximize
```

---

## 09 — PWA & Application

### Manifest

```json
{
  "name": "Fydly",
  "short_name": "Fydly",
  "description": "Plateforme de fidélité digitale pour commerçants",
  "theme_color": "#2196F3",
  "background_color": "#E3F2FD",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/scan"
}
```

### Icônes application

| Taille | Usage |
|---|---|
| 192×192 | Android home screen |
| 512×512 | Splash screen |
| 180×180 | Apple touch icon |

### Spécifications écrans

| Écran | Fond | Particularité |
|---|---|---|
| Scanner `/scan` | `#1976D2` | Seul fond sombre, caméra auto |
| Auth client | `#E3F2FD` | Logo commerçant en haut |
| Carte fidélité | `#FFFFFF` | Animation +1 au chargement |
| Récompense | `#0D47A1` | QR blanc sur fond sombre, confettis |
| Dashboard | `#E3F2FD` | Responsive mobile + desktop |

---

## 10 — Règles non négociables

Ces règles s'appliquent à chaque écran, chaque composant, chaque texte.

```
✅ Fond de page toujours #E3F2FD (sauf scanner #1976D2)
✅ Cards toujours blanches avec ombre rgba(25,118,210,0.10)
✅ Boutons CTA toujours #2196F3 texte blanc
✅ Titres toujours #0D47A1 en DM Sans bold
✅ Textes toujours dans la palette bleue — jamais de gris
✅ Tout en français — aucun texte anglais visible
✅ Spinner sur tous les boutons pendant les appels API
✅ Boutons désactivés pendant le chargement
✅ Skeleton loaders pendant le chargement des données
✅ Messages d'erreur explicites en français
✅ Toast de confirmation pour chaque action réussie
✅ Responsive : lisible sur mobile ET desktop
✅ Aucune donnée mockée — tout depuis Supabase
✅ Aucune erreur dans la console du navigateur

❌ Jamais de fond noir (sauf scanner)
❌ Jamais de rouge comme couleur principale
❌ Jamais de violet, gradient purple
❌ Jamais d'Inter, Roboto, Arial
❌ Jamais de texte gris clair sur fond blanc
❌ Jamais de données hardcodées
❌ Jamais de texte en anglais visible par l'utilisateur
```

---

*Fydly — Brand Guidelines v1.0 — Mars 2026*  
*fydlypro@gmail.com — Projet étudiant ITEEM Centrale Lille × SKEMA Business School*