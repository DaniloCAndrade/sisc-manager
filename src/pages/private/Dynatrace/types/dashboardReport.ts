// src/types/dashboard.ts
import type { Dayjs } from 'dayjs';

// Range do datepicker
export type RangeValue = [Dayjs | null, Dayjs | null] | null;

// Tipos Dynatrace genéricos
export interface DynatraceDataPoint {
  dimensionMap: any;
  timestamps: number[];
  values: (number | null)[];
}

export interface DynatraceMetricResult {
  metricId: string;
  data: DynatraceDataPoint[];
}

export interface DynatraceMetricResponse {
  totalCount: number;
  result: DynatraceMetricResult[];
}

// Geo
export type GeoRow = {
  id: string;
  name: string;
  value: number;
};

// Navegador
export type BrowserRow = {
  family: string;
  count: number;
};

export type BrowserApiResponse = {
  total: number;
  rows: BrowserRow[];
};

// Sistema Operacional
export type OsRow = {
  family: string;
  count: number;
};

// Bounce / Rage
export type BounceRow = { label: string; count: number };
export type RageRow = { label: string; count: number };
export type RagePerPagePieRow = { label: string; count: number };

export type BounceApiResponse = {
  total: number;
  rows: BounceRow[];
};

export type RageApiResponse = {
  total: number;
  rows: RageRow[];
};

export type RagePerPageApiResponse = {
  total: number;
  rows: RagePerPagePieRow[];
};

export type TenantInfo = {
  id: string;
  label: string;
};

export type FrontendApp = {
  id: string;
  name: string;
};

