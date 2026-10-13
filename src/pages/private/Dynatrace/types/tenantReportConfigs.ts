// tenantReportConfigs.ts
export const TEMPLATE_CONFIG = {
  default: {
    title:    'APM Report',
    sections: ['kpi', 'ux', 'platform', 'behavior'],
    accentColor: '#004AAD',
  },
  very: {
    title:    'Very Tecnologia APM Report',
    sections: ['kpi', 'ux', 'platform', 'behavior'],
    accentColor: '#004AAD',
  },
  inep: {
    title:    'INEP/RNP Observability Report',
    sections: ['kpi', 'ux', 'infra', 'behavior'],
    accentColor: '#1d6fa4',
  },
  detran: {
    title:    'Detran APM Report',
    sections: ['kpi', 'ux', 'infra', 'platform', 'behavior'],
    accentColor: '#1a6b3c',
  },
} as const;

export type ReportTemplate = keyof typeof TEMPLATE_CONFIG;