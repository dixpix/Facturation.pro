# Analyse Couverture Postman - 29% Manquants

**Date**: 7 octobre 2025
**Couverture actuelle**: 71% (50/70 routes prioritaires)

---

## ROUTES PRÉSENTES DANS POSTMAN (50)

### ✅ Compte (2/2 - 100%)
1. GET /account.json - Test authentification
2. GET /firms/{firmId}/orders.json - Commandes abonnement

### ✅ Catégories (5/5 - 100%)
1. GET /firms/{firmId}/categories.json - Liste
2. POST /firms/{firmId}/categories.json - Créer
3. GET /firms/{firmId}/categories/{id}.json - Détails
4. PATCH /firms/{firmId}/categories/{id}.json - Modifier
5. DELETE /firms/{firmId}/categories/{id}.json - Supprimer

### ✅ Clients (9/9 - 100%)
1. GET /firms/{firmId}/customers.json - Liste
2. POST /firms/{firmId}/customers.json - Créer
3. GET /firms/{firmId}/customers/{id}.json - Détails
4. PATCH /firms/{firmId}/customers/{id}.json - Modifier
5. DELETE /firms/{firmId}/customers/{id}.json - Supprimer
6. POST /firms/{firmId}/customers/{id}/archive.json - Archiver
7. POST /firms/{firmId}/customers/{id}/unarchive.json - Restaurer
8. POST /firms/{firmId}/customers/{id}/upload.json - Upload fichier
9. POST /firms/{firmId}/customers/{id}/email.json - Envoyer email

### ✅ Produits (5/5 - 100%)
1. GET /firms/{firmId}/products.json - Liste
2. POST /firms/{firmId}/products.json - Créer
3. GET /firms/{firmId}/products/{id}.json - Détails
4. PATCH /firms/{firmId}/products/{id}.json - Modifier
5. DELETE /firms/{firmId}/products/{id}.json - Supprimer

### ⚠️ Devis (8/11 - 73%)
1. GET /firms/{firmId}/quotes.json - Liste
2. POST /firms/{firmId}/quotes.json - Créer
3. GET /firms/{firmId}/quotes/{id}.json - Détails ❌ MANQUANT
4. PATCH /firms/{firmId}/quotes/{id}.json - Modifier
5. DELETE /firms/{firmId}/quotes/{id}.json - Supprimer ❌ MANQUANT
6. GET /firms/{firmId}/quotes/{id}.pdf - Télécharger PDF ❌ MANQUANT
7. POST /firms/{firmId}/quotes/{id}/to_invoice.json - Convertir en facture
8. PATCH /firms/{firmId}/quotes/{id}/status.json - Changer statut
9. POST /firms/{firmId}/quotes/{id}/upload.json - Upload fichier
10. POST /firms/{firmId}/quotes/{id}/email.json - Envoyer email
11. GET /firms/{firmId}/quotes/{id}/files.json - Liste fichiers ❌ MANQUANT (optionnel)

### ✅ Fournisseurs (5/5 - 100%)
1. GET /firms/{firmId}/suppliers.json - Liste
2. POST /firms/{firmId}/suppliers.json - Créer
3. GET /firms/{firmId}/suppliers/{id}.json - Détails
4. PATCH /firms/{firmId}/suppliers/{id}.json - Modifier
5. DELETE /firms/{firmId}/suppliers/{id}.json - Supprimer

### ⚠️ Factures (11/13 - 85%)
1. GET /firms/{firmId}/invoices.json - Liste
2. GET /firms/{firmId}/invoices/{id}.json - Détails
3. POST /firms/{firmId}/invoices.json - Créer
4. PATCH /firms/{firmId}/invoices/{id}.json - Modifier
5. DELETE /firms/{firmId}/invoices/{id}.json - Supprimer
6. GET /firms/{firmId}/invoices/{id}.pdf - Télécharger PDF
7. POST /firms/{firmId}/invoices/{id}/refund.json - Créer avoir
8. POST /firms/{firmId}/invoices/{id}/upload.json - Upload fichier ❌ MANQUANT
9. POST /firms/{firmId}/invoices/{id}/email.json - Envoyer email ❌ MANQUANT
10. GET /firms/{firmId}/invoices/{id}/settlements.json - Liste règlements
11. POST /firms/{firmId}/invoices/{id}/settlements.json - Créer règlement
12. GET /firms/{firmId}/invoices/{id}/settlements/{settlementId}.json - Détails règlement
13. DELETE /firms/{firmId}/invoices/{id}/settlements/{settlementId}.json - Supprimer règlement

### ⚠️ Achats (5/7 - 71%)
1. GET /firms/{firmId}/purchases.json - Liste
2. POST /firms/{firmId}/purchases.json - Créer
3. GET /firms/{firmId}/purchases/{id}.json - Détails
4. PATCH /firms/{firmId}/purchases/{id}.json - Modifier
5. DELETE /firms/{firmId}/purchases/{id}.json - Supprimer
6. POST /firms/{firmId}/purchases/{id}/upload.json - Upload fichier ❌ MANQUANT
7. GET /firms/{firmId}/purchases/{id}/files.json - Liste fichiers ❌ MANQUANT (optionnel)

---

## ROUTES MANQUANTES (29% = 20 routes)

### 🔴 Modules Entièrement Absents (10 routes)

#### Suivis Commerciaux (5 routes)
1. GET /firms/{firmId}/followups.json - Liste
2. POST /firms/{firmId}/followups.json - Créer
3. GET /firms/{firmId}/followups/{id}.json - Détails
4. PATCH /firms/{firmId}/followups/{id}.json - Modifier
5. DELETE /firms/{firmId}/followups/{id}.json - Supprimer

#### Fichiers Globaux (5 routes optionnelles)
1. GET /firms/{firmId}/assets/quotes.json - Liste fichiers devis
2. GET /firms/{firmId}/assets/invoices.json - Liste fichiers factures
3. GET /firms/{firmId}/assets/customers.json - Liste fichiers clients
4. GET /firms/{firmId}/assets/purchases.json - Liste fichiers achats
5. DELETE /firms/{firmId}/assets/{id}.json - Supprimer un fichier

### 🟡 Routes Manquantes dans Modules Existants (10 routes)

#### Devis (3 routes)
1. GET /firms/{firmId}/quotes/{id}.json - Détails d'un devis
2. DELETE /firms/{firmId}/quotes/{id}.json - Supprimer devis
3. GET /firms/{firmId}/quotes/{id}.pdf - Télécharger PDF devis

#### Factures (2 routes)
1. POST /firms/{firmId}/invoices/{id}/upload.json - Upload fichier facture
2. POST /firms/{firmId}/invoices/{id}/email.json - Envoyer facture par email

#### Achats (1 route)
1. POST /firms/{firmId}/purchases/{id}/upload.json - Upload fichier achat

#### Emails Additionnels (4 routes optionnelles)
1. POST /firms/{firmId}/quotes/{id}/email.json - Déjà présent ✅
2. POST /firms/{firmId}/invoices/{id}/email.json - ❌ Manquant
3. POST /firms/{firmId}/suppliers/{id}/email.json - ❌ Manquant (optionnel)
4. POST /firms/{firmId}/followups/{id}/email.json - ❌ Manquant (optionnel)

---

## CALCUL PRÉCIS DE LA COUVERTURE

### Routes API Prioritaires (sans optionnelles)

| Module | Routes Prioritaires | Dans Postman | Couverture |
|--------|---------------------|--------------|------------|
| Compte | 2 | 2 | 100% |
| Catégories | 5 | 5 | 100% |
| Clients | 9 | 9 | 100% |
| Produits | 5 | 5 | 100% |
| Devis | 11 | 8 | 73% |
| Fournisseurs | 5 | 5 | 100% |
| Factures | 13 | 11 | 85% |
| Achats | 7 | 5 | 71% |
| Suivis | 5 | 0 | 0% |
| **TOTAL** | **62** | **50** | **81%** |

### Routes API Complètes (avec optionnelles)

| Module | Routes Totales | Dans Postman | Couverture |
|--------|----------------|--------------|------------|
| Compte | 2 | 2 | 100% |
| Catégories | 5 | 5 | 100% |
| Clients | 9 | 9 | 100% |
| Produits | 5 | 5 | 100% |
| Devis | 12 | 8 | 67% |
| Fournisseurs | 5 | 5 | 100% |
| Factures | 15 | 11 | 73% |
| Achats | 8 | 5 | 63% |
| Suivis | 5 | 0 | 0% |
| Fichiers | 5 | 0 | 0% |
| Emails | 4 | 1 | 25% |
| **TOTAL** | **75** | **50** | **67%** |

---

## PRIORISATION DES ROUTES MANQUANTES

### 🔴 P0 - Critique (6 routes manquantes)

Routes essentielles pour workflows complets:

1. **GET /firms/{firmId}/quotes/{id}.json** - Détails devis
   - Nécessaire pour consulter un devis avant modification

2. **DELETE /firms/{firmId}/quotes/{id}.json** - Supprimer devis
   - Nécessaire pour supprimer brouillons

3. **GET /firms/{firmId}/quotes/{id}.pdf** - PDF devis
   - Nécessaire pour télécharger/envoyer le PDF

4. **POST /firms/{firmId}/invoices/{id}/upload.json** - Upload facture
   - Nécessaire pour joindre justificatifs

5. **POST /firms/{firmId}/invoices/{id}/email.json** - Envoyer facture
   - Nécessaire pour workflow envoi client

6. **POST /firms/{firmId}/purchases/{id}/upload.json** - Upload achat
   - Nécessaire pour joindre factures fournisseurs

### 🟡 P1 - Important (5 routes)

Module Suivis Commerciaux complet:

1. GET /firms/{firmId}/followups.json
2. POST /firms/{firmId}/followups.json
3. GET /firms/{firmId}/followups/{id}.json
4. PATCH /firms/{firmId}/followups/{id}.json
5. DELETE /firms/{firmId}/followups/{id}.json

### 🟢 P2 - Optionnel (9 routes)

Routes fichiers et emails additionnels:

1-5. Module Fichiers complet (5 routes)
6-9. Emails fournisseurs/suivis (4 routes)

---

## PLAN D'ACTION POUR ATTEINDRE 100%

### Étape 1: Compléter P0 (30 min)

Ajouter 6 routes manquantes critiques dans modules existants:

```json
// Dans module Devis
GET /firms/{firmId}/quotes/{id}.json
DELETE /firms/{firmId}/quotes/{id}.json
GET /firms/{firmId}/quotes/{id}.pdf

// Dans module Factures
POST /firms/{firmId}/invoices/{id}/upload.json
POST /firms/{firmId}/invoices/{id}/email.json

// Dans module Achats
POST /firms/{firmId}/purchases/{id}/upload.json
```

**Couverture après P0**: 56/62 = **90%**

### Étape 2: Ajouter module Suivis (45 min)

Nouveau module avec 5 routes CRUD.

**Couverture après P1**: 61/62 = **98%**

### Étape 3: Ajouter module Fichiers (45 min)

5 routes optionnelles pour gestion fichiers globale.

**Couverture après P2**: 66/75 = **88%**

---

## CORRECTION DU RAPPORT

### Calcul Correct

**Routes prioritaires**: 62 (sans optionnelles Fichiers/Emails avancés)
**Routes présentes**: 50
**Couverture réelle**: **50/62 = 81%** (et non 71%)

**Routes manquantes critiques (P0)**: 6 routes
**Routes manquantes importantes (P1)**: 5 routes (Suivis)
**Routes optionnelles (P2)**: 9 routes (Fichiers + Emails avancés)

### Récapitulatif

Les **29% manquants** se décomposent en :
- **10%** = 6 routes P0 critiques (Devis détails/PDF, Factures email/upload, Achats upload)
- **8%** = 5 routes P1 importantes (Module Suivis complet)
- **11%** = 9 routes P2 optionnelles (Module Fichiers + Emails avancés)

---

## RECOMMANDATION

Pour atteindre **100% de couverture des routes prioritaires (P0+P1)**:

1. ✅ Ajouter 6 routes P0 dans modules existants (30 min)
   → **Couverture: 90%**

2. ✅ Ajouter module Suivis P1 (45 min)
   → **Couverture: 98%**

**Temps total pour 98%**: **1h15**

Les 9 routes P2 (Fichiers/Emails avancés) sont **optionnelles** et peu utilisées en pratique.

---

**Document généré le 7 octobre 2025**
**Couverture actuelle correcte: 81% (et non 71%)**
