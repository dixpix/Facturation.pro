# Facturation.pro MCP Server

Serveur MCP (Model Context Protocol) pour intégrer l'API Facturation.pro avec les intelligences artificielles compatibles MCP (Claude Desktop, Cline, etc.).

## 📋 Description

Ce serveur expose **69 outils** correspondant à 100% des routes de l'API Facturation.pro, permettant aux IA d'interagir directement avec votre compte de facturation.

## ✨ Fonctionnalités

### Modules couverts (100% de l'API)

- ✅ **Achats** : CRUD complet + upload de justificatifs
- ✅ **Catégories** : Gestion des catégories de dépenses/revenus
- ✅ **Clients** : CRUD + archivage + upload de fichiers + données SEPA
- ✅ **Compte** : Informations utilisateur et abonnements
- ✅ **Devis** : CRUD + conversion en facture + envoi par email
- ✅ **Factures** : CRUD + règlements + envoi par email
- ✅ **Fournisseurs** : Gestion complète avec données SEPA
- ✅ **Pièces jointes** : Upload et téléchargement
- ✅ **Produits** : Catalogue produits + upload d'images
- ✅ **Règlements** : Gestion des paiements partiels
- ✅ **Suivis commerciaux** : Suivi des opportunités commerciales
- ✅ **Tâches** : Gestion de tâches liées aux clients
- ✅ **Utilisateurs** : Liste des collaborateurs

## 🚀 Installation

### Méthode 1 : Docker Compose (RECOMMANDÉE) 🐳

**Prérequis** :
- Docker et Docker Compose installés
- Compte Facturation.pro avec clé API

**Avantages** :
- ✅ Pas besoin de Node.js ou npm
- ✅ Isolation complète de l'environnement
- ✅ Gestion automatique des dépendances
- ✅ Configuration simplifiée via fichier `.env`

**Installation** :

1. **Copier le fichier de configuration** :
   ```bash
   cd facturation-pro-mcp-server
   cp .env.example .env
   ```

2. **Éditer le fichier `.env`** avec vos identifiants :
   ```env
   FACTURATION_API_ID=654321
   FACTURATION_API_KEY=VotreCleAPI
   FACTURATION_FIRM_ID=123456
   FACTURATION_USER_AGENT="MonApp (contact@example.com)"
   FACTURATION_BASE_URL=https://www.facturation.pro
   ```

3. **Démarrer le serveur** :
   ```bash
   docker-compose up -d
   ```

Le serveur démarre en arrière-plan et redémarre automatiquement en cas d'arrêt.

### Méthode 2 : Installation native (ALTERNATIVE)

**Prérequis** :
- Node.js 16+
- npm ou yarn
- Compte Facturation.pro avec clé API

**Pour qui** : Utilisateurs avancés, développement, ou environnements sans Docker.

**Installation des dépendances** :

```bash
cd facturation-pro-mcp-server
npm install
```

**Construction** :

```bash
npm run build
```

Le serveur compilé sera disponible dans `build/index.js`.

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
FACTURATION_API_ID=654321
FACTURATION_API_KEY=VotreCleAPI
FACTURATION_FIRM_ID=123456
FACTURATION_USER_AGENT="MonApp (contact@example.com)"
FACTURATION_BASE_URL=https://www.facturation.pro
```

**Important** : Le `USER_AGENT` doit contenir vos coordonnées de contact (nom de l'application et email) comme requis par l'API Facturation.pro.

### Configuration MCP (Claude Desktop)

Selon la méthode d'installation choisie, ajoutez la configuration appropriée dans le fichier `claude_desktop_config.json`.

**Emplacements du fichier de configuration :**

- **macOS** : `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows** : `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux** : `~/.config/Claude/claude_desktop_config.json`

#### Option A : Avec Docker Compose (RECOMMANDÉE)

```json
{
  "mcpServers": {
    "facturation-pro": {
      "command": "docker",
      "args": [
        "compose",
        "-f",
        "/chemin/absolu/vers/facturation-pro-mcp-server/docker-compose.yml",
        "run",
        "--rm",
        "facturation-mcp"
      ]
    }
  }
}
```

**Avantages** :
- ✅ Configuration simplifiée (credentials dans `.env`)
- ✅ Pas besoin de répéter les variables d'environnement
- ✅ Isolation complète de l'environnement

**Note** : Remplacez `/chemin/absolu/vers/facturation-pro-mcp-server/` par le chemin complet vers le dossier du serveur MCP.

#### Option B : Avec installation native

```json
{
  "mcpServers": {
    "facturation-pro": {
      "command": "node",
      "args": [
        "/chemin/absolu/vers/facturation-pro-mcp-server/build/index.js"
      ],
      "env": {
        "FACTURATION_API_ID": "VotreIdentifiant",
        "FACTURATION_API_KEY": "VotreCleAPI",
        "FACTURATION_FIRM_ID": "123456",
        "FACTURATION_USER_AGENT": "MonApp (contact@example.com)",
        "FACTURATION_BASE_URL": "https://www.facturation.pro"
      }
    }
  }
}
```

**Note** : Remplacez les valeurs `VotreIdentifiant`, `VotreCleAPI`, etc. par vos véritables identifiants.

### Obtenir vos identifiants API

1. Connectez-vous à [Facturation.pro](https://www.facturation.pro)
2. Cliquez sur votre avatar en haut à droite
3. Sélectionnez **"Clé API"**
4. Notez votre **Identifiant API** et votre **Clé API**
5. Notez également le **FIRM_ID** de votre entreprise

## 🐳 Configuration Docker (avec Docker Compose)

### Variables d'environnement Docker

Le fichier `.env` contient toutes les variables nécessaires :

```env
# Identifiants API Facturation.pro
FACTURATION_API_ID=VotreIdentifiant
FACTURATION_API_KEY=VotreCleAPI
FACTURATION_FIRM_ID=123456

# Configuration de l'agent utilisateur (REQUIS)
FACTURATION_USER_AGENT="MonApp (contact@example.com)"

# URL de base de l'API
FACTURATION_BASE_URL=https://www.facturation.pro

# Port exposé (optionnel, par défaut 3000)
PORT=3000
```

**Important** : Le `USER_AGENT` doit contenir vos coordonnées de contact (nom de l'application et email) comme requis par l'API Facturation.pro.

### Commandes Docker Compose utiles

```bash
# Démarrer le serveur en arrière-plan
docker-compose up -d

# Voir les logs en temps réel
docker-compose logs -f

# Voir les logs des dernières 100 lignes
docker-compose logs --tail=100

# Arrêter le serveur
docker-compose down

# Redémarrer le serveur
docker-compose restart

# Reconstruire l'image et redémarrer (après modification du code)
docker-compose up -d --build

# Vérifier l'état du serveur
docker-compose ps

# Voir l'utilisation des ressources
docker stats facturation-mcp
```

### Volume Docker

Le serveur utilise un volume Docker pour stocker les fichiers téléchargés :

- **Volume** : `./downloads` (monté sur `/app/downloads` dans le conteneur)
- **Usage** : Stockage temporaire des PDF, pièces jointes, etc.

Ce volume persiste les fichiers même après l'arrêt du conteneur.

### Healthcheck

Le conteneur Docker inclut un healthcheck qui vérifie automatiquement que le serveur fonctionne correctement :

- **Intervalle** : Vérifie toutes les 30 secondes
- **Timeout** : 10 secondes maximum par vérification
- **Retries** : 3 tentatives avant de marquer le conteneur comme "unhealthy"

Vérifiez le statut avec `docker-compose ps` - la colonne STATUS doit afficher "(healthy)".

## 🎯 Utilisation

### Démarrage manuel

```bash
npm start
```

Le serveur écoute sur stdin/stdout selon le protocole MCP.

### Utilisation avec Claude Desktop

Une fois configuré, redémarrez Claude Desktop. Les outils Facturation.pro seront automatiquement disponibles.

**Exemples de commandes** :

```
"Liste tous mes clients"
"Crée une facture pour le client ID 123 avec un produit à 100€ HT"
"Envoie la facture 456 par email à client@example.com"
"Affiche tous mes devis en attente"
"Convertis le devis 789 en facture"
```

## 🛠️ Outils disponibles

### Achats (7 outils)

- `list_purchases` : Liste des achats avec filtres
- `create_purchase` : Créer un achat
- `get_purchase` : Détails d'un achat
- `update_purchase` : Modifier un achat
- `delete_purchase` : Supprimer un achat
- `upload_purchase_file` : Ajouter un justificatif
- `list_recurring_purchases` : Liste des achats récurrents

### Catégories (5 outils)

- `list_categories` : Liste des catégories
- `create_category` : Créer une catégorie
- `get_category` : Détails d'une catégorie
- `update_category` : Modifier une catégorie
- `delete_category` : Supprimer une catégorie

### Clients (8 outils)

- `list_customers` : Liste des clients avec filtres
- `create_customer` : Créer un client (**⚠️ SIRET obligatoire pour professionnels français**)
- `get_customer` : Détails d'un client (avec option SEPA)
- `update_customer` : Modifier un client (**⚠️ SIRET obligatoire pour professionnels français**)
- `delete_customer` : Supprimer un client
- `archive_customer` : Archiver un client
- `unarchive_customer` : Restaurer un client archivé
- `upload_customer_file` : Ajouter un fichier

### Compte (2 outils)

- `get_account_info` : Informations du compte utilisateur
- `list_subscription_orders` : Liste des commandes d'abonnement

### Devis (8 outils)

- `list_quotes` : Liste des devis avec filtres
- `create_quote` : Créer un devis
- `get_quote` : Détails d'un devis
- `update_quote` : Modifier un devis
- `delete_quote` : Supprimer un devis
- `download_quote` : Télécharger un devis en PDF
- `convert_quote_to_invoice` : Convertir un devis en facture
- `upload_quote_file` : Ajouter une pièce jointe

### Factures (11 outils)

- `list_invoices` : Liste des factures avec filtres
- `create_invoice` : Créer une facture
- `get_invoice` : Détails d'une facture
- `update_invoice` : Modifier une facture
- `delete_invoice` : Supprimer une facture
- `download_invoice` : Télécharger une facture en PDF
- `upload_invoice_file` : Ajouter une pièce jointe
- `create_settlement` : Créer un règlement
- `get_settlement` : Détails d'un règlement
- `update_settlement` : Modifier un règlement
- `delete_settlement` : Supprimer un règlement
- `send_invoice_email` : Envoyer une facture par email

### Fournisseurs (5 outils)

- `list_suppliers` : Liste des fournisseurs
- `create_supplier` : Créer un fournisseur
- `get_supplier` : Détails d'un fournisseur
- `update_supplier` : Modifier un fournisseur
- `delete_supplier` : Supprimer un fournisseur

### Pièces jointes (3 outils)

- `get_asset` : Détails d'une pièce jointe
- `delete_asset` : Supprimer une pièce jointe
- `download_asset` : Télécharger une pièce jointe

### Produits (6 outils)

- `list_products` : Liste des produits
- `create_product` : Créer un produit
- `get_product` : Détails d'un produit
- `update_product` : Modifier un produit
- `delete_product` : Supprimer un produit
- `upload_product_image` : Ajouter une image

### Suivis commerciaux (5 outils)

- `list_followups` : Liste des suivis avec filtres
- `create_followup` : Créer un suivi
- `get_followup` : Détails d'un suivi
- `update_followup` : Modifier un suivi
- `delete_followup` : Supprimer un suivi

### Tâches (5 outils)

- `list_tasks` : Liste des tâches
- `create_task` : Créer une tâche
- `get_task` : Détails d'une tâche
- `update_task` : Modifier une tâche
- `delete_task` : Supprimer une tâche

### Utilisateurs (2 outils)

- `list_users` : Liste des utilisateurs
- `get_user` : Détails d'un utilisateur

## 📊 Couverture de l'API

| Métrique | Valeur |
|----------|--------|
| **Routes API** | 69 |
| **Outils MCP** | 69 |
| **Couverture** | 100% |
| **Modules** | 13 |

## 🔒 Sécurité

- Les identifiants API sont stockés uniquement en variables d'environnement
- Aucune donnée n'est persistée localement par le serveur MCP
- Toutes les requêtes utilisent HTTPS
- Authentification HTTP Basic avec clé API

**⚠️ Important** : Ne commitez jamais vos identifiants API dans Git.

## 🐛 Debugging

### Activer les logs détaillés

```bash
DEBUG=* npm start
```

### Vérifier la configuration MCP

Depuis Claude Desktop, les erreurs MCP sont visibles dans :
- **macOS** : `~/Library/Logs/Claude/mcp*.log`
- **Windows** : `%APPDATA%\Claude\logs\mcp*.log`
- **Linux** : `~/.config/Claude/logs/mcp*.log`

### Tester manuellement

```bash
# Lancer le serveur
npm start

# Dans un autre terminal, envoyer une requête MCP
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js
```

## 📝 Développement

### Structure du projet

```
facturation-pro-mcp-server/
├── src/
│   └── facturation-pro-mcp-server/
│       └── index.ts          # Code source principal
├── build/                    # Code compilé (généré)
├── package.json
├── tsconfig.json
└── README.md
```

### Scripts disponibles

```bash
npm run build    # Compiler TypeScript
npm start        # Lancer le serveur
npm run watch    # Mode développement avec rechargement
```

### Ajouter un nouvel outil

1. Ajouter la définition dans le tableau `tools` (méthode `server.setRequestHandler` pour `ListToolsRequestSchema`)
2. Ajouter le case dans le switch du handler `CallToolRequestSchema`
3. Implémenter la méthode handler privée correspondante

## 🤝 Contribution

Les contributions sont les bienvenues ! Assurez-vous que :

1. Le code compile sans erreur : `npm run build`
2. Les outils sont testés manuellement
3. La documentation est mise à jour

## 📄 Licence

Ce serveur MCP est un outil d'intégration avec l'API Facturation.pro. Consultez les conditions d'utilisation de Facturation.pro pour l'usage de l'API.

## 🔗 Liens utiles

- [Documentation MCP](https://modelcontextprotocol.io/)
- [API Facturation.pro](https://www.facturation.pro/api)
- [Spécification OpenAPI](../openapi.yaml)
- [Collection Postman](../postman_collection.json)

## 📞 Support

Pour les questions sur :
- **Le serveur MCP** : Ouvrir une issue sur ce dépôt
- **L'API Facturation.pro** : Support officiel via votre compte
- **Le protocole MCP** : [Documentation MCP](https://modelcontextprotocol.io/)

---

**Version** : 1.0.0
**Statut** : ✅ Production ready - 100% de couverture de l'API
