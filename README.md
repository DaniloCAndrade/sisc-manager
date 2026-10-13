# SISC Manager — Frontend (`front-sisc`)

Aplicação React/TypeScript que centraliza os módulos de observabilidade Dynatrace, gestão de escala operacional e (em breve) segurança Trend Micro do Portal SISC Manager.

---

## Visão Geral

```
front-sisc/
├── public/
├── src/
│   ├── assets/              # Logos, ícones estáticos
│   ├── components/          # Componentes reutilizáveis (UI, modais, widgets)
│   ├── context/             # React Context providers (AuthContext, TenantContext…)
│   ├── hooks/               # Custom hooks de dados
│   ├── lib/                 # Configuração de navegação (moduleNav.tsx)
│   ├── pages/               # Páginas por módulo (roteadas)
│   ├── services/            # Camada de chamadas HTTP (axios)
│   ├── config.ts            # Runtime config (baseURL, flags)
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts       # Tailwind v4 — somente resolução de tokens extras
├── index.css                # DEVE começar com @import "tailwindcss" (v4)
├── tsconfig*.json
├── Dockerfile
└── .gitlab-ci.yml
```

**Branch de desenvolvimento ativo:** `redesign_front_2.0` — redesign completo do shell da aplicação.

---

## Stack Técnica

| Camada | Biblioteca / Versão |
|---|---|
| Framework | React 18 + TypeScript 5 |
| Build | Vite 5 + `@vitejs/plugin-react` |
| UI Components | Ant Design 5 (AntD) |
| CSS utilitário | **Tailwind CSS v4** (`@tailwindcss/vite`) |
| Animações | framer-motion |
| Roteamento | react-router-dom v7 |
| HTTP client | axios |
| Auth | Keycloak JS (integração pendente de SSO completo) |
| Charts | recharts / antd Charts |

---

## CI/CD e Deploy

### Pipeline GitLab (`.gitlab-ci.yml`)

| Variável de grupo | Descrição |
|---|---|
| `HARBOR_REGISTRY` | Host do Harbor (ex.: `harbor.corp.example`) |
| `HARBOR_ROBOT_USERNAME` | Usuário robô Harbor |
| `HARBOR_ROBOT_SECRET` | Senha do robô |
| `GITOPS_REPO` | URL SSH do repositório gitops-config |
| `GITOPS_REPO_SSH_KEY` | Chave SSH para push no gitops-config |

Variáveis específicas do frontend:

```yaml
variables:
  IMAGE_NAME: sisc-manager-frontend
  GITOPS_APP_PATH: apps/sisc-manager
```

### Estágios

```
build → deploy-qa → deploy-staging → deploy-prod
```

| Estágio | Trigger | Tag da imagem | Notas |
|---|---|---|---|
| `build` | push em qualquer branch | `sha-<short_sha>` para `main`, `branch-<sanitized>` para demais | Gera `build.env` com `IMAGE_TAG` e `IMAGE_FULL` |
| `deploy-qa` | apenas branch `main` | `sha-<short_sha>` | Automático |
| `deploy-staging` | git tag `v*` | `vX.Y.Z` | Automático |
| `deploy-prod` | git tag `v*` | `vX.Y.Z` | **Manual** (`when: manual`, `allow_failure: false`) |

> **Imagem única por ambiente:** Não há `VITE_API_*` como build args. A mesma imagem é promovida de QA → Staging → Prod. A URL da API é injetada em runtime via `src/config.ts` (lida de variável de ambiente exposta no pod ou via ConfigMap/Secret no K8s).

### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

> O `nginx.conf` deve incluir `try_files $uri $uri/ /index.html;` para suporte a rotas SPA.

---

## Roteamento

### Configuração central: `src/lib/moduleNav.tsx`

Este arquivo define toda a estrutura de navegação lateral e as rotas da aplicação. Para adicionar um novo módulo, basta incluir o item neste arquivo.

### Estrutura de rotas

```
/                          → Dashboard principal (redirect para /dynatrace)
/dynatrace/
  /dynatrace/tenants       → Gestão de Tenants Dynatrace
  /dynatrace/inventory     → Inventário de Entidades
  /dynatrace/apm           → Métricas APM (ao vivo)
  /dynatrace/apdex         → Scores Apdex / RUM
  /dynatrace/license       → Licenciamento DPS e Classic

/schedule/
  /schedule/view           → Visualização da escala (colaborador)
  /schedule/admin          → Administração geral da escala
  /schedule/manager        → Visão do gestor
  /schedule/collaborator   → Perfil do colaborador
  /schedule/timeline       → Timeline de colaboradores
  /schedule/manage         → Gerenciar colaboradores
  /schedule/absence        → Gerenciar ausências

/trend/                    → Módulo Trend Micro (mock — backend pendente)
  /trend/...               → Páginas placeholder
```

### Sidebar

- Inicia **recolhida** por padrão (`collapsed: true`)
- Separação visual entre módulos **Dynatrace** e **Trend Micro**
- Ícones AntD + labels com framer-motion para animação de colapso/expansão

---

## Módulos / Páginas

### Dynatrace

#### Tenants (`/dynatrace/tenants`)
- Lista todos os tenants cadastrados no `svc-platform-control`
- Modais: `CreateTenantModal`, `EditTenantModal`
- Permite testar conectividade (chama endpoint `/validate` do `svc-inventory`)

#### Inventário (`/dynatrace/inventory`)
- Seleciona tenant e dispara coleta assíncrona via `svc-inventory`
- Polling de status até conclusão
- Exportação: Excel (.xlsx), Word (.docx), filtros por tipo de entidade

#### APM (`/dynatrace/apm`)
- Filtros: tenant, aplicações web, janela de tempo (`from`/`to`)
- Hooks: `useDashboardAnalyze`, `useDashboardReport`
- Geração de relatório `.docx` servido pelo `svc-apm`
- Cards: Apdex, top serviços com erro, taxa de erros, latência P90/P99

#### Apdex / RUM (`/dynatrace/apdex`)
- Métricas de sessão de usuário real
- Componentes: Apdex score, Usuários ativos, Categorias Apdex, Bounce Rate, Rage Clicks, Top páginas com Apdex ruim

#### Licenciamento (`/dynatrace/license`)
- Lê dados de `svc-license` — consumo DPS e hosts monitored (Classic)
- Gráficos de tendência de consumo

### Escala Operacional (`/schedule/*`)

| View | Componente | Descrição |
|---|---|---|
| `ScheduleView` | `pages/schedule/ScheduleView.tsx` | Visão geral da escala mensal |
| `ScheduleAdminView` | `pages/schedule/ScheduleAdminView.tsx` | Admin: criar/editar turnos |
| `ScheduleManagerView` | `pages/schedule/ScheduleManagerView.tsx` | Visão resumida para gestores |
| `ScheduleCollaboratorView` | `pages/schedule/ScheduleCollaboratorView.tsx` | Visão individual do colaborador |
| `CollaboratorTimeline` | `pages/schedule/CollaboratorTimeline.tsx` | Timeline de todos os colaboradores |
| `ManageCollaborators` | `pages/schedule/ManageCollaborators.tsx` | CRUD de colaboradores |
| `ManageAbsence` | `pages/schedule/ManageAbsence.tsx` | Registro e aprovação de ausências |

### Trend Micro (`/trend/*`)

Módulo em desenvolvimento. Rotas e páginas estão presentes como **mock/placeholder**. O `svc-trend` no backend ainda não existe. As páginas retornam dados fictícios ou exibem "Em breve".

---

## Camada de Serviços (`src/services/`)

| Arquivo | Serviço backend chamado | Responsabilidade |
|---|---|---|
| `axiosConfig.ts` | — | Instância axios com `baseURL` de `config.ts`, interceptor de token JWT |
| `authService.ts` | `svc-platform-control /api/auth` | Login, refresh, logout |
| `dynaTenantService.ts` | `svc-platform-control /api/dynaTenant` | CRUD de tenants Dynatrace |
| `dynaPlatformCredentialsService.ts` | `svc-platform-control /api/dynatrace/platform-credentials` | Credenciais OAuth Dynatrace |
| `dynaInventoryService.ts` | `svc-inventory /api/inventory` | Trigger, status, export do inventário |
| `userService.ts` | `svc-platform-control /api/users` | Gestão de usuários |
| `collaboratorService.ts` | `svc-schedule /api/collaborators` | CRUD de colaboradores |
| `dailyScheduleService.ts` | `svc-schedule /api/schedule` | Escala diária/mensal |
| `absenceService.ts` | `svc-schedule /api/absences` | Ausências e afastamentos |
| `keycloak.ts` | Keycloak SSO | Instância e helpers do Keycloak JS (integração pendente) |

---

## Hooks Customizados (`src/hooks/`)

| Hook | Uso | Descrição |
|---|---|---|
| `useDashboardAnalyze.ts` | Página APM | Busca métricas ao vivo (Apdex, erros, latência) em paralelo |
| `useDashboardReport.ts` | Página APM | Controla geração e download do relatório `.docx` |
| `useScheduleData.ts` | Páginas de Escala | Carrega colaboradores, turnos e ausências para o mês selecionado |

---

## Configuração de Runtime (`src/config.ts`)

```typescript
// src/config.ts
const config = {
  apiBaseUrl:   import.meta.env.VITE_API_BASE_URL  ?? '/api',
  authEnabled:  import.meta.env.VITE_AUTH_ENABLED  !== 'false',
  // ... outros flags
};
export default config;
```

> Em produção, `VITE_API_BASE_URL` **não** é definida em build-time. O Nginx do pod serve o frontend em `/`, e chamadas para `/api/...` são roteadas pelo Envoy Gateway para os backends via proxy reverso — nenhum CORS necessário dentro do cluster.

---

## Tailwind CSS v4 — Atenção

### Configuração obrigatória

O `index.css` **deve** começar com:

```css
@import "tailwindcss";
```

> ⚠️ **Armadilha conhecida:** Versões antigas do arquivo podiam ter `@tailwind base; @tailwind components; @tailwind utilities;` (sintaxe v3) ou importar um `theme.css` separado que não existe mais. Se as classes Tailwind não estiverem sendo aplicadas em produção (build passa mas estilos somem), este é o primeiro lugar a verificar.

### Plugin Vite

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Não usar `postcss.config.js` com `@tailwindcss/postcss` — o plugin Vite nativo é exclusivo.

### `tailwind.config.ts`

Em v4, este arquivo é **opcional** e serve apenas para tokens extras (custom colors, fonts, breakpoints). O scan de classes é automático.

---

## Variáveis de Ambiente (`.env`)

| Variável | Ambiente | Descrição |
|---|---|---|
| `VITE_API_BASE_URL` | Desenvolvimento local | URL base da API (ex.: `http://localhost:3002`) |
| `VITE_AUTH_ENABLED` | Dev/CI | `false` para desabilitar guard de auth em dev |
| `VITE_KEYCLOAK_URL` | Todos | URL do Keycloak (quando SSO ativado) |
| `VITE_KEYCLOAK_REALM` | Todos | Realm Keycloak |
| `VITE_KEYCLOAK_CLIENT_ID` | Todos | Client ID Keycloak |

> Em produção (imagem Docker), **nenhuma** variável `VITE_*` é injetada no build. Usar apenas as que são lidas dinamicamente em runtime ou configuradas via ConfigMap montado como arquivo de ambiente.

---

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
# → http://localhost:5173

# Build de produção
npm run build

# Preview do build
npm run preview
```

### Proxy local para API

```typescript
// vite.config.ts — adicionar server.proxy para dev
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3002',  // svc-platform-control
      changeOrigin: true,
    },
  },
},
```

---

## Envoy Gateway (Ingress no Cluster)

O Envoy recebe requisições em `https://sisc.agu.gov.br/svc/frontend/...` e serve o app estático via Nginx. Para chamadas de API do frontend:

```
https://sisc.agu.gov.br/api/...
  → Envoy strips /api prefix
  → roteia para svc-platform-control:3002 (ou svc-inventory:3003, etc.)
    de acordo com o path completo
```

O frontend usa apenas `/api/...` (path relativo), nunca URLs absolutas com hostname — garantindo que a mesma imagem funcione em QA, Staging e Prod.

---

## Problemas Conhecidos / Pendências

| # | Problema | Status | Solução |
|---|---|---|---|
| 1 | **Keycloak SSO** não integrado | 🔴 Pendente | `keycloak.ts` existe; integração com guardas de rota precisa ser finalizada |
| 2 | **Módulo Trend Micro** sem backend | 🟡 Mock | `svc-trend` ainda não criado; páginas `/trend/*` são placeholders |
| 3 | **Tailwind v4 `theme.css`** órfão | ⚠️ Gotcha | Se `index.css` importar `theme.css` que não existe, todas as utilities silenciosamente somem |
| 4 | **Métricas APM falham no cluster** | 🔴 Infra | K8s não tem egress para `*.dynatrace.com:443`; DQL via `.apps.` funciona, Metrics API v2 via `.live.` falha — requer abertura de firewall pelo time SRE |
| 5 | **`canvas.node` no svc-apm** | 🔴 Bug | Alpine image sem deps nativas para `chartjs-node-canvas`; ver README do backend para fix do Dockerfile |
| 6 | **Auth guard incompleto** | 🟡 Parcial | Algumas rotas podem ser acessadas sem token válido dependendo do estado do contexto |

---

## Estrutura de Arquivos Detalhada

```
src/
├── assets/
│   └── logo.svg / logo-dark.svg
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx         # Layout principal: sidebar + header + outlet
│   │   ├── Sidebar.tsx          # Navegação lateral colapsável
│   │   └── Header.tsx           # Topbar com info do usuário e tenant selecionado
│   ├── tenant/
│   │   ├── CreateTenantModal.tsx
│   │   └── EditTenantModal.tsx
│   ├── inventory/
│   │   └── InventoryResultTable.tsx
│   ├── apm/
│   │   ├── ApdexCard.tsx
│   │   ├── ErrorRateChart.tsx
│   │   └── LatencyChart.tsx
│   └── common/
│       ├── LoadingSpinner.tsx
│       └── EmptyState.tsx
│
├── context/
│   ├── AuthContext.tsx           # Usuário autenticado, token JWT
│   └── TenantContext.tsx         # Tenant Dynatrace selecionado globalmente
│
├── hooks/
│   ├── useDashboardAnalyze.ts
│   ├── useDashboardReport.ts
│   └── useScheduleData.ts
│
├── lib/
│   └── moduleNav.tsx             # ← Ponto central de configuração de rotas e menu
│
├── pages/
│   ├── dynatrace/
│   │   ├── TenantsPage.tsx
│   │   ├── InventoryPage.tsx
│   │   ├── ApmPage.tsx
│   │   ├── ApdexPage.tsx
│   │   └── LicensePage.tsx
│   ├── schedule/
│   │   ├── ScheduleView.tsx
│   │   ├── ScheduleAdminView.tsx
│   │   ├── ScheduleManagerView.tsx
│   │   ├── ScheduleCollaboratorView.tsx
│   │   ├── CollaboratorTimeline.tsx
│   │   ├── ManageCollaborators.tsx
│   │   └── ManageAbsence.tsx
│   └── trend/
│       └── TrendDashboard.tsx    # Placeholder
│
├── services/
│   ├── axiosConfig.ts
│   ├── authService.ts
│   ├── dynaTenantService.ts
│   ├── dynaPlatformCredentialsService.ts
│   ├── dynaInventoryService.ts
│   ├── userService.ts
│   ├── collaboratorService.ts
│   ├── dailyScheduleService.ts
│   ├── absenceService.ts
│   └── keycloak.ts
│
└── config.ts
```

---

*Gerado em outubro/2026 — branch `redesign_front_2.0`*