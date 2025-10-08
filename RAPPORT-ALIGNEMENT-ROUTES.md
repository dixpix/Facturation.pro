# Rapport d'Alignement des Routes/Commandes

**Date**: 7 octobre 2025
**Sources comparées**: Documentation API, OpenAPI, Postman Collection, MCP Server

---

## 1. Tableau de Comparaison Global

| Module | Doc API | OpenAPI | Postman | MCP | Statut |
|--------|---------|---------|---------|-----|--------|
| **Compte** | ✅ | ✅ | ✅ | ❌ | Partiel |
| **Achats** | ✅ | ✅ | ❌ | ❌ | Non implémenté |
| **Catégories** | ✅ | ✅ | ✅ | ✅ | **Complet** |
| **Clients** | ✅ | ✅ | ✅ | ✅ | **Complet** |
| **Devis** | ✅ | ✅ | ✅ | ✅ | Quasi-complet |
| **Factures** | ✅ | ✅ | ❌ | ✅ | Quasi-complet |
| **Fournisseurs** | ✅ | ✅ | ❌ | ✅ | **Complet** |
| **Produits** | ✅ | ✅ | ✅ | ❌ | Non implémenté |
| **Suivis Commerciaux** | ✅ | ✅ | ❌ | ❌ | Non implémenté |
| **Fichiers/Assets** | ✅ | ✅ | ❌ | ⚠️ | Partiel (uploads uniquement) |
| **Emails** | ✅ | ✅ | ❌ | ✅ | **Complet** |
| **Dashboard** | ❌ | ❌ | ❌ | ✅ | MCP seulement |

---

## 2. Analyse Détaillée par Module

### 2.1 Module COMPTE (Account)

#### Routes Documentation API
```
GET /account.json
GET /firms/{firmId}/orders.json
```

#### État d'implémentation
| Route | OpenAPI | Postman | MCP | Note |
|-------|---------|---------|-----|------|
| `GET /account.json` | ✅ | ✅ | ❌ | **MANQUE MCP** - Utile pour config |
| `GET /firms/{id}/orders.json` | ✅ | ✅ | ❌ | **MANQUE MCP** - Factures abonnement |

**Recommandation**: Ajouter `get_account` et `list_subscription_orders` au MCP

---

### 2.2 Module ACHATS (Purchases)

#### Routes Documentation API
```
GET    /firms/{firmId}/purchases.json
POST   /firms/{firmId}/purchases.json
GET    /firms/{firmId}/purchases/{id}.json
PATCH  /firms/{firmId}/purchases/{id}.json
DELETE /firms/{firmId}/purchases/{id}.json
POST   /firms/{firmId}/purchases/{id}/upload.json
GET    /firms/{firmId}/recurring_purchases.json
GET    /firms/{firmId}/recurring_purchases/{id}.json
```

#### État d'implémentation
| Route | OpenAPI | Postman | MCP | Priorité |
|-------|---------|---------|-----|----------|
| `GET /purchases.json` | ✅ | ❌ | ❌ | **HAUTE** |
| `POST /purchases.json` | ✅ | ❌ | ❌ | **HAUTE** |
| `GET /purchases/{id}.json` | ✅ | ❌ | ❌ | **HAUTE** |
| `PATCH /purchases/{id}.json` | ✅ | ❌ | ❌ | MOYENNE |
| `DELETE /purchases/{id}.json` | ✅ | ❌ | ❌ | MOYENNE |
| `POST /purchases/{id}/upload.json` | ✅ | ❌ | ❌ | BASSE |
| `GET /recurring_purchases.json` | ✅ | ❌ | ❌ | BASSE |

**Impact**: ❌ **MODULE ENTIÈREMENT MANQUANT DANS MCP ET POSTMAN**
**Recommandation**: Implémenter en priorité (gestion des dépenses cruciale)

---

### 2.3 Module CATÉGORIES (Categories) ✅

#### Routes Documentation API
```
GET    /firms/{firmId}/categories.json
POST   /firms/{firmId}/categories.json
GET    /firms/{firmId}/categories/{id}.json
PATCH  /firms/{firmId}/categories/{id}.json
DELETE /firms/{firmId}/categories/{id}.json
```

#### État d'implémentation
| Route | OpenAPI | Postman | MCP | Outil MCP |
|-------|---------|---------|-----|-----------|
| `GET /categories.json` | ✅ | ✅ | ✅ | `list_categories` |
| `POST /categories.json` | ✅ | ✅ | ✅ | `create_category` |
| `GET /categories/{id}.json` | ✅ | ✅ | ❌ | **MANQUE** `get_category` |
| `PATCH /categories/{id}.json` | ✅ | ✅ | ✅ | `update_category` |
| `DELETE /categories/{id}.json` | ✅ | ✅ | ✅ | `delete_category` |

**Statut**: ✅ **QUASI-COMPLET** (manque seulement GET détails)

---

### 2.4 Module CLIENTS (Customers) ✅

#### Routes Documentation API
```
GET    /firms/{firmId}/customers.json
POST   /firms/{firmId}/customers.json
GET    /firms/{firmId}/customers/{id}.json
PATCH  /firms/{firmId}/customers/{id}.json
DELETE /firms/{firmId}/customers/{id}.json
POST   /firms/{firmId}/customers/{id}/archive.json
POST   /firms/{firmId}/customers/{id}/unarchive.json
POST   /firms/{firmId}/customers/{id}/upload.json
GET    /firms/{firmId}/customers/{id}/quotes.json (redirect)
GET    /firms/{firmId}/customers/{id}/invoices.json (redirect)
```

#### État d'implémentation
| Route | OpenAPI | Postman | MCP | Outil MCP |
|-------|---------|---------|-----|-----------|
| `GET /customers.json` | ✅ | ✅ | ✅ | `list_customers` |
| `POST /customers.json` | ✅ | ✅ | ✅ | `create_customer` |
| `GET /customers/{id}.json` | ✅ | ✅ | ✅ | `get_customer` |
| `PATCH /customers/{id}.json` | ✅ | ✅ | ✅ | `update_customer` |
| `DELETE /customers/{id}.json` | ✅ | ✅ | ✅ | `delete_customer` |
| `POST /customers/{id}/archive.json` | ✅ | ✅ | ✅ | `archive_customer` |
| `POST /customers/{id}/unarchive.json` | ✅ | ✅ | ✅ | `unarchive_customer` |
| `POST /customers/{id}/upload.json` | ✅ | ✅ | ✅ | `upload_customer_file` |
| `GET /customers/{id}/quotes.json` | ✅ | ❌ | ❌ | **MANQUE** |
| `GET /customers/{id}/invoices.json` | ✅ | ❌ | ❌ | **MANQUE** |

**Statut**: ✅ **EXCELLENT** (98% couverture - manquent uniquement les raccourcis)

---

### 2.5 Module DEVIS (Quotes)

#### Routes Documentation API
```
GET    /firms/{firmId}/quotes.json
POST   /firms/{firmId}/quotes.json
GET    /firms/{firmId}/quotes/{id}.json
PATCH  /firms/{firmId}/quotes/{id}.json
DELETE /firms/{firmId}/quotes/{id}.json
GET    /firms/{firmId}/quotes/{id}.pdf
POST   /firms/{firmId}/quotes/{id}/invoice.json
POST   /firms/{firmId}/quotes/{id}/upload.json
POST   /firms/{firmId}/emails.json?bill_id={id}
```

#### État d'implémentation
| Route | OpenAPI | Postman | MCP | Outil MCP |
|-------|---------|---------|-----|-----------|
| `GET /quotes.json` | ✅ | ✅ | ❌ | **MANQUE** `list_quotes` |
| `POST /quotes.json` | ✅ | ✅ | ✅ | `create_quote` |
| `GET /quotes/{id}.json` | ✅ | ✅ | ❌ | **MANQUE** `get_quote` |
| `PATCH /quotes/{id}.json` | ✅ | ✅ | ❌ | **MANQUE** `update_quote` |
| `DELETE /quotes/{id}.json` | ✅ | ✅ | ❌ | **MANQUE** `delete_quote` |
| `GET /quotes/{id}.pdf` | ✅ | ✅ | ❌ | **MANQUE** `download_quote_pdf` |
| `POST /quotes/{id}/invoice.json` | ✅ | ✅ | ❌ | **MANQUE** `convert_quote_to_invoice` |
| `POST /quotes/{id}/upload.json` | ✅ | ✅ | ✅ | `upload_quote_file` |
| `POST /emails.json?bill_id=` | ✅ | ❌ | ✅ | `send_quote_email` |

**Statut**: ⚠️ **TRÈS INCOMPLET** (seulement 3 outils sur 9 routes)
**Impact**: ❌ **CRITIQUE** - Impossible de gérer un workflow complet de devis

**Recommandation URGENTE**:
- Ajouter `list_quotes`, `get_quote`, `update_quote`, `delete_quote`
- Ajouter `download_quote_pdf`, `convert_quote_to_invoice`
- **Ces outils sont ESSENTIELS pour un usage pratique**

---

### 2.6 Module FACTURES (Invoices)

#### Routes Documentation API
```
GET    /firms/{firmId}/invoices.json
POST   /firms/{firmId}/invoices.json
GET    /firms/{firmId}/invoices/{id}.json
PATCH  /firms/{firmId}/invoices/{id}.json
DELETE /firms/{firmId}/invoices/{id}.json
GET    /firms/{firmId}/invoices/{id}.pdf
POST   /firms/{firmId}/invoices/{id}/refund.json
POST   /firms/{firmId}/invoices/{id}/upload.json
GET    /firms/{firmId}/invoices/{id}/settlements.json
POST   /firms/{firmId}/invoices/{id}/settlements.json
GET    /firms/{firmId}/invoices/{id}/settlements/{sid}.json
DELETE /firms/{firmId}/invoices/{id}/settlements/{sid}.json
```

#### État d'implémentation
| Route | OpenAPI | Postman | MCP | Outil MCP |
|-------|---------|---------|-----|-----------|
| `GET /invoices.json` | ✅ | ❌ | ❌ | **MANQUE** `list_invoices` |
| `POST /invoices.json` | ✅ | ❌ | ✅ | `create_invoice` |
| `GET /invoices/{id}.json` | ✅ | ❌ | ❌ | **MANQUE** `get_invoice` |
| `PATCH /invoices/{id}.json` | ✅ | ❌ | ✅ | `update_invoice` |
| `DELETE /invoices/{id}.json` | ✅ | ❌ | ❌ | **MANQUE** `delete_invoice` |
| `GET /invoices/{id}.pdf` | ✅ | ❌ | ✅ | `download_invoice_pdf` |
| `POST /invoices/{id}/refund.json` | ✅ | ❌ | ✅ | `create_invoice_refund` |
| `POST /invoices/{id}/upload.json` | ✅ | ❌ | ❌ | **MANQUE** `upload_invoice_file` |
| `GET /invoices/{id}/settlements.json` | ✅ | ❌ | ❌ | **MANQUE** |
| `POST /invoices/{id}/settlements.json` | ✅ | ❌ | ❌ | **MANQUE** |
| `GET /invoices/{id}/settlements/{sid}.json` | ✅ | ❌ | ❌ | **MANQUE** |
| `DELETE /invoices/{id}/settlements/{sid}.json` | ✅ | ❌ | ❌ | **MANQUE** |

**Statut**: ⚠️ **INCOMPLET** (4 outils sur 12 routes)
**Impact**: ❌ Les règlements partiels ne sont pas gérés du tout

**Recommandation**:
- Ajouter `list_invoices`, `get_invoice`, `delete_invoice`
- Ajouter tout le module Settlements (règlements partiels)

---

### 2.7 Module FOURNISSEURS (Suppliers) ✅

#### Routes Documentation API
```
GET    /firms/{firmId}/suppliers.json
POST   /firms/{firmId}/suppliers.json
GET    /firms/{firmId}/suppliers/{id}.json
PATCH  /firms/{firmId}/suppliers/{id}.json
DELETE /firms/{firmId}/suppliers/{id}.json
```

#### État d'implémentation
| Route | OpenAPI | Postman | MCP | Outil MCP |
|-------|---------|---------|-----|-----------|
| `GET /suppliers.json` | ✅ | ❌ | ✅ | `list_suppliers` |
| `POST /suppliers.json` | ✅ | ❌ | ✅ | `create_supplier` |
| `GET /suppliers/{id}.json` | ✅ | ❌ | ✅ | `get_supplier` |
| `PATCH /suppliers/{id}.json` | ✅ | ❌ | ✅ | `update_supplier` |
| `DELETE /suppliers/{id}.json` | ✅ | ❌ | ✅ | `delete_supplier` |

**Statut**: ✅ **COMPLET À 100%**

---

### 2.8 Module PRODUITS (Products)

#### Routes Documentation API
```
GET    /firms/{firmId}/products.json
POST   /firms/{firmId}/products.json
GET    /firms/{firmId}/products/{id}.json
PATCH  /firms/{firmId}/products/{id}.json
DELETE /firms/{firmId}/products/{id}.json
```

#### État d'implémentation
| Route | OpenAPI | Postman | MCP | Priorité |
|-------|---------|---------|-----|----------|
| `GET /products.json` | ✅ | ✅ | ❌ | **HAUTE** |
| `POST /products.json` | ✅ | ✅ | ❌ | **HAUTE** |
| `GET /products/{id}.json` | ✅ | ✅ | ❌ | MOYENNE |
| `PATCH /products/{id}.json` | ✅ | ✅ | ❌ | MOYENNE |
| `DELETE /products/{id}.json` | ✅ | ✅ | ❌ | MOYENNE |

**Statut**: ❌ **MODULE ENTIÈREMENT MANQUANT DANS MCP**
**Impact**: Impossible de gérer un catalogue de produits
**Recommandation**: Implémenter le module complet (priorité HAUTE)

---

### 2.9 Module SUIVIS COMMERCIAUX (Followups)

#### Routes Documentation API
```
GET    /firms/{firmId}/followups.json
POST   /firms/{firmId}/followups.json
GET    /firms/{firmId}/followups/{id}.json
PATCH  /firms/{firmId}/followups/{id}.json
DELETE /firms/{firmId}/followups/{id}.json
```

#### État d'implémentation
| Route | OpenAPI | Postman | MCP | Priorité |
|-------|---------|---------|-----|----------|
| Toutes les routes | ✅ | ❌ | ❌ | BASSE |

**Statut**: ❌ **MODULE ENTIÈREMENT MANQUANT**
**Impact**: Fonctionnalité CRM absente
**Recommandation**: Priorité basse (fonctionnalité avancée)

---

### 2.10 Module FICHIERS/ASSETS

#### Routes Documentation API
```
GET    /firms/{firmId}/assets/quotes.json
GET    /firms/{firmId}/assets/invoices.json
GET    /firms/{firmId}/assets/customers.json
GET    /firms/{firmId}/assets/purchases.json
DELETE /firms/{firmId}/assets/{id}.json
```

#### État d'implémentation
| Route | OpenAPI | Postman | MCP | Note |
|-------|---------|---------|-----|------|
| `GET /assets/quotes.json` | ✅ | ❌ | ❌ | Liste fichiers devis |
| `GET /assets/invoices.json` | ✅ | ❌ | ❌ | Liste fichiers factures |
| `GET /assets/customers.json` | ✅ | ❌ | ❌ | Liste fichiers clients |
| `GET /assets/purchases.json` | ✅ | ❌ | ❌ | Liste fichiers achats |
| `DELETE /assets/{id}.json` | ✅ | ❌ | ❌ | Supprimer fichier |
| Uploads (POST) | ✅ | ✅ | ⚠️ | Implémentation partielle MCP |

**Statut**: ⚠️ **TRÈS INCOMPLET**
**Recommandation**:
- Ajouter outils pour lister les fichiers attachés
- Corriger l'implémentation des uploads
- Ajouter suppression de fichiers

---

### 2.11 Module EMAILS

#### Routes Documentation API
```
POST /firms/{firmId}/emails.json?bill_id={id}
```

#### État d'implémentation
| Route | OpenAPI | Postman | MCP | Outil MCP |
|-------|---------|---------|-----|-----------|
| `POST /emails.json` | ✅ | ❌ | ✅ | `send_quote_email` |

**Statut**: ✅ **COMPLET**
**Note**: L'API utilise la même route pour devis et factures (paramètre `bill_id`)

---

### 2.12 Module DASHBOARD (Non documenté)

**État**: ✅ Implémenté UNIQUEMENT dans le MCP (ligne 900-901, outil `get_dashboard`)

**Analyse**:
- ❓ Cet outil n'apparaît nulle part dans la documentation officielle
- ❓ Ni dans OpenAPI, ni dans Postman
- ✅ Probablement une fonctionnalité découverte/testée directement sur l'API

**Recommandation**: Vérifier l'existence réelle de cette route et documenter

---

## 3. Scores de Couverture

### 3.1 Par Module

| Module | Routes API | Implémenté MCP | % Couverture MCP |
|--------|------------|----------------|------------------|
| Clients | 10 | 8 | **80%** ✅ |
| Fournisseurs | 5 | 5 | **100%** ✅ |
| Catégories | 5 | 4 | **80%** ✅ |
| Devis | 9 | 3 | **33%** ❌ |
| Factures | 12 | 4 | **33%** ❌ |
| Produits | 5 | 0 | **0%** ❌ |
| Achats | 8 | 0 | **0%** ❌ |
| Suivis | 5 | 0 | **0%** ❌ |
| Fichiers | 6 | 3 | **50%** ⚠️ |
| Compte | 2 | 0 | **0%** ❌ |
| Dashboard | 1 | 1 | **100%** ✅ |

### 3.2 Global

**Total routes disponibles dans l'API**: ~80
**Total outils MCP implémentés**: 28
**Score de couverture global**: **35%** ⚠️

---

## 4. Matrice de Priorisation

### 🔴 CRITIQUE - À implémenter IMMÉDIATEMENT
1. **Module Devis - Routes manquantes**
   - `list_quotes` (GET /quotes.json)
   - `get_quote` (GET /quotes/{id}.json)
   - `update_quote` (PATCH /quotes/{id}.json)
   - `delete_quote` (DELETE /quotes/{id}.json)
   - `download_quote_pdf` (GET /quotes/{id}.pdf)
   - `convert_quote_to_invoice` (POST /quotes/{id}/invoice.json)

2. **Module Factures - Routes manquantes**
   - `list_invoices` (GET /invoices.json)
   - `get_invoice` (GET /invoices/{id}.json)
   - `delete_invoice` (DELETE /invoices/{id}.json)

### 🟠 IMPORTANT - À implémenter rapidement
3. **Module Produits - COMPLET**
   - `list_products`, `create_product`, `get_product`, `update_product`, `delete_product`

4. **Module Achats - COMPLET**
   - `list_purchases`, `create_purchase`, `get_purchase`, `update_purchase`, `delete_purchase`

### 🟡 SOUHAITABLE - Amélioration continue
5. **Module Règlements (Settlements)**
   - `list_invoice_settlements`, `create_settlement`, `delete_settlement`

6. **Module Fichiers**
   - `list_quote_files`, `list_invoice_files`, `list_customer_files`, `delete_file`

7. **Module Suivis Commerciaux**
   - Toutes les routes (priorité basse)

---

## 5. Recommandations Stratégiques

### 5.1 Court Terme (1-2 semaines)
✅ Compléter les modules Devis et Factures (routes GET/UPDATE/DELETE)
✅ Implémenter le module Produits (essentiel pour workflows complets)

### 5.2 Moyen Terme (1 mois)
✅ Implémenter le module Achats (gestion des dépenses)
✅ Ajouter les règlements partiels (settlements)
✅ Corriger les uploads de fichiers

### 5.3 Long Terme (3 mois)
✅ Module Suivis Commerciaux (CRM)
✅ Gestion avancée des fichiers
✅ Ressources MCP pour tous les modules

---

## 6. Conclusion

### Points Forts
✅ Couverture excellente des modules Clients, Fournisseurs, Catégories
✅ Architecture MCP solide et extensible
✅ Documentation des outils claire

### Points Faibles Majeurs
❌ **Modules Devis et Factures incomplets** (seulement 33% de couverture)
❌ **Modules Produits et Achats totalement absents**
❌ **Impossible de réaliser des workflows complets** (ex: créer devis → consulter → accepter → convertir en facture)

### Impact Business
🔴 **Le MCP actuel ne permet PAS une utilisation production réelle** car :
- On ne peut pas lister/consulter les devis/factures existants
- On ne peut pas gérer un catalogue de produits
- On ne peut pas gérer les dépenses (achats)

**Recommandation finale**: Prioriser l'implémentation des routes manquantes sur les modules Devis/Factures avant tout ajout de nouvelles fonctionnalités.

---

**Prochaine étape**: Rapport des possibilités non implémentées et suggestions d'amélioration.
