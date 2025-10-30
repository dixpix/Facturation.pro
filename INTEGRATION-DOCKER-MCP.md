# 🐳 Plan d'intégration Docker MCP Toolkit
# Facturation.PRO MCP Server

**Date de début** : 2025-10-30
**Status** : 🚧 En cours
**Objectif** : Intégrer le serveur MCP Facturation.PRO avec le Docker MCP Toolkit

---

## 📊 Vue d'ensemble

Ce plan d'intégration transforme le serveur MCP Facturation.PRO existant en une solution conteneurisée compatible avec le Docker MCP Toolkit, permettant :
- ✅ Distribution via le catalogue Docker public
- ✅ Installation zero-friction (pas de Node.js requis)
- ✅ Isolation et sécurité renforcées
- ✅ Intégration native avec Claude Desktop, VS Code, Ask Gordon

---

## 🎯 Phase 1 : Conteneurisation du serveur MCP

### 1.1 Dockerfile multi-stage
- [x] Créer `facturation-pro-mcp-server/Dockerfile`
  - [x] Stage 1 : Builder TypeScript
  - [x] Stage 2 : Runtime Node.js Alpine
  - [x] Configuration user non-root
  - [x] Health check intégré
  - [x] Optimisation couches Docker
  - [x] Labels et métadonnées

### 1.2 Configuration Docker
- [x] Créer `facturation-pro-mcp-server/.dockerignore`
  - [x] Exclusion node_modules
  - [x] Exclusion fichiers de développement
  - [x] Exclusion .env et secrets

### 1.3 Docker Compose
- [x] Créer `facturation-pro-mcp-server/docker-compose.yml`
  - [x] Service MCP avec configuration réseau
  - [x] Montage volume downloads (`~/facturation-pro-mcp/downloads`)
  - [x] Variables d'environnement
  - [x] Limites ressources (1 CPU, 2GB RAM)

### 1.4 Template configuration
- [x] Créer `facturation-pro-mcp-server/.env.example`
  - [x] Documentation variables requises
  - [x] Valeurs d'exemple
  - [x] Instructions de configuration

### 1.5 Tests initiaux Docker
- [x] Build de l'image Docker localement (142MB)
- [x] Test lancement conteneur
- [x] Validation health check
- [ ] Test communication stdio (nécessite variables d'environnement)

**Commit** : `feat: Add Docker containerization support`

---

## 🔧 Phase 2 : Intégration Docker MCP Toolkit

### 2.1 Manifeste Docker MCP
- [x] Créer `facturation-pro-mcp-server/mcp-manifest.json`
  - [x] Métadonnées (nom, version, description)
  - [x] Catégories et tags (12 catégories d'outils)
  - [x] Configuration ressources CPU/RAM (1 CPU, 2GB)
  - [x] Permissions système de fichiers (volume downloads)
  - [x] Documentation utilisateur (quickstart, guides)

### 2.2 Configuration Gateway
- [x] Créer `facturation-pro-mcp-server/docker-mcp-config.json`
  - [x] Configuration gateway Docker MCP
  - [x] Mapping outils MCP (69 outils avec prefixes)
  - [x] Politique de sécurité (isolation, filtering)
  - [x] Configuration stdio transport

### 2.3 Validation compatibilité
- [ ] Test avec `docker mcp` CLI (nécessite Docker Desktop 4.30+)
- [ ] Validation manifeste JSON schema
- [ ] Test enregistrement dans le toolkit

**Commit** : `feat: Add Docker MCP Toolkit integration manifests`

---

## 🔐 Phase 3 : Support OAuth2 (préparation phase publique)

### 3.1 Module OAuth Handler
- [ ] Créer `facturation-pro-mcp-server/src/facturation-pro-mcp-server/auth/oauth-handler.ts`
  - [ ] Gestion flux OAuth2 Facturation.PRO
  - [ ] Échange code → token
  - [ ] Refresh automatique des tokens
  - [ ] Stockage sécurisé tokens
  - [ ] Gestion expiration

### 3.2 Intégration au serveur
- [ ] Modifier `facturation-pro-mcp-server/src/facturation-pro-mcp-server/index.ts`
  - [ ] Détection mode authentification (API key vs OAuth)
  - [ ] Import oauth-handler
  - [ ] Configuration conditionnelle Axios
  - [ ] Fallback clé API si OAuth non configuré
  - [ ] Gestion erreurs OAuth

### 3.3 Variables d'environnement OAuth
- [ ] Mise à jour `.env.example` avec variables OAuth
  - [ ] `FACTURATION_OAUTH_CLIENT_ID`
  - [ ] `FACTURATION_OAUTH_CLIENT_SECRET`
  - [ ] `FACTURATION_OAUTH_REDIRECT_URI`
  - [ ] Documentation choix API key vs OAuth

### 3.4 Tests OAuth
- [ ] Test flux OAuth complet
- [ ] Test refresh token
- [ ] Test fallback vers API key

**Commit** : `feat: Add OAuth2 authentication support`

---

## 🖥️ Phase 4 : Configuration clients

### 4.1 Claude Desktop
- [ ] Créer dossier `facturation-pro-mcp-server/configs/`
- [ ] Créer `configs/claude-desktop.json`
  - [ ] Configuration avec Docker MCP gateway
  - [ ] Exemple variables d'environnement
  - [ ] Instructions installation par OS

### 4.2 Visual Studio Code
- [ ] Créer `configs/vscode-mcp.json`
  - [ ] Configuration Copilot Agent
  - [ ] Intégration via gateway Docker
  - [ ] Instructions activation

### 4.3 Docker MCP Toolkit
- [ ] Créer `configs/docker-mcp-toolkit.sh`
  - [ ] Script enregistrement dans le toolkit
  - [ ] Commandes `docker mcp` pour gestion
  - [ ] Validation configuration

### 4.4 Tests intégration clients
- [ ] Test avec Claude Desktop
- [ ] Test avec VS Code (si disponible)
- [ ] Test avec Ask Gordon

**Commit** : `feat: Add client configurations for Claude Desktop and VS Code`

---

## 🧪 Phase 5 : Tests et validation

### 5.1 Tests d'intégration
- [ ] Créer dossier `facturation-pro-mcp-server/tests/`
- [ ] Créer `tests/integration-test.js`
  - [ ] Test connexion API Facturation.PRO
  - [ ] Test listing clients (validation requise)
  - [ ] Test création client temporaire
  - [ ] Test suppression client (cleanup)
  - [ ] Vérification accès fichiers
  - [ ] Test gestion erreurs API

### 5.2 Tests Docker
- [ ] Créer `tests/docker-test.sh`
  - [ ] Build image Docker
  - [ ] Lancement conteneur avec variables test
  - [ ] Test health check endpoint
  - [ ] Test communication MCP via stdio
  - [ ] Test volume downloads
  - [ ] Nettoyage automatique

### 5.3 Validation complète
- [ ] Exécution tous les tests
- [ ] Validation 69 outils MCP fonctionnels
- [ ] Test avec vraies clés API
- [ ] Documentation résultats tests

**Commit** : `test: Add integration and Docker tests`

---

## 🛠️ Phase 6 : Scripts utilitaires

### 6.1 Script d'installation
- [ ] Créer dossier `facturation-pro-mcp-server/scripts/`
- [ ] Créer `scripts/install.sh`
  - [ ] Détection OS (macOS/Linux/Windows)
  - [ ] Vérification prérequis (Docker installé)
  - [ ] Génération `.env` depuis template
  - [ ] Prompt interactif pour clés API
  - [ ] Configuration automatique Claude Desktop
  - [ ] Test connexion post-installation

### 6.2 Script de publication
- [ ] Créer `scripts/publish-docker-hub.sh`
  - [ ] Build multi-architecture (amd64/arm64)
  - [ ] Tagging semantic versioning
  - [ ] Push vers Docker Hub
  - [ ] Création release notes
  - [ ] Signature image (optionnel)

### 6.3 Script enregistrement Toolkit
- [ ] Créer `scripts/register-toolkit.sh`
  - [ ] Enregistrement dans Docker MCP Toolkit
  - [ ] Configuration gateway automatique
  - [ ] Test connectivité
  - [ ] Affichage statut

### 6.4 Tests scripts
- [ ] Test install.sh en environnement propre
- [ ] Test publish-docker-hub.sh (dry-run)
- [ ] Test register-toolkit.sh

**Commit** : `feat: Add utility scripts for installation and publishing`

---

## 📚 Phase 7 : Documentation complète

### 7.1 Guide Docker
- [ ] Créer `facturation-pro-mcp-server/DOCKER.md`
  - [ ] Introduction Docker MCP
  - [ ] Installation Docker Desktop
  - [ ] Build et lancement image
  - [ ] Configuration docker-compose
  - [ ] Variables d'environnement
  - [ ] Volumes et stockage
  - [ ] Dépannage Docker

### 7.2 Guide Sécurité
- [ ] Créer `facturation-pro-mcp-server/SECURITY.md`
  - [ ] Clarification clés API locales
  - [ ] Comparaison Docker vs native
  - [ ] API key vs OAuth : cas d'usage
  - [ ] Isolation conteneur
  - [ ] Politique accès fichiers
  - [ ] Bonnes pratiques secrets
  - [ ] FAQ sécurité

### 7.3 Guide Publication
- [ ] Créer `facturation-pro-mcp-server/PUBLISHING.md`
  - [ ] Prérequis publication catalogue Docker
  - [ ] Processus soumission
  - [ ] Checklist validation
  - [ ] Critères acceptation Docker
  - [ ] Maintenance et updates
  - [ ] Versioning et changelog

### 7.4 Mise à jour README
- [ ] Modifier `facturation-pro-mcp-server/README.md`
  - [ ] Ajout section "Installation Docker"
  - [ ] Ajout section "Docker MCP Toolkit"
  - [ ] Comparaison méthodes installation
  - [ ] Quick start Docker
  - [ ] Liens vers nouvelles documentations
  - [ ] Badges Docker Hub

### 7.5 Documentation principale
- [ ] Modifier `README.md` (racine projet)
  - [ ] Ajout mention Docker dans vue d'ensemble
  - [ ] Mise à jour section "Technologies"
  - [ ] Ajout liens Docker Hub (après publication)

**Commit** : `docs: Add comprehensive Docker and security documentation`

---

## ✅ Phase 8 : Finalisation et validation

### 8.1 Revue complète
- [ ] Revue code complet
- [ ] Validation couverture tests
- [ ] Vérification cohérence documentation
- [ ] Test installation complète sur machine propre

### 8.2 Optimisations
- [ ] Optimisation taille image Docker
- [ ] Optimisation build time
- [ ] Revue sécurité Dockerfile
- [ ] Validation best practices Docker

### 8.3 Préparation publication
- [ ] Création compte Docker Hub (si nécessaire)
- [ ] Configuration repository Docker Hub
- [ ] Test publication sur registry privé
- [ ] Préparation assets (logo, screenshots)

### 8.4 Commit final et tag
- [ ] Commit final de consolidation
- [ ] Tag version v1.1.0 (avec support Docker)
- [ ] Push vers GitHub
- [ ] Création release GitHub

**Commit** : `chore: Release v1.1.0 with Docker MCP Toolkit support`

---

## 📈 Métriques de succès

- [ ] Image Docker < 50 MB
- [ ] Build time < 2 minutes
- [ ] 69 outils MCP fonctionnels
- [ ] Tests d'intégration passent à 100%
- [ ] Documentation complète et claire
- [ ] Installation en < 5 minutes
- [ ] Zéro dépendances locales (sauf Docker)

---

## 🔗 Ressources

- [Docker MCP Toolkit Documentation](https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Facturation.PRO API Documentation](https://www.facturation.pro/api)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 📝 Notes et décisions

### Décisions architecturales
- **Dossier downloads** : Option B retenue (`~/facturation-pro-mcp/downloads`)
- **Authentification** : Support bi-modal (API key + OAuth2)
- **Sécurité clés** : Variables d'environnement locales (sécurité identique à config actuelle)
- **Multi-arch** : Support amd64 + arm64 pour compatibilité Apple Silicon

### Points d'attention
- L'API Facturation.PRO limite à 600 req/5min (déjà géré par retry)
- Volume downloads nécessite consentement utilisateur (documenté)
- OAuth2 optionnel : fallback vers API key toujours disponible

---

**Dernière mise à jour** : 2025-10-30
