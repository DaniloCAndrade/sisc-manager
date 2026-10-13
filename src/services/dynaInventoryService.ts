import { API_INVENTORY } from '../config';

const BASE_URL = API_INVENTORY;

export interface InventorySummaryRow {
  category: string;
  count: number;
  filtered: number;
}

export interface InventorySummary {
  rows: InventorySummaryRow[];
  total: number;
  totalFiltered: number;
}

export interface InventoryResult {
  inventory: Record<string, any[]>;
  noiseLog: Record<string, number>;
  managementZones: Record<string, Record<string, any[]>>;
  summary: InventorySummary;
  executedAt: string;
  resolvedUrl: string;
  urlWasCorrected: boolean;
  fromCache?: boolean;
  cachedAt?: string;
  tenant: { id: string; nome: string; label: string };
}

export interface ValidationResult {
  success: boolean;
  ok: boolean;
  baseUrlUsed: string;
  suggestedUrl: string | null;
  tokenValid: boolean;
  error: string | null;
  baseUrlUpdatedInDb?: boolean;
  message?: string;
  tenant: { id: string; nome: string };
}

// ── Tipos do fluxo assíncrono ───────────────────────────────────────
export type InventoryJobStatus = 'idle' | 'running' | 'done' | 'error';

export interface InventoryProgress {
  step: number;
  total: number;
  label: string | null;
  done?: number;
}

// Resposta de POST /run — agora é só o "start" do job, não o resultado completo
// (exceto quando fromCache === true, aí o backend já devolve o resultado inteiro)
export interface RunInventoryStartResponse {
  success: boolean;
  status: InventoryJobStatus;
  fromCache?: boolean;
  message?: string;
  progress?: InventoryProgress;
  startedAt?: string;
  cachedAt?: string;
  // presentes só quando fromCache === true (o backend espalha ...cached.result aqui)
  [key: string]: any;
}

// Resposta de GET /:tenantId/status
export interface InventoryStatusResponse {
  success: boolean;
  status: InventoryJobStatus;
  fromCache?: boolean;
  progress?: InventoryProgress;
  startedAt?: string;
  finishedAt?: string;
  cachedAt?: string;
  message?: string;
  validation?: any;
}

// ── Helper ────────────────────────────────────────────────────────
function authHeaders(extra: Record<string, string> = {}): HeadersInit {
  const token = localStorage.getItem('sisc_token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ── Funções ───────────────────────────────────────────────────────
export async function validateTenant(tenantId: string): Promise<ValidationResult> {
  const res = await fetch(`${BASE_URL}/api/dynatrace/inventory/${tenantId}/validate`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 400) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Dispara a coleta (ou pega do cache). NÃO espera a coleta terminar — o
// backend responde na hora (202) com status 'running', ou 'done' já com o
// resultado completo se veio do cache. Use runInventoryAndWait() se quiser
// o fluxo completo (disparar + aguardar + buscar resultado).
export async function runInventory(tenantId: string, force = false): Promise<RunInventoryStartResponse> {
  const res = await fetch(
    `${BASE_URL}/api/dynatrace/inventory/${tenantId}/run${force ? '?force=true' : ''}`,
    { method: 'POST', headers: authHeaders() }
  );
  const data = await res.json();
  if (!res.ok && res.status !== 202) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

export async function getInventoryStatus(tenantId: string): Promise<InventoryStatusResponse> {
  const res = await fetch(`${BASE_URL}/api/dynatrace/inventory/${tenantId}/status`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  // Erro de validação de tenant também vem como 400 com status:'error' no body —
  // deixamos o chamador decidir o que fazer, sem lançar exceção aqui.
  if (!res.ok && res.status !== 400) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

export async function getLastInventory(tenantId: string): Promise<InventoryResult | null> {
  const res = await fetch(`${BASE_URL}/api/dynatrace/inventory/${tenantId}`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// ── Fluxo completo: dispara + faz polling + busca o resultado final ──
// Substitui o antigo padrão "await runInventory()" que esperava a resposta
// HTTP inteira segurar a conexão até a coleta terminar (isso estourava o
// timeout do Route/HAProxy do OpenShift em tenants grandes).
//
// ⚠️ TOLERÂNCIA A MÚLTIPLAS RÉPLICAS: em produção o backend roda mais de uma
// réplica, e o cache/job de inventário fica em memória por processo (não é
// compartilhado entre réplicas). Isso significa que chamadas consecutivas
// podem cair em réplicas diferentes e dar respostas aparentemente
// contraditórias (ex: 'idle' logo depois de já termos visto 'running', ou
// 404 no GET do resultado logo depois do status dizer 'done'). Em vez de
// tratar isso como erro definitivo na primeira ocorrência, toleramos um
// número limitado de "inconsistências" antes de desistir de verdade — na
// prática, a maioria dos retries acaba caindo na réplica certa.
const MAX_INCONSISTENCY_RETRIES = 5;

export async function runInventoryAndWait(
  tenantId: string,
  force = false,
  onProgress?: (progress: InventoryProgress | undefined, status: InventoryJobStatus) => void,
  pollIntervalMs = 2500,
): Promise<InventoryResult> {
  const start = await runInventory(tenantId, force);

  // Cache-hit: o backend já devolveu o resultado inteiro junto com o start
  if (start.status === 'done' && start.fromCache) {
    onProgress?.(undefined, 'done');
    return start as unknown as InventoryResult;
  }

  onProgress?.(start.progress, start.status);

  let sawRunning = start.status === 'running';
  let inconsistencyStrikes = 0;

  // Faz polling até status virar 'done' ou 'error' (com tolerância a
  // respostas inconsistentes entre réplicas — ver comentário acima)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));

    let statusRes: InventoryStatusResponse;
    try {
      statusRes = await getInventoryStatus(tenantId);
    } catch (err) {
      // Falha transitória (503/504 de gateway, hiccup de rede) — não desiste
      // na primeira falha, só conta como mais uma "inconsistência" tolerada.
      inconsistencyStrikes++;
      if (inconsistencyStrikes > MAX_INCONSISTENCY_RETRIES) throw err;
      continue;
    }

    if (statusRes.status === 'running') {
      sawRunning = true;
      inconsistencyStrikes = 0; // recuperou consistência, zera o contador
      onProgress?.(statusRes.progress, statusRes.status);
      continue;
    }

    if (statusRes.status === 'idle' && sawRunning) {
      // Provavelmente caiu numa réplica que nunca recebeu o /run — não é
      // um erro real, só falta de estado compartilhado. Continua tentando.
      inconsistencyStrikes++;
      if (inconsistencyStrikes > MAX_INCONSISTENCY_RETRIES) {
        throw new Error(
          'Não foi possível acompanhar o progresso da coleta (respostas inconsistentes entre instâncias do servidor). Tente novamente em alguns instantes.'
        );
      }
      continue; // não atualiza onProgress aqui pra não "regredir" a barra visualmente
    }

    if (statusRes.status === 'error') {
      throw new Error(statusRes.message || 'Erro ao coletar inventário.');
    }

    if (statusRes.status === 'done') {
      onProgress?.(statusRes.progress, statusRes.status);

      // Mesmo com status 'done', o GET do resultado pode falhar logo em
      // seguida (janela curta de instabilidade do processo ao terminar de
      // montar um inventário grande — GC pesado, 503 do gateway). Backoff
      // exponencial: 3s, 6s, 12s, 24s, 24s, 24s... dando bastante tempo pra
      // essa janela passar, em vez de bater rápido demais e desistir cedo.
      const RESULT_FETCH_ATTEMPTS = 6;
      const RESULT_FETCH_BASE_DELAY_MS = 3000;
      const RESULT_FETCH_MAX_DELAY_MS = 24000;

      for (let attempt = 1; attempt <= RESULT_FETCH_ATTEMPTS; attempt++) {
        try {
          const result = await getLastInventory(tenantId);
          if (result) return result;
        } catch {
          // ignora e tenta de novo (rede/gateway transitório, ou o processo
          // ainda "engasgado" logo após terminar a coleta)
        }
        if (attempt < RESULT_FETCH_ATTEMPTS) {
          const delay = Math.min(RESULT_FETCH_BASE_DELAY_MS * 2 ** (attempt - 1), RESULT_FETCH_MAX_DELAY_MS);
          onProgress?.(
            { ...statusRes.progress, step: statusRes.progress?.total ?? 1, total: statusRes.progress?.total ?? 1, label: 'Finalizando...' },
            statusRes.status,
          );
          await new Promise((r) => setTimeout(r, delay));
        }
      }
      throw new Error('Coleta finalizada, mas não foi possível recuperar o resultado após algumas tentativas. Tente clicar em "Atualizar" novamente em alguns segundos.');
    }
    // status inesperado/desconhecido → continua o loop
  }
}

export async function clearInventoryCache(tenantId: string): Promise<void> {
  await fetch(`${BASE_URL}/api/dynatrace/inventory/${tenantId}/cache`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export async function exportInventoryWord(tenantId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/dynatrace/inventory/${tenantId}/export`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).message ?? `HTTP ${res.status}`);
  }
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const nameMatch = disposition.match(/filename="?([^"]+)"?/);
  const filename = nameMatch?.[1] ?? `inventario_${tenantId}.docx`;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function downloadExport(url: string, defaultFilename: string): Promise<void> {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).message ?? `HTTP ${res.status}`);
  }
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const nameMatch = disposition.match(/filename="?([^"]+)"?/);
  const filename = nameMatch?.[1] ?? defaultFilename;
  const blob = await res.blob();
  const u = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = u; a.download = filename; a.click();
  URL.revokeObjectURL(u);
}

export const exportDashboardsWord = (tenantId: string) =>
  downloadExport(`${BASE_URL}/api/dynatrace/inventory/${tenantId}/export/dashboards`, `dashboards_${tenantId}.docx`);

export const exportApplicationsWord = (tenantId: string) =>
  downloadExport(`${BASE_URL}/api/dynatrace/inventory/${tenantId}/export/applications`, `aplicacoes_${tenantId}.docx`);

export const exportInfrastructureWord = (tenantId: string) =>
  downloadExport(`${BASE_URL}/api/dynatrace/inventory/${tenantId}/export/infrastructure`, `infraestrutura_${tenantId}.docx`);