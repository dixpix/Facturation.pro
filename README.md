# Facturation.pro - OpenAPI, Postman et MCP

Ce dépôt non officiel contient l'ensemble des outils d'intégration avec l'API de [Facturation.pro](https://www.facturation.pro), un service de facturation en ligne pour les professionnels. Il est basé sur la documentation officielle fournie par la société ainsi que son support au format .md proposé pour LLM.

## 📦 Contenu du projet

- **[openapi.yaml](openapi.yaml)** : Spécification OpenAPI 3.0.3 complète de l'API Facturation.pro (69 routes)
- **[postman_collection.json](postman_collection.json)** : Collection Postman v2.1.0 pour tester l'API (100% de couverture)
- **[facturation-pro-mcp-server/](facturation-pro-mcp-server/)** : Serveur MCP (Model Context Protocol) pour intégrer l'API avec les IA
- **[docs/Documentation_LLM_officielle.md](docs/Documentation_LLM_officielle.md)** : Documentation complète de l'API au format Markdown optimisé pour les LLM fourni par la documentation officielle (https://facturation.dev/llm)

## 🎯 Couverture de l'API

| Outil | Couverture | Routes |
|-------|------------|--------|
| **OpenAPI** | 100% | 69/69 routes documentées |
| **Postman** | 100% | 59 requêtes couvrant les 69 routes |
| **MCP Server** | 100% | 69 outils correspondant aux 69 routes |

### Modules couverts

- ✅ **Achats** (5 routes CRUD + 2 routes spéciales)
- ✅ **Catégories** (5 routes CRUD)
- ✅ **Clients** (8 routes incluant archivage et upload)
- ✅ **Compte** (2 routes d'information)
- ✅ **Devis** (8 routes incluant conversion et email)
- ✅ **Factures** (11 routes incluant règlements et email)
- ✅ **Fournisseurs** (5 routes CRUD)
- ✅ **Pièces jointes** (3 routes de gestion)
- ✅ **Produits** (6 routes CRUD + upload)
- ✅ **Règlements** (5 routes de gestion)
- ✅ **Suivis commerciaux** (5 routes CRUD)
- ✅ **Tâches** (5 routes CRUD)
- ✅ **Utilisateurs** (2 routes de liste)

## 🚀 Démarrage rapide

### 1. OpenAPI

Utilisez le fichier `openapi.yaml` avec des outils compatibles OpenAPI :

```bash
# Avec Swagger UI
docker run -p 8080:8080 -e SWAGGER_JSON=/openapi.yaml -v $(pwd):/usr/share/nginx/html swaggerapi/swagger-ui

# Avec Redoc
npx @redocly/cli preview-docs openapi.yaml
```

### 2. Postman

Importez la collection dans Postman :

1. Ouvrez Postman
2. Cliquez sur **Import**
3. Sélectionnez `postman_collection.json`
4. Configurez les variables d'environnement :
   - `IDENTIFIANT_API` : Votre identifiant API
   - `CLE_API` : Votre clé API
   - `baseUrl` : https://www.facturation.pro
   - `firmId` : ID de votre entreprise
   - `userAgent` : MonApp (contact@example.com)

### 3. MCP Server

Le serveur MCP permet d'intégrer l'API Facturation.pro avec les intelligences artificielles compatibles MCP (Claude Desktop, Cline, etc.).

**Installation rapide avec Docker Compose (RECOMMANDÉE)** :

```bash
cd facturation-pro-mcp-server
cp .env.example .env
# Éditez .env avec vos identifiants API
docker-compose up -d
```

**Installation native (alternative)** :

```bash
cd facturation-pro-mcp-server
npm install
npm run build
```

📖 **Documentation complète** : Consultez [facturation-pro-mcp-server/README.md](facturation-pro-mcp-server/README.md) pour :
- Configuration détaillée de Docker Compose
- Configuration pour Claude Desktop
- Liste complète des 69 outils disponibles
- Guide de debugging et développement

## 📖 Documentation

- **[Documentation API pour LLM](facturation_pro_api.md)** : Guide complet optimisé pour les intelligences artificielles
- **[Documentation OpenAPI](openapi.yaml)** : Spécification technique complète
- **[Rapport de couverture](RAPPORT-COUVERTURE-API.md)** : Analyse détaillée de la couverture OpenAPI/Postman/MCP

## 🔑 Authentification

L'API Facturation.pro utilise l'authentification HTTP Basic avec votre clé API :

```bash
curl -u IdentifiantApi:CleApi \
  -H "User-Agent: MonApp (contact@example.com)" \
  https://www.facturation.pro/firms/FIRM_ID/customers.json
```

**Important** : Incluez toujours un User-Agent avec vos coordonnées de contact.

## 🔗 Informations SEPA

L'API permet la gestion complète des informations SEPA des clients via 4 champs :

- `sepa_iban` : IBAN du client
- `sepa_bic` : BIC du client
- `sepa_rum` : RUM (Référence Unique de Mandat)
- `sepa_signature_on` : Date de signature du mandat

**Note** : L'accès aux données SEPA nécessite la clé API de l'administrateur et le paramètre `with_sepa=1`.

## 📋 Limitations

- **600 requêtes** par période de 5 minutes (2 req/sec en moyenne)
- **10 000 requêtes** par jour
- **50 résultats** par page pour les listes

## 🛠️ Technologies

- **OpenAPI** : 3.0.3
- **Postman Collection** : v2.1.0
- **MCP Server** : TypeScript, Axios, @modelcontextprotocol/sdk v0.5.0
- **API** : REST JSON

## 📝 Licence

Ce projet contient des outils d'intégration avec l'API Facturation.pro. Consultez les conditions d'utilisation de Facturation.pro pour l'usage de l'API.

## 🤝 Support

- **Documentation officielle** : https://www.facturation.dev
- **Support Facturation.pro** : via votre compte
- **Issues GitHub** : Pour les outils d'intégration de ce dépôt

## 📊 Statut du projet

- ✅ **OpenAPI** : Conforme à 100% (69/69 routes)
- ✅ **Postman** : Couverture à 100%
- ✅ **MCP Server** : Conforme à 100% (69 outils)
- ✅ **Documentation** : À jour

---

**Note** : Ce projet est non officiel et s'appuie sur l'API Facturation.pro. 
