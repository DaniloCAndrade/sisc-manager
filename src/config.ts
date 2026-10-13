// config.ts
//
// Em desenvolvimento local (docker-compose), VITE_API_* aponta para
// http://localhost:<porta> via --build-arg.
// Em qa/staging/prod, nenhum build-arg é passado pelo pipeline de CI —
// os defaults abaixo (caminhos relativos) são então usados, e o nginx do
// próprio pod do frontend faz o reverse proxy para os Services internos
// (ver nginx.conf). Isso permite promover a mesma imagem entre ambientes
// sem precisar rebuildar com URLs diferentes.
const normalize = (url: string) => url.replace(/\/$/, '');

export const API_PLATFORM_CONTROL = normalize(
  import.meta.env.VITE_API_PLATFORM_CONTROL || '/svc/platform-control'
);

export const API_INVENTORY = normalize(
  import.meta.env.VITE_API_INVENTORY || '/svc/inventory'
);

export const API_APM = normalize(
  import.meta.env.VITE_API_APM || '/svc/apm'
);

export const API_APDEX = normalize(
  import.meta.env.VITE_API_APDEX || '/svc/apdex'
);

export const API_SCHEDULE = normalize(
  import.meta.env.VITE_API_SCHEDULE || '/svc/schedule'
);

export const API_LICENSE = normalize(
  import.meta.env.VITE_API_LICENSE || '/svc/license'
);