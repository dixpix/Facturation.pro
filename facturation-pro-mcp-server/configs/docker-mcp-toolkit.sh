#!/bin/bash

# =============================================================================
# Script d'enregistrement Facturation.pro MCP Server
# dans le Docker MCP Toolkit
# =============================================================================
#
# Ce script enregistre le serveur MCP Facturation.pro dans le Docker MCP
# Toolkit de Docker Desktop, permettant son utilisation avec Claude Desktop,
# VS Code et autres clients MCP.
#
# Prérequis :
# - Docker Desktop 4.30+ installé
# - Docker MCP Toolkit activé
# - Image facturation-pro-mcp-server buildée
#
# Usage :
#   ./configs/docker-mcp-toolkit.sh
#
# =============================================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_NAME="facturation-pro"
IMAGE_NAME="facturation-pro-mcp-server:latest"
DOWNLOADS_DIR="${HOME}/facturation-pro-mcp/downloads"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Facturation.pro MCP Server - Docker MCP Toolkit Setup       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# Fonction : Vérification des prérequis
# =============================================================================
check_prerequisites() {
    echo -e "${YELLOW}🔍 Vérification des prérequis...${NC}"

    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker n'est pas installé${NC}"
        echo "Installez Docker Desktop : https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Docker installé"

    # Vérifier que Docker tourne
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker n'est pas lancé${NC}"
        echo "Lancez Docker Desktop et réessayez"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Docker Desktop en cours d'exécution"

    # Vérifier version Docker Desktop
    DOCKER_VERSION=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓${NC} Docker version : $DOCKER_VERSION"

    # Vérifier Docker MCP CLI
    if docker mcp --help &> /dev/null; then
        echo -e "${GREEN}✓${NC} Docker MCP Toolkit disponible"
    else
        echo -e "${YELLOW}⚠${NC}  Docker MCP Toolkit CLI non disponible"
        echo "   Note : Ceci est normal si vous n'avez pas Docker Desktop 4.30+"
        echo "   Le serveur peut quand même être utilisé avec docker run"
    fi

    # Vérifier l'image Docker
    if docker image inspect "$IMAGE_NAME" &> /dev/null; then
        IMAGE_SIZE=$(docker image inspect "$IMAGE_NAME" --format='{{.Size}}' | numfmt --to=iec 2>/dev/null || echo "unknown")
        echo -e "${GREEN}✓${NC} Image Docker buildée (taille: $IMAGE_SIZE)"
    else
        echo -e "${RED}❌ Image Docker non trouvée : $IMAGE_NAME${NC}"
        echo "Buildez l'image avec : docker build -t $IMAGE_NAME ."
        exit 1
    fi

    echo ""
}

# =============================================================================
# Fonction : Création du dossier downloads
# =============================================================================
create_downloads_dir() {
    echo -e "${YELLOW}📁 Configuration du dossier downloads...${NC}"

    if [ ! -d "$DOWNLOADS_DIR" ]; then
        mkdir -p "$DOWNLOADS_DIR"
        echo -e "${GREEN}✓${NC} Dossier créé : $DOWNLOADS_DIR"
    else
        echo -e "${GREEN}✓${NC} Dossier existe déjà : $DOWNLOADS_DIR"
    fi

    # Vérifier les permissions
    if [ -w "$DOWNLOADS_DIR" ]; then
        echo -e "${GREEN}✓${NC} Permissions en écriture OK"
    else
        echo -e "${YELLOW}⚠${NC}  Attention : Permissions en écriture manquantes"
        echo "   Exécutez : chmod 755 $DOWNLOADS_DIR"
    fi

    echo ""
}

# =============================================================================
# Fonction : Configuration des variables d'environnement
# =============================================================================
configure_env_vars() {
    echo -e "${YELLOW}🔑 Configuration des identifiants API...${NC}"

    # Vérifier si les variables sont déjà définies
    if [ -n "$FACTURATION_API_ID" ] && [ -n "$FACTURATION_API_KEY" ] && [ -n "$FACTURATION_FIRM_ID" ]; then
        echo -e "${GREEN}✓${NC} Variables d'environnement détectées"
        echo "   API ID: ${FACTURATION_API_ID:0:10}***"
        echo "   FIRM ID: $FACTURATION_FIRM_ID"
        return 0
    fi

    echo ""
    echo -e "${BLUE}Les variables d'environnement ne sont pas configurées.${NC}"
    echo "Vous devrez les définir dans la configuration de votre client MCP."
    echo ""
    echo "Obtenez vos credentials sur : https://www.facturation.pro/account/api"
    echo ""
    echo "Variables requises :"
    echo "  - FACTURATION_API_ID : Votre identifiant API"
    echo "  - FACTURATION_API_KEY : Votre clé API"
    echo "  - FACTURATION_FIRM_ID : L'ID de votre entreprise"
    echo "  - FACTURATION_USER_AGENT : Votre application et email"
    echo ""
}

# =============================================================================
# Fonction : Enregistrement dans Docker MCP Toolkit
# =============================================================================
register_mcp_server() {
    echo -e "${YELLOW}📝 Enregistrement dans Docker MCP Toolkit...${NC}"

    # Vérifier si la commande docker mcp existe
    if ! docker mcp --help &> /dev/null; then
        echo -e "${YELLOW}⚠${NC}  Docker MCP CLI non disponible"
        echo "   Configuration manuelle nécessaire (voir ci-dessous)"
        return 1
    fi

    # Tenter l'enregistrement
    echo "Tentative d'enregistrement du serveur..."

    # Note : La commande exacte peut varier selon la version du toolkit
    # Cette section sera mise à jour lorsque la documentation officielle sera disponible

    if docker mcp server add "$SERVER_NAME" \
        --image "$IMAGE_NAME" \
        --volume "$DOWNLOADS_DIR:/app/downloads" \
        --protocol stdio \
        2>/dev/null; then
        echo -e "${GREEN}✓${NC} Serveur enregistré avec succès"
        return 0
    else
        echo -e "${YELLOW}⚠${NC}  Enregistrement automatique non disponible"
        echo "   Configuration manuelle nécessaire"
        return 1
    fi
}

# =============================================================================
# Fonction : Test de connexion
# =============================================================================
test_connection() {
    echo -e "${YELLOW}🧪 Test de connexion au serveur MCP...${NC}"

    # Test basique : lancer le conteneur et vérifier qu'il démarre
    echo "Lancement du conteneur de test..."

    if docker run --rm --entrypoint node "$IMAGE_NAME" -e "console.log('OK')" &> /dev/null; then
        echo -e "${GREEN}✓${NC} Conteneur fonctionnel"
    else
        echo -e "${RED}❌${NC} Erreur lors du test du conteneur"
        return 1
    fi

    echo ""
}

# =============================================================================
# Fonction : Affichage des instructions de configuration
# =============================================================================
show_configuration_instructions() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Instructions de configuration                                ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${YELLOW}📌 Claude Desktop${NC}"
    echo ""
    echo "Fichier de configuration :"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  ~/Library/Application Support/Claude/claude_desktop_config.json"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "  ~/.config/Claude/claude_desktop_config.json"
    else
        echo "  %APPDATA%\\Claude\\claude_desktop_config.json"
    fi
    echo ""
    echo "Configuration recommandée :"
    cat << 'EOF'
{
  "mcpServers": {
    "facturation-pro": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-v", "${HOME}/facturation-pro-mcp/downloads:/app/downloads",
        "-e", "FACTURATION_API_ID",
        "-e", "FACTURATION_API_KEY",
        "-e", "FACTURATION_FIRM_ID",
        "-e", "FACTURATION_USER_AGENT",
        "facturation-pro-mcp-server:latest"
      ],
      "env": {
        "FACTURATION_API_ID": "votre_identifiant",
        "FACTURATION_API_KEY": "votre_cle",
        "FACTURATION_FIRM_ID": "votre_firm_id",
        "FACTURATION_USER_AGENT": "MonApp (email@exemple.com)"
      }
    }
  }
}
EOF
    echo ""
    echo "Voir le fichier complet : configs/claude-desktop.json"
    echo ""

    echo -e "${YELLOW}📌 VS Code${NC}"
    echo ""
    echo "Fichier de configuration :"
    echo "  .vscode/settings.json (ou User Settings)"
    echo ""
    echo "Voir le fichier complet : configs/vscode-mcp.json"
    echo ""

    echo -e "${YELLOW}📌 Docker Compose${NC}"
    echo ""
    echo "Alternative recommandée :"
    echo "  docker-compose up -d"
    echo ""
    echo "Voir le fichier : docker-compose.yml"
    echo ""
}

# =============================================================================
# Fonction : Résumé final
# =============================================================================
show_summary() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Installation terminée !                                      ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}✓${NC} Le serveur MCP Facturation.pro est prêt à être utilisé"
    echo ""
    echo "Prochaines étapes :"
    echo "  1. Configurez vos identifiants API dans votre client MCP"
    echo "  2. Redémarrez votre client MCP (Claude Desktop, VS Code, etc.)"
    echo "  3. Testez avec : 'Liste mes clients'"
    echo ""
    echo "Documentation complète :"
    echo "  - README.md"
    echo "  - DOCKER.md (à venir)"
    echo "  - https://www.facturation.pro/api"
    echo ""
    echo "Support :"
    echo "  - Issues GitHub : https://github.com/votre-repo/issues"
    echo "  - Support Facturation.pro : https://www.facturation.pro"
    echo ""
}

# =============================================================================
# Exécution principale
# =============================================================================
main() {
    check_prerequisites
    create_downloads_dir
    configure_env_vars

    # Tentative d'enregistrement (peut échouer si CLI MCP non dispo)
    register_mcp_server || true

    test_connection
    show_configuration_instructions
    show_summary
}

# Lancer le script
main

exit 0
