import { useState, useCallback, useEffect } from 'react';
import dayjs from 'dayjs';
import axios from 'axios';
import type { RangeValue } from '../pages/private/Dynatrace/types/dashboardReport';
import { useTenant } from '../context/TenantContext';
import { API_APM } from '../config';
import { dynaTenantService } from '@/services/dynaTenantService';

// ------- Helpers de transformação -------

function extractHostAvailability(metricData: any): number | null {
  const data = metricData?.result?.[0]?.data;
  if (!Array.isArray(data) || !data.length) return null;

  let sum = 0;
  let count = 0;

  for (const row of data) {
    const values = row?.values || [];
    if (!Array.isArray(values) || !values.length) continue;
    const last = values[values.length - 1];
    if (typeof last === 'number') { sum += last; count++; }
  }

  return count ? sum / count : null;
}

function extractRequestCountTotal(metricData: any): number {
  const series = metricData?.result?.[0]?.data;
  if (!Array.isArray(series) || !series.length) return 0;

  let total = 0;
  for (const row of series) {
    const vals = Array.isArray(row.values) ? row.values : [];
    for (const v of vals) {
      if (typeof v === 'number') total += v;
    }
  }
  return total;
}

function extractSessionsTotal(metricData: any): number {
  return extractRequestCountTotal(metricData);
}

function transformApdexCategory(metricData: any): Record<string, number> {
  const result: Record<string, number> = {};
  const data = metricData?.result?.[0]?.data;
  if (!Array.isArray(data)) return result;

  for (const row of data) {
    const dim = row?.dimensionMap || {};
    let raw: any =
      dim['Apdex category'] ?? dim['ApdexCategory'] ?? dim['apdexCategory'];

    if (!raw) {
      const dimValues = Object.values(dim).filter(
        (v) => typeof v === 'string',
      ) as string[];
      raw = dimValues[0] ?? 'Unknown';
    }

    const up = String(raw).toUpperCase();
    const category =
      up.startsWith('SATIS') ? 'SATISFIED'
        : up.startsWith('TOLER') ? 'TOLERATING'
          : up.startsWith('FRUST') || up.startsWith('DISSAT') ? 'FRUSTRATED'
            : 'UNKNOWN';

    const total = (row.values || []).reduce(
      (acc: number, v: any) => acc + (typeof v === 'number' ? v : 0),
      0,
    );
    if (total <= 0) continue;

    result[category] = (result[category] || 0) + total;
  }

  return result;
}

// ------- Opções do hook -------

interface DashboardDataOptions {
  initialDateRange?: RangeValue;
  initialTagKey?: string;
  initialTagValue?: string;
  initialAvailabilityMode?: 'host' | 'synthetic';
  tenantId?: string;
}

// ------- Hook principal -------

export function useDashboardData(options?: DashboardDataOptions) {
  const {
    initialDateRange,
    initialTagKey,
    initialTagValue,
    initialAvailabilityMode,
    tenantId: tenantIdProp,
  } = options || {};

  const { selectedTenant, selectedApps } = useTenant();

  const resolvedTenantId = tenantIdProp ?? selectedTenant?._id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<RangeValue>(() => {
    if (
      initialDateRange &&
      Array.isArray(initialDateRange) &&
      initialDateRange[0] &&
      initialDateRange[1]
    ) {
      return initialDateRange;
    }
    return [dayjs().subtract(2, 'hour'), dayjs()];
  });

  const [serviceTagKey, setServiceTagKey] = useState<string>(initialTagKey ?? '');
  const [serviceTagValue, setServiceTagValue] = useState<string>(initialTagValue ?? 'all');

  const [availabilityMode, setAvailabilityMode] =
    useState<'host' | 'synthetic'>(initialAvailabilityMode ?? 'host');

  const [apdexValue, setApdexValue] = useState<number | null>(null);
  const [requestCount, setRequestCount] = useState<number | null>(null);
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const [hostAvailability, setHostAvailability] = useState<number | null>(null);
  const [apdexCategory, setApdexCategory] = useState<Record<string, number>>({});
  const [geoData, setGeoData] = useState<any[]>([]);
  const [browserData, setBrowserData] = useState<any[]>([]);
  const [osData, setOsData] = useState<any[]>([]);
  const [bounceData, setBounceData] = useState<any[]>([]);
  const [rageData, setRageData] = useState<any[]>([]);
  const [ragePerPageData, setRagePerPageData] = useState<any[]>([]);

  const [tagKeyOptions, setTagKeyOptions] = useState<any[]>([{ label: 'Sem filtro de tag', value: '' }]);
  const [tagValuesByKey, setTagValuesByKey] = useState<Record<string, string[]>>({});
  const [tagValueOptions, setTagValueOptions] = useState<any[]>([{ label: 'Todas', value: 'all' }]);

  // ── Carrega tags dinâmicas ──────────────────────────────────────────────────

  useEffect(() => {
    if (!resolvedTenantId) return;
    if (!selectedApps || selectedApps.length === 0) return;
    if (!dateRange?.[0] || !dateRange?.[1]) return;

    const [start, end] = dateRange;
    const apps = selectedApps.join(',');

    dynaTenantService
      .getTags({ id: resolvedTenantId, from: start.valueOf(), to: end.valueOf(), apps })
      .then((resp: any) => {
        const keys: string[] = resp.data?.tagKeys ?? [];
        const valuesByKey: Record<string, string[]> = resp.data?.tagValuesByKey ?? {};

        setTagKeyOptions([
          { label: 'Sem filtro de tag', value: '' },
          ...keys.map((k) => ({ label: k, value: k })),
        ]);
        setTagValuesByKey(valuesByKey);

        if (serviceTagKey && !keys.includes(serviceTagKey)) setServiceTagKey('');
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error('Erro ao carregar tags:', err);
      });
  }, [resolvedTenantId, selectedApps, dateRange, serviceTagKey]);

  // ── Atualiza opções de valor por key ───────────────────────────────────────

  useEffect(() => {
    let values: string[] = serviceTagKey
      ? (tagValuesByKey[serviceTagKey] ?? [])
      : Array.from(new Set(Object.values(tagValuesByKey).flat()));

    setTagValueOptions([
      { label: 'Todas', value: 'all' },
      ...(serviceTagValue && serviceTagValue !== 'all' && !values.includes(serviceTagValue)
        ? [{ label: serviceTagValue, value: serviceTagValue }]
        : []),
      ...values.map((v) => ({ label: v, value: v })),
    ]);
  }, [serviceTagKey, tagValuesByKey, serviceTagValue]);

  // ── fetchData ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!resolvedTenantId) {
      setError('Selecione um tenant na tela de seleção.');
      return;
    }
    if (!selectedApps || selectedApps.length === 0) {
      setError('Selecione pelo menos uma aplicação na tela de seleção.');
      return;
    }
    if (!dateRange?.[0] || !dateRange?.[1]) {
      setError('Selecione um período válido.');
      return;
    }

    const [start, end] = dateRange;
    const from = start.valueOf();
    const to = end.valueOf();
    const apps = selectedApps.join(',');

    setLoading(true);
    setError(null);

    try {
      const commonParams = { id: resolvedTenantId, from, to };

      // svc-apm (porta 3004) - todos os endpoints de métricas
      const availabilityPromise = availabilityMode === 'synthetic'
        ? axios.get(`${API_APM}/api/infra/synthetic-availability`, { params: commonParams })
        : axios.get(`${API_APM}/api/infra/host-availability`, { params: commonParams });

      const [
        hostRes, requestRes, apdexRes, sessionsRes, apdexCatRes,
        geoRes, browserRes, osRes, bounceRes, rageRes, ragePerPageRes,
      ] = await Promise.all([
        availabilityPromise,

        axios.get(`${API_APM}/api/services/request-count`, {
          params: {
            ...commonParams,
            tagKey: serviceTagKey || undefined,
            tagValue: serviceTagValue && serviceTagValue !== 'all' ? serviceTagValue : undefined,
          },
        }),

        axios.get(`${API_APM}/api/user/apdex`, { params: { ...commonParams, apps } }),
        axios.get(`${API_APM}/api/user/sessions`, { params: { ...commonParams, apps } }),
        axios.get(`${API_APM}/api/user/apdex-category`, { params: { ...commonParams, apps } }),
        axios.get(`${API_APM}/api/services/action-geolocation`, { params: { ...commonParams, apps } }),
        axios.get(`${API_APM}/api/services/browser-family`, { params: { ...commonParams, apps } }),
        axios.get(`${API_APM}/api/services/action-os`, { params: { ...commonParams, apps } }),
        axios.get(`${API_APM}/api/user/bounce-rate`, { params: { ...commonParams, apps } }),
        axios.get(`${API_APM}/api/user/rage-clicks`, { params: { ...commonParams, apps } }),
        axios.get(`${API_APM}/api/user/rage-clicks-per-page`, { params: { ...commonParams, apps } }),
      ]);

      setHostAvailability(extractHostAvailability(hostRes.data));
      setRequestCount(extractRequestCountTotal(requestRes.data));
      setApdexValue(typeof apdexRes.data?.apdex === 'number' ? apdexRes.data.apdex : null);
      setSessionCount(extractSessionsTotal(sessionsRes.data));
      setApdexCategory(transformApdexCategory(apdexCatRes.data));

      setGeoData(Array.isArray(geoRes.data) ? geoRes.data : []);

      setBrowserData(
        Array.isArray(browserRes.data?.rows) ? browserRes.data.rows
          : Array.isArray(browserRes.data) ? browserRes.data
            : [],
      );

      setOsData(Array.isArray(osRes.data) ? osRes.data : []);

      setBounceData(
        Array.isArray(bounceRes.data?.rows) ? bounceRes.data.rows
          : Array.isArray(bounceRes.data) ? bounceRes.data
            : [],
      );

      setRageData(
        Array.isArray(rageRes.data?.rows) ? rageRes.data.rows
          : Array.isArray(rageRes.data) ? rageRes.data
            : [],
      );

      setRagePerPageData(
        Array.isArray(ragePerPageRes.data?.rows) ? ragePerPageRes.data.rows
          : Array.isArray(ragePerPageRes.data) ? ragePerPageRes.data
            : [],
      );
    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err);
      setError('Falha ao carregar dados do relatório.');
    } finally {
      setLoading(false);
    }
  }, [
    resolvedTenantId,
    selectedApps,
    dateRange,
    serviceTagKey,
    serviceTagValue,
    availabilityMode,
  ]);

  return {
    loading,
    error,

    dateRange,
    setDateRange,

    tagKey: serviceTagKey,
    setTagKey: setServiceTagKey,
    tagValue: serviceTagValue,
    setTagValue: setServiceTagValue,
    tagKeyOptions,
    tagValueOptions,

    serviceTagKey,
    setServiceTagKey,
    serviceTagValue,
    setServiceTagValue,
    serviceTag: serviceTagKey,
    setServiceTag: setServiceTagKey,

    availabilityMode,
    setAvailabilityMode,

    fetchData,

    apdexValue,
    requestCount,
    sessionCount,
    hostAvailability,
    apdexCategory,
    geoData,
    browserData,
    osData,
    bounceData,
    rageData,
    ragePerPageData,
  };
}