# Guide d'Intégration du Serveur MCP Facturation.PRO

**Date**: 7 octobre 2025
**Version**: 1.0.0

---

## Table des Matières

1. [Introduction](#introduction)
2. [Prérequis](#prérequis)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Intégration avec Claude Desktop](#intégration-avec-claude-desktop)
6. [Intégration avec d'autres IA](#intégration-avec-dautres-ia)
7. [Test et Vérification](#test-et-vérification)
8. [Utilisation](#utilisation)
9. [Dépannage](#dépannage)

---

## Introduction

Le serveur MCP (Model Context Protocol) Facturation.PRO permet aux intelligences artificielles comme Claude d'interagir directement avec l'API Facturation.PRO pour gérer vos devis, factures, clients, produits et achats.

### Qu'est-ce que MCP ?

MCP est un protocole standardisé développé par Anthropic qui permet aux LLM de se connecter à des outils externes de manière sécurisée et structurée.

### Capacités du serveur

Le serveur MCP Facturation.PRO expose **61 outils** permettant de:
- Gérer les clients et fournisseurs
- Créer et modifier des devis
- Gérer les factures et règlements
- Administrer le catalogue produits
- Enregistrer les achats
- Consulter les informations de compte

---

## Prérequis

### Logiciels Requis

- **Node.js** version 18 ou supérieure
- **npm** (inclus avec Node.js)
- **Git** (optionnel, pour cloner le dépôt)

### Vérification des versions

```bash
node --version  # Doit afficher v18.x.x ou supérieur
npm --version   # Doit afficher 9.x.x ou supérieur
```

### Compte Facturation.PRO

Vous devez posséder:
- Un compte actif sur [Facturation.PRO](https://www.facturation.pro)
- Vos identifiants API (API_ID et API_KEY)
- L'ID de votre entreprise (FIRM_ID)

#### Comment obtenir vos identifiants API ?

1. Connectez-vous sur [Facturation.PRO](https://www.facturation.pro)
2. Allez dans **Paramètres** → **API**
3. Notez votre `API_ID`, `API_KEY` et `FIRM_ID`

---

## Installation

### Méthode 1: Installation depuis les sources

```bash
# 1. Cloner le dépôt (ou télécharger le dossier)
git clone <votre-repo>/facturation-pro-mcp-server.git
cd facturation-pro-mcp-server

# 2. Installer les dépendances
npm install

# 3. Compiler le serveur TypeScript
npm run build
```

### Méthode 2: Installation globale (si package npm publié)

```bash
npm install -g facturation-pro-mcp-server
```

### Vérification de l'installation

```bash
# Le dossier build/ doit contenir les fichiers .js compilés
ls build/

# Vous devriez voir:
# facturation-pro-mcp-server/
# ├── index.js
# └── ...
```

---

## Configuration

### Variables d'Environnement

Le serveur MCP nécessite 3 variables d'environnement obligatoires:

| Variable | Description | Exemple |
|----------|-------------|---------|
| `FACTURATION_API_ID` | Votre identifiant API | `votre_api_id` |
| `FACTURATION_API_KEY` | Votre clé API | `votre_api_key_secrete` |
| `FACTURATION_FIRM_ID` | ID de votre entreprise | `12345` |

### Méthode 1: Fichier `.env` (Développement)

Créez un fichier `.env` à la racine du projet:

```bash
# .env
FACTURATION_API_ID=votre_api_id
FACTURATION_API_KEY=votre_api_key_secrete
FACTURATION_FIRM_ID=12345
FACTURATION_BASE_URL=https://www.facturation.pro
```

⚠️ **Sécurité**: Ne commitez jamais ce fichier dans Git ! Ajoutez `.env` à votre `.gitignore`.

### Méthode 2: Configuration dans Claude Desktop (Recommandé)

Les variables d'environnement sont définies directement dans le fichier de configuration de Claude Desktop (voir section suivante).

---

## Intégration avec Claude Desktop

### Localisation du fichier de configuration

Le fichier de configuration se trouve à:

**macOS**:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows**:
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux**:
```
~/.config/Claude/claude_desktop_config.json
```

### Configuration Complète

Ouvrez le fichier `claude_desktop_config.json` et ajoutez:

```json
{
  "mcpServers": {
    "facturation-pro": {
      "command": "node",
      "args": [
        "/chemin/absolu/vers/facturation-pro-mcp-server/build/facturation-pro-mcp-server/index.js"
      ],
      "env": {
        "FACTURATION_API_ID": "votre_api_id",
        "FACTURATION_API_KEY": "votre_api_key_secrete",
        "FACTURATION_FIRM_ID": "12345",
        "FACTURATION_BASE_URL": "https://www.facturation.pro"
      }
    }
  }
}
```

### Exemple Complet (macOS)

```json
{
  "mcpServers": {
    "facturation-pro": {
      "command": "node",
      "args": [
        "/Users/votreuser/Documents/facturation-pro-mcp-server/build/facturation-pro-mcp-server/index.js"
      ],
      "env": {
        "FACTURATION_API_ID": "abc123def456",
        "FACTURATION_API_KEY": "sk_live_xxxxxxxxxxxxx",
        "FACTURATION_FIRM_ID": "9876",
        "FACTURATION_BASE_URL": "https://www.facturation.pro"
      }
    }
  }
}
```

⚠️ **Important**:
- Utilisez des **chemins absolus** (pas de `~` ni de chemins relatifs)
- Remplacez `/Users/votreuser/Documents/...` par le vrai chemin
- Vérifiez que le fichier `index.js` existe à cet emplacement

### Redémarrage de Claude Desktop

Après modification du fichier de configuration:

1. **Quittez complètement** Claude Desktop (⌘+Q sur Mac, pas juste fermer la fenêtre)
2. **Relancez** Claude Desktop
3. Le serveur MCP devrait se connecter automatiquement

---

## Intégration avec d'autres IA

### Compatible avec tous les clients MCP

Le serveur Facturation.PRO est compatible avec tout client implémentant le protocole MCP, notamment:

- **Claude Desktop** (officiel)
- **Cline** (extension VS Code)
- **Continue** (extension VS Code/JetBrains)
- **Zed Editor** (avec support MCP)
- **Autres clients MCP** personnalisés

### Configuration Générique

Le serveur utilise le transport standard **stdio** (stdin/stdout), compatible avec tous les clients MCP.

#### Exemple pour Cline (VS Code)

Fichier: `.vscode/settings.json` ou paramètres utilisateur Cline

```json
{
  "cline.mcpServers": {
    "facturation-pro": {
      "command": "node",
      "args": [
        "/chemin/absolu/vers/build/facturation-pro-mcp-server/index.js"
      ],
      "env": {
        "FACTURATION_API_ID": "votre_api_id",
        "FACTURATION_API_KEY": "votre_api_key",
        "FACTURATION_FIRM_ID": "12345"
      }
    }
  }
}
```

#### Exemple pour Continue

Fichier: `~/.continue/config.json`

```json
{
  "mcpServers": [
    {
      "name": "facturation-pro",
      "command": "node",
      "args": [
        "/chemin/absolu/vers/build/facturation-pro-mcp-server/index.js"
      ],
      "env": {
        "FACTURATION_API_ID": "votre_api_id",
        "FACTURATION_API_KEY": "votre_api_key",
        "FACTURATION_FIRM_ID": "12345"
      }
    }
  ]
}
```

---

## Test et Vérification

### Test 1: Lancement Manuel

Testez le serveur en mode standalone:

```bash
cd /chemin/vers/facturation-pro-mcp-server

# Définir les variables d'environnement
export FACTURATION_API_ID="votre_api_id"
export FACTURATION_API_KEY="votre_api_key"
export FACTURATION_FIRM_ID="12345"

# Lancer le serveur
node build/facturation-pro-mcp-server/index.js
```

Vous devriez voir:
```
Facturation.PRO MCP server listening on stdio
```

Appuyez sur `Ctrl+C` pour arrêter.

### Test 2: Vérification dans Claude Desktop

1. Ouvrez Claude Desktop
2. Démarrez une nouvelle conversation
3. Tapez: "Quels outils MCP as-tu disponibles pour Facturation.PRO ?"

Claude devrait lister les 61 outils disponibles:
- `list_customers`
- `create_quote`
- `list_invoices`
- `create_product`
- etc.

### Test 3: Premier Appel API

Demandez à Claude:

```
"Liste mes 5 derniers clients"
```

Claude devrait utiliser l'outil `list_customers` et vous afficher les résultats.

### Vérification des Logs

Les logs du serveur MCP sont visibles dans:

**macOS**:
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

**Console de développement Claude Desktop**:
- Menu → View → Toggle Developer Tools
- Onglet Console

---

## Utilisation

### Commandes de Base

Une fois intégré, vous pouvez demander à Claude:

#### Gestion des Clients

```
"Crée un nouveau client nommé 'ACME Corp' avec l'email contact@acme.com"

"Liste tous mes clients actifs"

"Affiche les détails du client #123"

"Archive le client #456"
```

#### Gestion des Devis

```
"Crée un devis pour le client #123 avec 2 lignes:
- Développement web: 10 jours à 500€/jour
- Hébergement: 1 an à 200€"

"Liste tous les devis en attente"

"Convertis le devis #789 en facture"

"Télécharge le PDF du devis #789"
```

#### Gestion des Factures

```
"Liste toutes les factures impayées"

"Crée une facture pour le client #123"

"Enregistre un règlement de 1500€ sur la facture #456, payé le 2025-10-07 par virement"

"Supprime la facture brouillon #789"
```

#### Gestion des Produits

```
"Crée un produit 'Formation React' à 1200€ HT avec TVA 20%"

"Liste tous les produits du catalogue"

"Modifie le prix du produit #10 à 1500€"
```

#### Gestion des Achats

```
"Enregistre un achat fournisseur #5 pour 500€ de matériel informatique"

"Liste tous les achats du mois"
```

### Commandes Avancées

#### Workflow Complet: Devis → Facture → Règlement

```
1. "Crée un devis pour ACME Corp (client #123) pour une prestation de conseil"

2. "Le devis #789 a été accepté, convertis-le en facture"

3. "Le client a payé 50% de la facture #456 aujourd'hui par virement, enregistre le règlement"

4. "Il a payé les 50% restants 30 jours après, enregistre le second règlement"
```

#### Recherche et Filtrage

```
"Liste tous les devis acceptés du mois dernier"

"Affiche les factures impayées du client #123"

"Quels produits ont 'Formation' dans leur nom ?"
```

---

## Dépannage

### Problème: Le serveur ne démarre pas

**Symptômes**: Claude ne voit pas les outils MCP

**Solutions**:

1. **Vérifier les chemins absolus** dans `claude_desktop_config.json`
   ```bash
   # Vérifier que le fichier existe
   ls -la /chemin/vers/build/facturation-pro-mcp-server/index.js
   ```

2. **Vérifier les variables d'environnement**
   ```json
   // Assurez-vous qu'elles sont bien définies dans le fichier config
   "env": {
     "FACTURATION_API_ID": "...",  // ✅ Doit être présent
     "FACTURATION_API_KEY": "...", // ✅ Doit être présent
     "FACTURATION_FIRM_ID": "..."  // ✅ Doit être présent
   }
   ```

3. **Recompiler le serveur**
   ```bash
   cd /chemin/vers/facturation-pro-mcp-server
   npm run build
   ```

4. **Redémarrer Claude Desktop complètement** (⌘+Q sur Mac)

### Problème: Erreurs d'authentification API

**Symptômes**: Erreurs 401 ou 403 lors des appels

**Solutions**:

1. **Vérifier les identifiants API** sur Facturation.PRO
   - Connectez-vous sur le site
   - Allez dans Paramètres → API
   - Régénérez les clés si nécessaire

2. **Vérifier le format des identifiants**
   ```json
   // ❌ INCORRECT - Avec guillemets en trop
   "FACTURATION_API_ID": "\"abc123\""

   // ✅ CORRECT
   "FACTURATION_API_ID": "abc123"
   ```

3. **Tester avec curl**
   ```bash
   curl -u "API_ID:API_KEY" \
     https://www.facturation.pro/account.json
   ```

### Problème: Lenteur ou timeout

**Symptômes**: Les requêtes prennent trop de temps

**Solutions**:

1. **Vérifier votre connexion internet**

2. **Limiter les résultats avec pagination**
   ```
   "Liste mes clients, page 1 seulement"
   ```

3. **Vérifier le statut de l'API Facturation.PRO**
   - [https://www.facturation.pro/status](https://www.facturation.pro/status)

### Problème: Serveur se déconnecte

**Symptômes**: Les outils MCP disparaissent après quelques minutes

**Solutions**:

1. **Vérifier les logs** dans Console de Claude Desktop

2. **Augmenter les timeouts** (si nécessaire)
   - Par défaut, le serveur utilise les timeouts standards d'axios

3. **Relancer Claude Desktop**

### Logs de Débogage

Pour activer les logs détaillés, modifiez `index.ts`:

```typescript
// Ajouter au début du constructeur
console.error('[DEBUG] Serveur MCP démarré');
console.error('[DEBUG] API_ID:', API_ID ? '✓' : '✗');
console.error('[DEBUG] API_KEY:', API_KEY ? '✓' : '✗');
console.error('[DEBUG] FIRM_ID:', FIRM_ID ? '✓' : '✗');
```

Puis recompiler:
```bash
npm run build
```

---

## Sécurité

### Bonnes Pratiques

✅ **À FAIRE**:
- Utiliser des clés API dédiées pour le MCP
- Ne jamais commiter les fichiers de configuration avec les clés
- Révoquer les clés API compromises immédiatement
- Utiliser des chemins absolus sécurisés

❌ **À NE PAS FAIRE**:
- Partager vos clés API
- Commiter `.env` ou les fichiers de config dans Git
- Utiliser les mêmes clés sur plusieurs environnements
- Donner accès root au serveur MCP

### Révocation des Clés

Si vos clés API sont compromises:

1. Connectez-vous sur Facturation.PRO
2. Allez dans **Paramètres** → **API**
3. Cliquez sur "Révoquer" puis "Régénérer"
4. Mettez à jour `claude_desktop_config.json` avec les nouvelles clés
5. Redémarrez Claude Desktop

---

## Support et Documentation

### Ressources

- **Documentation API**: [https://facturation.dev](https://facturation.dev)
- **Documentation MCP**: [https://modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Support Facturation.PRO**: support@facturation.pro

### Rapports Générés

- [RAPPORT-QUALITE-CODE.md](RAPPORT-QUALITE-CODE.md) - Analyse qualité du code
- [RAPPORT-ALIGNEMENT-ROUTES.md](RAPPORT-ALIGNEMENT-ROUTES.md) - État d'alignement des routes
- [RAPPORT-MISE-A-JOUR-COMPLETE.md](RAPPORT-MISE-A-JOUR-COMPLETE.md) - Synthèse complète

### Fichiers de Référence

- [facturation_pro_api.md](facturation_pro_api.md) - Documentation source API
- [openapi.yaml](openapi.yaml) - Spécification OpenAPI
- [PLAN-MISE-A-JOUR.md](PLAN-MISE-A-JOUR.md) - Plan de mise à jour

---

## FAQ

### Q: Le serveur MCP consomme-t-il beaucoup de ressources ?

**R**: Non, le serveur est très léger (< 50MB RAM) et ne s'active que lors des appels d'outils.

### Q: Puis-je utiliser plusieurs serveurs MCP en même temps ?

**R**: Oui, Claude Desktop supporte plusieurs serveurs MCP simultanément. Ajoutez simplement d'autres entrées dans `mcpServers`.

### Q: Les données sont-elles stockées localement ?

**R**: Non, le serveur MCP est un simple proxy vers l'API Facturation.PRO. Aucune donnée n'est stockée localement.

### Q: Puis-je limiter les actions autorisées ?

**R**: Actuellement, le serveur donne accès à tous les outils. Pour limiter les permissions, créez une clé API avec des permissions restreintes sur Facturation.PRO.

### Q: Le serveur fonctionne-t-il hors ligne ?

**R**: Non, une connexion internet est requise pour communiquer avec l'API Facturation.PRO.

### Q: Combien coûte l'utilisation du serveur MCP ?

**R**: Le serveur MCP est gratuit. Vous payez uniquement votre abonnement Facturation.PRO.

### Q: Puis-je modifier le code du serveur ?

**R**: Oui, le code est en TypeScript et facilement modifiable. Après modification, recompilez avec `npm run build`.

---

## Licence

Le serveur MCP Facturation.PRO est fourni tel quel, sans garantie.

---

**Document généré le 7 octobre 2025**
**Version 1.0.0**
**Support**: Consultez la documentation ou contactez support@facturation.pro
