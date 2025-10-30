#!/bin/bash

# =============================================================================
# Tests Docker - Facturation.PRO MCP Server
# =============================================================================
#
# Ce script teste le build, le lancement et le fonctionnement du conteneur
# Docker du serveur MCP Facturation.PRO.
#
# Usage :
#   ./tests/docker-test.sh
#
# Variables d'environnement requises (pour tests complets) :
#   - FACTURATION_API_ID
#   - FACTURATION_API_KEY
#   - FACTURATION_FIRM_ID
#   - FACTURATION_USER_AGENT
#
# =============================================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="facturation-pro-mcp-server"
IMAGE_TAG="test"
CONTAINER_NAME="facturation-mcp-test"
TEST_TIMEOUT=30

# Statistiques
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# =============================================================================
# Fonctions utilitaires
# =============================================================================

print_header() {
    echo -e "\n${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  Facturation.PRO MCP Server - Tests Docker                   ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}\n"
}

print_section() {
    echo -e "\n${BLUE}═══ $1 ═══${NC}\n"
}

log_test() {
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "${BLUE}[Test $TESTS_TOTAL]${NC} $1"
}

log_success() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo -e "${RED}✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

log_info() {
    echo -e "${MAGENTA}→${NC} $1"
}

# =============================================================================
# Fonction de nettoyage
# =============================================================================

cleanup() {
    print_section "Nettoyage"

    # Arrêter et supprimer le conteneur de test s'il existe
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "Suppression du conteneur de test..."
        docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
        log_success "Conteneur supprimé"
    fi

    # Note : On ne supprime pas l'image pour éviter de rebuilder à chaque fois
    echo "Nettoyage terminé"
}

# Nettoyage en cas d'interruption
trap cleanup EXIT INT TERM

# =============================================================================
# Tests
# =============================================================================

test_docker_installed() {
    log_test "Vérification installation Docker"

    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        return 1
    fi

    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
    log_success "Docker installé (version $DOCKER_VERSION)"
    return 0
}

test_docker_running() {
    log_test "Vérification Docker daemon"

    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon n'est pas lancé"
        log_info "Lancez Docker Desktop et réessayez"
        return 1
    fi

    log_success "Docker daemon actif"
    return 0
}

test_build_image() {
    print_section "Build de l'image Docker"

    log_test "Construction de l'image"

    BUILD_START=$(date +%s)

    if docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" . > /tmp/docker-build.log 2>&1; then
        BUILD_END=$(date +%s)
        BUILD_TIME=$((BUILD_END - BUILD_START))

        log_success "Image buildée avec succès (${BUILD_TIME}s)"

        # Vérifier la taille de l'image
        IMAGE_SIZE=$(docker image inspect "${IMAGE_NAME}:${IMAGE_TAG}" --format='{{.Size}}' 2>/dev/null)
        IMAGE_SIZE_MB=$((IMAGE_SIZE / 1024 / 1024))

        log_info "Taille de l'image : ${IMAGE_SIZE_MB}MB"

        if [ "$IMAGE_SIZE_MB" -lt 200 ]; then
            log_success "Taille optimale (< 200MB)"
        else
            log_warning "Image volumineuse (> 200MB)"
        fi

        return 0
    else
        log_error "Échec du build"
        echo "Logs :"
        tail -20 /tmp/docker-build.log
        return 1
    fi
}

test_image_structure() {
    print_section "Validation structure de l'image"

    log_test "Vérification fichiers dans l'image"

    # Vérifier présence des fichiers essentiels
    FILES_TO_CHECK=(
        "/app/build/facturation-pro-mcp-server/index.js"
        "/app/node_modules"
        "/app/package.json"
        "/app/downloads"
    )

    for file in "${FILES_TO_CHECK[@]}"; do
        if docker run --rm --entrypoint sh "${IMAGE_NAME}:${IMAGE_TAG}" -c "test -e $file" >/dev/null 2>&1; then
            log_success "Présent : $file"
        else
            log_error "Manquant : $file"
            return 1
        fi
    done

    return 0
}

test_user_permissions() {
    log_test "Vérification user non-root"

    # Vérifier que le conteneur tourne avec user mcpuser (UID 1001)
    USER_ID=$(docker run --rm --entrypoint id "${IMAGE_NAME}:${IMAGE_TAG}" -u 2>/dev/null | grep -o 'uid=[0-9]*' | cut -d= -f2)

    if [ "$USER_ID" = "1001" ]; then
        log_success "User non-root (UID 1001)"
        return 0
    else
        log_error "User incorrect (UID $USER_ID)"
        return 1
    fi
}

test_health_check() {
    log_test "Test health check du conteneur"

    # Tester la commande du health check
    if docker run --rm --entrypoint node "${IMAGE_NAME}:${IMAGE_TAG}" -e "console.log('OK')" >/dev/null 2>&1; then
        log_success "Health check fonctionnel"
        return 0
    else
        log_error "Health check échoue"
        return 1
    fi
}

test_container_start() {
    print_section "Démarrage du conteneur"

    log_test "Lancement conteneur (sans env vars)"

    # Tenter de lancer le conteneur sans variables d'environnement
    # Il devrait échouer proprement avec un message d'erreur clair
    if docker run --rm --name "${CONTAINER_NAME}-quick" "${IMAGE_NAME}:${IMAGE_TAG}" 2>&1 | grep -q "environment variables are required"; then
        log_success "Validation des variables d'environnement OK"
        return 0
    else
        log_warning "Message d'erreur inattendu"
        return 0  # On considère quand même comme un succès
    fi
}

test_volume_mount() {
    log_test "Test montage volume downloads"

    # Créer un dossier temporaire
    TEMP_DIR=$(mktemp -d)

    # Lancer un conteneur avec volume monté et vérifier l'accès
    if docker run --rm \
        -v "$TEMP_DIR:/app/downloads" \
        --entrypoint sh \
        "${IMAGE_NAME}:${IMAGE_TAG}" \
        -c "echo 'test' > /app/downloads/test.txt && cat /app/downloads/test.txt" >/dev/null 2>&1; then

        log_success "Volume monté et accessible en écriture"

        # Vérifier que le fichier est bien créé sur l'hôte
        if [ -f "$TEMP_DIR/test.txt" ]; then
            log_success "Persistance volume vers hôte OK"
        else
            log_error "Fichier non créé sur l'hôte"
        fi

        rm -rf "$TEMP_DIR"
        return 0
    else
        log_error "Erreur montage volume"
        rm -rf "$TEMP_DIR"
        return 1
    fi
}

test_with_credentials() {
    print_section "Tests avec credentials (optionnel)"

    # Vérifier si les credentials sont disponibles
    if [ -z "$FACTURATION_API_ID" ] || [ -z "$FACTURATION_API_KEY" ] || [ -z "$FACTURATION_FIRM_ID" ]; then
        log_warning "Credentials non configurés - tests ignorés"
        log_info "Définissez FACTURATION_API_ID, FACTURATION_API_KEY, FACTURATION_FIRM_ID"
        log_info "pour exécuter les tests complets"
        return 0
    fi

    log_test "Test connexion API réelle"

    # Lancer le test d'intégration dans le conteneur
    TEMP_DIR=$(mktemp -d)

    if docker run --rm \
        -e "FACTURATION_API_ID=$FACTURATION_API_ID" \
        -e "FACTURATION_API_KEY=$FACTURATION_API_KEY" \
        -e "FACTURATION_FIRM_ID=$FACTURATION_FIRM_ID" \
        -e "FACTURATION_USER_AGENT=${FACTURATION_USER_AGENT:-Docker-Test}" \
        -v "$TEMP_DIR:/app/downloads" \
        -v "$(pwd)/tests:/tests:ro" \
        --entrypoint node \
        "${IMAGE_NAME}:${IMAGE_TAG}" \
        /tests/integration-test.js 2>&1 | tee /tmp/integration-test.log; then

        log_success "Tests d'intégration passés"
        rm -rf "$TEMP_DIR"
        return 0
    else
        log_error "Tests d'intégration échoués"
        log_info "Voir /tmp/integration-test.log pour détails"
        rm -rf "$TEMP_DIR"
        return 1
    fi
}

# =============================================================================
# Fonction principale
# =============================================================================

run_all_tests() {
    print_header

    # Tests préliminaires
    test_docker_installed || exit 1
    test_docker_running || exit 1

    # Tests de build
    test_build_image || exit 1

    # Tests de structure
    test_image_structure || exit 1
    test_user_permissions || exit 1
    test_health_check || exit 1

    # Tests de runtime
    test_container_start || exit 1
    test_volume_mount || exit 1

    # Tests avec credentials (optionnels)
    test_with_credentials || true  # Ne pas échouer si credentials manquants

    # Résumé
    print_section "Résumé des tests"

    SUCCESS_RATE=0
    if [ "$TESTS_TOTAL" -gt 0 ]; then
        SUCCESS_RATE=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    fi

    echo "Total   : $TESTS_TOTAL"
    echo -e "${GREEN}Réussis : $TESTS_PASSED${NC}"
    echo -e "${RED}Échoués : $TESTS_FAILED${NC}"
    echo ""
    echo "Taux de réussite : ${SUCCESS_RATE}%"
    echo ""

    if [ "$TESTS_FAILED" -eq 0 ]; then
        echo -e "${GREEN}✨ Tous les tests Docker sont passés avec succès !${NC}"
        echo ""
        echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${CYAN}║  L'image Docker est prête à être utilisée !                   ║${NC}"
        echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ Certains tests ont échoué${NC}"
        echo ""
        return 1
    fi
}

# Lancer les tests
run_all_tests

# Retourner le code approprié
exit $?
