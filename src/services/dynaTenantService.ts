import { API_PLATFORM_CONTROL } from '@/config';
import { apiPrivate } from './axiosConfig';

const BASE = `${API_PLATFORM_CONTROL}/api/dynaTenant`;

export interface DynaTenant {
  _id: string;
  nome: string;
  label: string;
  tenantId: string;
  baseUrl: string;
  apiToken: string;
  dataCriacao?: string;
  descricao?: string;
  // ── Licenciamento Classic (svc-license) ──────────────────────
  // Sem API pra buscar isso automaticamente — configurado manualmente
  // por tenant. null/undefined = quota não cadastrada ainda.
  hostUnitsQuota?: number | null;
  dduQuota?: number | null;
  demQuota?: number | null;
  appSecurityQuota?: number | null;
  licensePeriodStart?: string | null;
}

export interface DynaTenantSimples {
  _id: string;
  nome: string;
  tenantId: string;
}

export interface FrontendApp {
  id: string;
  name: string;
}

export interface TagsResponse {
  tagKeys: string[];
  tagValuesByKey: Record<string, string[]>;
}

export const dynaTenantService = {

  /** Lista todos os tenants com todos os campos */
  listar: async (): Promise<DynaTenant[]> => {
    try {
      const { data } = await apiPrivate.get<{ success: boolean; data: DynaTenant[] }>(`${BASE}`);
      return data.data;
    } catch (error) {
      console.error('Erro ao listar tenants:', error);
      throw error;
    }
  },

  /** Lista tenants simplificados (_id, nome, tenantId) - usado nos selects */
  getSimples: async (): Promise<DynaTenantSimples[]> => {
    try {
      const { data } = await apiPrivate.get<{ success: boolean; data: DynaTenantSimples[] }>(
        `${BASE}/simples`,
      );
      return data.data;
    } catch (error) {
      console.error('Erro ao buscar dynaTenants simples:', error);
      throw error;
    }
  },

  /** Busca um tenant pelo _id */
  buscarPorId: async (id: string): Promise<DynaTenant> => {
    try {
      const { data } = await apiPrivate.get<{ success: boolean; data: DynaTenant }>(
        `${BASE}/${id}`,
      );
      return data.data;
    } catch (error) {
      console.error('Erro ao buscar tenant por id:', error);
      throw error;
    }
  },

  /** Lista as aplicações frontend (web apps) de um tenant */
  getFrontends: async (tenantId: string): Promise<FrontendApp[]> => {
    try {
      const { data } = await apiPrivate.get<{ success: boolean; data: FrontendApp[] }>(
        `${BASE}/frontends`,
        { params: { id: tenantId } },
      );
      return data.data;
    } catch (error) {
      console.error('Erro ao buscar frontends:', error);
      throw error;
    }
  },

  /** Atualiza um tenant existente */
  atualizar: async (
    id: string,
    payload: Partial<Omit<DynaTenant, '_id' | 'dataCriacao'>>,
  ): Promise<DynaTenant> => {
    try {
      const { data } = await apiPrivate.put<{ success: boolean; data: DynaTenant }>(
        `${BASE}/${id}`,
        payload,
      );
      return data.data;
    } catch (error) {
      console.error('Erro ao atualizar tenant:', error);
      throw error;
    }
  },

  /** Cria um novo tenant */
  criar: async (payload: {
    nome: string;
    label: string;
    tenantId: string;
    baseUrl: string;
    apiToken: string;
    descricao?: string;
    // Licenciamento Classic — opcional na criação, pode ser preenchido
    // depois editando o tenant.
    hostUnitsQuota?: number;
    dduQuota?: number;
    demQuota?: number;
    appSecurityQuota?: number;
    licensePeriodStart?: string;
  }): Promise<DynaTenant> => {
    try {
      const { data } = await apiPrivate.post<{ success: boolean; data: DynaTenant }>(
        `${BASE}`,
        payload,
      );
      return data.data;
    } catch (error) {
      console.error('Erro ao criar tenant:', error);
      throw error;
    }
  },

  /** Busca as tags de serviço disponíveis para um tenant */
  getTags: async (params: {
    id: string;
    from?: number;
    to?: number;
    apps?: string;
  }): Promise<{ data: TagsResponse }> => {
    try {
      const response = await apiPrivate.get<TagsResponse>(`${BASE}/tags`, { params });
      return { data: response.data };
    } catch (error) {
      console.error('Erro ao buscar tags:', error);
      throw error;
    }
  },
};