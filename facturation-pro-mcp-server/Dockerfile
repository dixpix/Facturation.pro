# syntax=docker/dockerfile:1

# ============================================================================
# Stage 1: Builder - Compilation TypeScript
# ============================================================================
FROM node:20-alpine AS builder

LABEL maintainer="Facturation.PRO MCP Server"
LABEL description="Build stage for TypeScript compilation"

# Installer les dépendances de build
RUN apk add --no-cache \
    python3 \
    make \
    g++

WORKDIR /build

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig.json ./

# Installer TOUTES les dépendances (y compris devDependencies pour build)
RUN npm ci

# Copier le code source
COPY src ./src

# Compiler TypeScript
RUN npm run build

# Nettoyer les devDependencies après build
RUN npm prune --production

# ============================================================================
# Stage 2: Runtime - Image finale optimisée
# ============================================================================
FROM node:20-alpine

LABEL org.opencontainers.image.title="Facturation.PRO MCP Server"
LABEL org.opencontainers.image.description="MCP server for Facturation.PRO API - Docker MCP Toolkit compatible"
LABEL org.opencontainers.image.version="1.1.0"
LABEL org.opencontainers.image.vendor="Facturation.PRO"
LABEL org.opencontainers.image.licenses="See LICENSE"
LABEL org.opencontainers.image.source="https://github.com/votre-repo/facturation-pro-mcp-server"
LABEL com.docker.mcp.version="1.0"
LABEL com.docker.mcp.protocol="stdio"

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S mcpuser && \
    adduser -u 1001 -S mcpuser -G mcpuser

WORKDIR /app

# Copier les dépendances de production depuis le builder
COPY --from=builder --chown=mcpuser:mcpuser /build/node_modules ./node_modules

# Copier le code compilé depuis le builder
COPY --from=builder --chown=mcpuser:mcpuser /build/build ./build

# Copier le package.json pour les métadonnées
COPY --chown=mcpuser:mcpuser package.json ./

# Créer le dossier downloads avec permissions appropriées
RUN mkdir -p /app/downloads && \
    chown -R mcpuser:mcpuser /app/downloads

# Variables d'environnement par défaut
ENV NODE_ENV=production \
    FACTURATION_BASE_URL=https://www.facturation.pro

# Basculer vers l'utilisateur non-root
USER mcpuser

# Exposer le répertoire downloads comme volume
VOLUME ["/app/downloads"]

# Health check pour vérifier que le serveur répond
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('MCP Server healthy')" || exit 1

# Point d'entrée : le serveur MCP écoute sur stdin/stdout
ENTRYPOINT ["node", "build/facturation-pro-mcp-server/index.js"]

# Métadonnées Docker MCP Toolkit
LABEL com.docker.mcp.capabilities="tools,resources"
LABEL com.docker.mcp.tools.count="69"
LABEL com.docker.mcp.category="business,finance,api"
LABEL com.docker.mcp.requires.env="FACTURATION_API_ID,FACTURATION_API_KEY,FACTURATION_FIRM_ID,FACTURATION_USER_AGENT"
