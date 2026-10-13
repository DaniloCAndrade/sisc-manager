import { useState, useCallback } from 'react';
import axios from 'axios';
import { useTenant } from '../context/TenantContext';
import { API_APDEX } from '../config';

import type {
  ApdexAnalyzeResponse,
  ApdexAnalyzeState,
} from '../pages/private/Dynatrace/types/dashboardApdexAnalyze';

/**
 * Hook dedicado à análise de APDEX por páginas
 * Endpoint: GET /api/apdex-analyze/top-pages (svc-apdex porta 3005)
 */
export function useApdexAnalyze() {
  const { selectedTenant, selectedApps } = useTenant();

  const [state, setState] = useState<ApdexAnalyzeState>({
    loading: false,
    error: null,
    data: null,
  });

  const fetchApdexAnalyze = useCallback(
    async (params: { from?: number; to?: number }) => {
      try {
        if (!selectedTenant) {
          setState((s) => ({ ...s, error: 'Tenant não selecionado.' }));
          return;
        }

        if (!selectedApps || selectedApps.length === 0) {
          setState((s) => ({ ...s, error: 'Selecione ao menos uma aplicação frontend.' }));
          return;
        }

        const { from, to } = params;

        setState({ loading: true, error: null, data: null });

        const response = await axios.get<ApdexAnalyzeResponse>(
          `${API_APDEX}/api/apdex-analyze/top-pages`,
          {
            params: {
              id: selectedTenant._id,
              apps: selectedApps.join(','),
              from,
              to,
            },
          },
        );

        setState({ loading: false, error: null, data: response.data });
      } catch (err: any) {
        console.error('Erro ao buscar análise de APDEX:', err);
        setState({
          loading: false,
          error: err?.response?.data?.err || 'Falha ao carregar análise de APDEX.',
          data: null,
        });
      }
    },
    [selectedTenant, selectedApps],
  );

  return { ...state, fetchApdexAnalyze };
}