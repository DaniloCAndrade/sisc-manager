import type { Dayjs } from 'dayjs';

/**
 * Range do DatePicker
 */
export type RangeValue = [Dayjs | null, Dayjs | null] | null;

/**
 * Tenant (reaproveita o mesmo conceito do dashboard principal)
 */
export type TenantInfo = {
  id: string;
  label: string;
};

/**
 * Aplicação frontend (Web Application do Dynatrace)
 */
export type FrontendApp = {
  id: string;
  name: string;
};

/**
 * Categoria final de APDEX
 */
export type ApdexCategory =
  | 'Unacceptable'
  | 'Poor'
  | 'Fair'
  | 'N/A';

/**
 * Linha individual retornada pelo endpoint
 * /api/apdex-analyze/top-pages
 */
export interface ApdexPageRow {
  page: string;
  apdex: number | null;
  category: ApdexCategory;
  total: number;

  // detalhamento (útil para tooltip ou explicação)
  satisfied: number;
  tolerating: number;
  frustrated: number;
}

/**
 * Resposta completa da API
 */
export interface ApdexAnalyzeResponse {
  totalPagesAnalyzed: number;
  totalWithBadApdex: number;
  topPages: ApdexPageRow[];
}

/**
 * Estado do dashboard de análise de APDEX
 * (ideal para hooks como useApdexAnalyzeData)
 */
export interface ApdexAnalyzeState {
  loading: boolean;
  error: string | null;
  data: ApdexAnalyzeResponse | null;
}
