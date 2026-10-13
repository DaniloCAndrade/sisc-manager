import { API_PLATFORM_CONTROL } from '../config';

const BASE_URL = API_PLATFORM_CONTROL;

export type CredentialTipo = 'platform_token' | 'oauth_client';
export type CredentialFinalidade = 'documents' | 'license';

export interface TenantRef {
  _id: string;
  nome: string;
  label: string;
  tenantId: string;
}

export interface PlatformCredential {
  _id: string;
  nome: string;
  tipo: CredentialTipo;
  finalidade: CredentialFinalidade;
  tenantRef: TenantRef | null;
  descricao: string | null;
  dataCriacao: string;
  platformToken: string | null;
  clientId: string | null;
  clientSecret: string | null;
  accountUrn: string | null;
}

export interface CreateCredentialPayload {
  nome: string;
  tipo: CredentialTipo;
  finalidade: CredentialFinalidade;
  tenantRef?: string | null;
  descricao?: string;
  platformToken?: string;
  clientId?: string;
  clientSecret?: string;
  accountUrn?: string;
}

export interface TestResult {
  success: boolean;
  message: string;
  docCount?: number | string;
}

// ── Helpers ───────────────────────────────────────────────────────
function authHeaders(extra: Record<string, string> = {}): HeadersInit {
  const token = localStorage.getItem('sisc_token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).message || `HTTP ${res.status}`);
  return data as T;
}

// ── Service ───────────────────────────────────────────────────────
export const dynaPlatformCredentialsService = {
  listar: (finalidade?: CredentialFinalidade): Promise<PlatformCredential[]> =>
    fetch(`${BASE_URL}/api/dynatrace/platform-credentials${finalidade ? `?finalidade=${finalidade}` : ''}`, {
      headers: authHeaders(),
    }).then((r) => handleResponse<PlatformCredential[]>(r)),

  criar: (payload: CreateCredentialPayload): Promise<PlatformCredential> =>
    fetch(`${BASE_URL}/api/dynatrace/platform-credentials`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    }).then((r) => handleResponse<PlatformCredential>(r)),

  atualizar: (id: string, payload: Partial<CreateCredentialPayload>): Promise<{ success: boolean }> =>
    fetch(`${BASE_URL}/api/dynatrace/platform-credentials/${id}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    }).then((r) => handleResponse(r)),

  excluir: (id: string): Promise<{ success: boolean }> =>
    fetch(`${BASE_URL}/api/dynatrace/platform-credentials/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then((r) => handleResponse(r)),

  testar: (id: string): Promise<TestResult> =>
    fetch(`${BASE_URL}/api/dynatrace/platform-credentials/${id}/test`, {
      method: 'POST',
      headers: authHeaders(),
    }).then((r) => r.json()),
};