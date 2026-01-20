# Guide de formatage des devis et factures

Ce guide explique comment formater correctement les lignes de devis et factures via l'API Facturation.pro pour obtenir un rendu PDF optimal.

## 📋 Table des matières

- [Retours à la ligne](#retours-à-la-ligne)
- [Titres de section](#titres-de-section)
- [Listes à puces](#listes-à-puces)
- [Caractères à éviter](#caractères-à-éviter)
- [Exemples complets](#exemples-complets)
- [Erreurs courantes](#erreurs-courantes)

---

## Retours à la ligne

### ❌ Incorrect : `\n` (style Unix/Linux)

```json
{
  "title": "Point 1\nPoint 2\nPoint 3"
}
```

**Résultat** : Les retours à la ligne ne s'affichent pas correctement dans le PDF.

### ✅ Correct : `\r\n` (style Windows)

```json
{
  "title": "Point 1\r\nPoint 2\r\nPoint 3"
}
```

**Résultat** : Chaque point s'affiche sur une ligne séparée dans le PDF.

### Pourquoi `\r\n` ?

L'API Facturation.pro génère des PDF qui nécessitent des retours à la ligne au format Windows (`\r\n`). Les retours à la ligne Unix (`\n`) seuls ne sont pas reconnus par le moteur de rendu PDF.

---

## Titres de section

Les titres de section permettent d'organiser visuellement vos devis/factures avec des sections sans montant.

### Structure d'un titre

Pour créer un titre de section, vous devez :

1. Définir `style: "title"`
2. Mettre **tous** les montants à zéro :
   - `quantity: 0`
   - `unit_price: 0`
   - `vat: 0`

### Exemple

```json
{
  "quantity": 0,
  "title": "DÉVELOPPEMENT WEB",
  "unit_price": 0,
  "vat": 0,
  "style": "title"
}
```

**Rendu dans le PDF** :

```
═══════════════════════════════════════
DÉVELOPPEMENT WEB
═══════════════════════════════════════
```

### ⚠️ Important

- Si vous oubliez `style: "title"`, la ligne aura le style normal
- Si vous ne mettez pas les montants à zéro, des montants incorrects apparaîtront
- Les titres ne doivent jamais avoir de montant calculé

---

## Listes à puces

### Format recommandé : trait d'union + espace

Utilisez `"- "` (trait d'union suivi d'un espace) au début de chaque ligne :

```json
{
  "quantity": 1,
  "title": "- Site responsive\r\n- 5 pages\r\n- Formation 1h",
  "unit_price": 1500,
  "vat": 0.2
}
```

**Rendu dans le PDF** :

```
- Site responsive
- 5 pages
- Formation 1h
```

### ❌ Caractères à éviter

N'utilisez **PAS** de caractères Unicode pour les puces :

- ❌ `•` (bullet point)
- ❌ `◦` (white bullet)
- ❌ `▪` (black small square)
- ❌ `▸` (black right-pointing pointer)

**Raison** : Ces caractères peuvent ne pas s'afficher correctement dans le PDF ou causer des problèmes d'encodage.

---

## Caractères à éviter

Liste des caractères Unicode problématiques :

| Caractère | Code | Problème |
|-----------|------|----------|
| • | U+2022 | Peut ne pas s'afficher |
| ◦ | U+25E6 | Peut ne pas s'afficher |
| ★ | U+2605 | Peut ne pas s'afficher |
| ✓ | U+2713 | Peut ne pas s'afficher |
| → | U+2192 | Peut ne pas s'afficher |
| — | U+2014 | Confusion avec trait d'union |

**Recommandation** : Utilisez uniquement des caractères ASCII standard (a-z, A-Z, 0-9, ponctuation de base).

---

## Exemples complets

### Exemple 1 : Devis simple avec titre et détails

```json
{
  "customer_id": 12345,
  "title": "Prestation de développement",
  "items": [
    {
      "quantity": 0,
      "title": "DÉVELOPPEMENT WEB",
      "unit_price": 0,
      "vat": 0,
      "style": "title",
      "position": 1
    },
    {
      "quantity": 1,
      "title": "- Site responsive\r\n- 5 pages\r\n- Formation 1h",
      "unit_price": 1500,
      "vat": 0.2,
      "position": 2
    },
    {
      "quantity": 0,
      "title": "HÉBERGEMENT",
      "unit_price": 0,
      "vat": 0,
      "style": "title",
      "position": 3
    },
    {
      "quantity": 12,
      "title": "Hébergement mensuel",
      "unit_price": 50,
      "vat": 0.2,
      "position": 4
    }
  ]
}
```

**Rendu dans le PDF** :

```
════════════════════════════════════════════════════════════
DÉVELOPPEMENT WEB
════════════════════════════════════════════════════════════

- Site responsive                            1    1 500,00 €
- 5 pages
- Formation 1h

════════════════════════════════════════════════════════════
HÉBERGEMENT
════════════════════════════════════════════════════════════

Hébergement mensuel                         12       50,00 €
```

### Exemple 2 : Facture détaillée avec plusieurs sections

```json
{
  "customer_id": 67890,
  "title": "Facture consulting",
  "items": [
    {
      "quantity": 0,
      "title": "ANALYSE ET CONSEIL",
      "unit_price": 0,
      "vat": 0,
      "style": "title",
      "position": 1
    },
    {
      "quantity": 5,
      "title": "Audit technique\r\n- Analyse architecture\r\n- Revue code\r\n- Rapport détaillé",
      "unit_price": 800,
      "vat": 0.2,
      "position": 2
    },
    {
      "quantity": 0,
      "title": "DÉVELOPPEMENT",
      "unit_price": 0,
      "vat": 0,
      "style": "title",
      "position": 3
    },
    {
      "quantity": 20,
      "title": "Développement features\r\n- Module authentification\r\n- API REST\r\n- Tests unitaires",
      "unit_price": 500,
      "vat": 0.2,
      "position": 4
    }
  ],
  "invoiced_on": "2025-01-15"
}
```

### Exemple 3 : Modification d'un devis existant

```json
{
  "quote_id": 999,
  "items": [
    {
      "id": 1234,
      "title": "Formation complète\r\n- 2 jours\r\n- Support inclus",
      "quantity": 1,
      "unit_price": 2000,
      "vat": 0.2
    },
    {
      "id": 1235,
      "_destroy": "1"
    }
  ]
}
```

**Résultat** :
- La ligne 1234 est mise à jour avec le nouveau libellé
- La ligne 1235 est supprimée du devis

---

## Erreurs courantes

### Erreur 1 : Retour à la ligne Unix

❌ **Problème** :
```json
{"title": "Point 1\nPoint 2\nPoint 3"}
```

✅ **Solution** :
```json
{"title": "Point 1\r\nPoint 2\r\nPoint 3"}
```

### Erreur 2 : Titre sans `style: "title"`

❌ **Problème** :
```json
{
  "quantity": 0,
  "title": "DÉVELOPPEMENT",
  "unit_price": 0,
  "vat": 0
}
```

**Résultat** : La ligne s'affiche en style normal, pas en titre.

✅ **Solution** :
```json
{
  "quantity": 0,
  "title": "DÉVELOPPEMENT",
  "unit_price": 0,
  "vat": 0,
  "style": "title"
}
```

### Erreur 3 : Titre avec montant non nul

❌ **Problème** :
```json
{
  "quantity": 1,
  "title": "DÉVELOPPEMENT",
  "unit_price": 1500,
  "vat": 0.2,
  "style": "title"
}
```

**Résultat** : Un montant de 1500 € apparaît sur la ligne de titre !

✅ **Solution** :
```json
{
  "quantity": 0,
  "title": "DÉVELOPPEMENT",
  "unit_price": 0,
  "vat": 0,
  "style": "title"
}
```

### Erreur 4 : Puces Unicode

❌ **Problème** :
```json
{"title": "• Point 1\r\n• Point 2\r\n• Point 3"}
```

**Résultat** : Les puces peuvent s'afficher comme `?` ou `□` dans le PDF.

✅ **Solution** :
```json
{"title": "- Point 1\r\n- Point 2\r\n- Point 3"}
```

### Erreur 5 : Oubli du paramètre `position`

❌ **Problème** :
```json
[
  {"title": "Ligne 2", "quantity": 1, "unit_price": 100, "vat": 0.2},
  {"title": "Ligne 1", "quantity": 1, "unit_price": 200, "vat": 0.2}
]
```

**Résultat** : Les lignes peuvent s'afficher dans un ordre imprévisible.

✅ **Solution** :
```json
[
  {"title": "Ligne 1", "quantity": 1, "unit_price": 200, "vat": 0.2, "position": 1},
  {"title": "Ligne 2", "quantity": 1, "unit_price": 100, "vat": 0.2, "position": 2}
]
```

---

## Tableau récapitulatif

| Règle | Bon usage | Mauvais usage |
|-------|-----------|---------------|
| **Retour à la ligne** | `\r\n` | `\n` |
| **Titre de section** | `style: "title"` avec montants = 0 | Sans `style` ou montants ≠ 0 |
| **Listes à puces** | `"- "` | `"•"` ou `"◦"` |
| **Ordre d'affichage** | Utiliser `position` | Sans `position` |
| **Modification** | Passer `id` de la ligne | Sans `id` |
| **Suppression** | `_destroy: "1"` | Omettre la ligne |

---

## Outils concernés

Cette documentation s'applique aux outils MCP suivants :

- `create_quote` : Création de devis
- `update_quote` : Modification de devis
- `create_invoice` : Création de facture
- `update_invoice` : Modification de facture (uniquement si en brouillon)

---

## Support

Pour toute question ou problème de formatage :

- **Email** : contact@facturation.pro
- **Documentation API** : https://www.facturation.dev/
- **Issues GitHub** : https://github.com/dixpix/facturation-pro-mcp-server/issues

---

**Dernière mise à jour** : 30 octobre 2025
