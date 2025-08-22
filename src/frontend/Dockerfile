# ============================================================================
# Sistema de Monitoramento de Temperatura - Frontend Dockerfile
# Multi-stage build para desenvolvimento e produção
# ============================================================================

# ============================================================================
# STAGE 1: Base Node.js
# ============================================================================
FROM node:18-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/cache/apk/*

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# ============================================================================
# STAGE 2: Development
# ============================================================================
FROM base AS development

# Instalar todas as dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Alterar proprietário
RUN chown -R nodejs:nodejs /app

# Usar usuário não-root
USER nodejs

# Expor porta do Vite
EXPOSE 3001

# Comando para desenvolvimento
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3001"]

# ============================================================================
# STAGE 3: Build
# ============================================================================
FROM base AS build

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# ============================================================================
# STAGE 4: Production com Nginx
# ============================================================================
FROM nginx:alpine AS production

# Instalar curl para health check
RUN apk add --no-cache curl

# Remover configuração padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar configuração customizada do nginx
COPY docker/nginx-frontend.conf /etc/nginx/conf.d/

# Copiar arquivos buildados
COPY --from=build /app/dist /usr/share/nginx/html

# Criar usuário nginx se não existir
RUN addgroup -g 101 -S nginx || true
RUN adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true

# Alterar proprietário dos arquivos
RUN chown -R nginx:nginx /usr/share/nginx/html

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80 || exit 1

# Comando para produção
CMD ["nginx", "-g", "daemon off;"]
