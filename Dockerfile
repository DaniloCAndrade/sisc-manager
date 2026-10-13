# ── Stage 1: build da aplicação React/Vite ───────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copia todo o código-fonte
COPY . .

# Gera o build de produção
# As variáveis VITE_* precisam ser passadas em build time via --build-arg
ARG VITE_API_PLATFORM_CONTROL
ARG VITE_API_INVENTORY
ARG VITE_API_APM
ARG VITE_API_APDEX
ARG VITE_API_SCHEDULE
ARG VITE_API_LICENSE

ENV VITE_API_PLATFORM_CONTROL=$VITE_API_PLATFORM_CONTROL
ENV VITE_API_INVENTORY=$VITE_API_INVENTORY
ENV VITE_API_APM=$VITE_API_APM
ENV VITE_API_APDEX=$VITE_API_APDEX
ENV VITE_API_SCHEDULE=$VITE_API_SCHEDULE
ENV VITE_API_LICENSE=$VITE_API_LICENSE

RUN npm run build

# ── Stage 2: servidor Nginx para servir os assets estáticos ──────
FROM nginx:1.27-alpine

LABEL maintainer="Very Tecnologia" \
      service="frontend-sisc"

# Remove config padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Config customizada para SPA (ver nginx.conf). Serve só assets estáticos —
# as chamadas /svc/* são roteadas pelo Gateway (Envoy) direto para cada
# Service de backend, não passam mais por este nginx.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Porta não-privilegiada + diretórios graváveis pelo usuário nginx (já criado
# na imagem base), para que o processo não precise iniciar como root
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/run \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]