import { API_LICENSE } from '@/config';
import { apiPrivate } from './axiosConfig';

const BASE = `${API_LICENSE}/api/license`;

// ── Tipos ────────────────────────────────────────────────────────

export type LicenseCategory = 'ideal' | 'atencao' | 'critico' | 'excedido';
export type LicenseType = 'DPS' | 'CLASSIC';

export interface LicenseMetric {
    used: number;
    quota: number | null;
    percent: number | null;
    category: LicenseCategory | null;
    breakdown?: Array<Record<string, unknown>>;
}

/** Forma unificada de projeto — DPS e Classic normalizados pro mesmo shape */
export interface LicenseProject {
    key: string;
    licenseType: LicenseType;
    clienteNome: string;
    tenantId: string | null;
    category: LicenseCategory | null;
    percent: number | null; // percentual "principal" pra ordenar/exibir no card
    expired: boolean;
    periodEnd: string | null;
    warning: string | null; // aviso a mostrar no card (ex: período vencido, janela subestimada)

    // ── Específico DPS ──
    dps?: {
        uuid: string;
        accountUuid: string;
        name: string;
        status: string;
        contractValue: number;
        currentCost: number;
        currencyCode: string;
        periodStart: string | null;
        daysRemaining: number | null;
    };

    // ── Específico Classic ──
    classic?: {
        hostUnits: LicenseMetric;
        ddu: LicenseMetric;
        dem: LicenseMetric;
        appSecurity: LicenseMetric;
        periodStart: string | null;
        usedFallbackWindow: boolean;
        periodLikelyExpired: boolean;
    };
}

export interface LicenseSummary {
    key: LicenseCategory;
    label: string;
    count: number;
}

export interface DpsDailyCostItem {
    capabilityName: string;
    startTime: string;
    value: number;
    currencyCode: string;
}

export interface DpsProjectDetail {
    dailyCost: DpsDailyCostItem[];
    windowDays: number;
}

export interface DpsProjection {
    horizonDays: number;
    contractValue: number;
    consumedSoFar: number;
    dailyAverage: number;
    projectedValue: number;
    projectedPercentOfContract: number;
    projectedExcess: number;
    willExceedBudget: boolean;
}

export type ContractStatus = 'novo' | 'atencao' | 'expirado';

export interface ContractStatusInfo {
    status: ContractStatus | null;
    endDate: string | null;
    daysRemaining: number | null;
}

// Abaixo de X dias restantes = "perto de expirar" (ícone amarelo)
const ATTENTION_THRESHOLD_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calcula o status do contrato pra exibir o ícone (verde/amarelo/vermelho)
 * — funciona tanto pra DPS (já tem periodEnd/daysRemaining prontos da API)
 * quanto pra Classic (calcula o fim do período como periodStart + 365 dias,
 * já que Classic não tem uma data de fim explícita, só o início).
 */
export function getContractStatus(project: LicenseProject): ContractStatusInfo {
    if (project.licenseType === 'DPS' && project.dps) {
        if (project.expired) {
            return { status: 'expirado', endDate: project.periodEnd, daysRemaining: project.dps.daysRemaining ?? null };
        }
        const days = project.dps.daysRemaining;
        if (days == null) return { status: null, endDate: project.periodEnd, daysRemaining: null };
        return {
            status: days <= ATTENTION_THRESHOLD_DAYS ? 'atencao' : 'novo',
            endDate: project.periodEnd,
            daysRemaining: days,
        };
    }

    if (project.licenseType === 'CLASSIC' && project.classic) {
        const { periodStart, periodLikelyExpired } = project.classic;
        if (!periodStart) return { status: null, endDate: null, daysRemaining: null };

        const start = new Date(periodStart).getTime();
        const end = start + 365 * DAY_MS;
        const daysRemaining = Math.floor((end - Date.now()) / DAY_MS);
        const endDate = new Date(end).toISOString();

        if (periodLikelyExpired) {
            return { status: 'expirado', endDate, daysRemaining };
        }
        return {
            status: daysRemaining <= ATTENTION_THRESHOLD_DAYS ? 'atencao' : 'novo',
            endDate,
            daysRemaining,
        };
    }

    return { status: null, endDate: null, daysRemaining: null };
}

const CATEGORY_LABELS: Record<LicenseCategory, string> = {
    ideal: 'Consumo Ideal',
    atencao: 'Atenção',
    critico: 'Crítico',
    excedido: 'Excedido',
};

// ── Normalização ─────────────────────────────────────────────────

function normalizeDps(raw: any): LicenseProject {
    return {
        key: `dps-${raw.uuid ?? raw.accountUuid}`,
        licenseType: 'DPS',
        clienteNome: raw.clienteNome ?? raw.name ?? 'Sem nome',
        tenantId: raw.tenantId ?? null,
        category: raw.category ?? null,
        percent: raw.percent ?? null,
        expired: !!raw.expired,
        periodEnd: raw.periodEnd ?? null,
        warning: raw.expired ? 'Subscription expirada' : null,
        dps: {
            uuid: raw.uuid,
            accountUuid: raw.accountUuid,
            name: raw.name,
            status: raw.status,
            contractValue: raw.contractValue ?? 0,
            currentCost: raw.currentCost ?? 0,
            currencyCode: raw.currencyCode ?? 'BRL',
            periodStart: raw.periodStart ?? null,
            daysRemaining: raw.daysRemaining ?? null,
        },
    };
}

function normalizeClassic(raw: any): LicenseProject {
    // Percentual "principal" do card = o maior entre os 4 (mais visível o gargalo)
    const metrics: LicenseMetric[] = [raw.hostUnits, raw.ddu, raw.dem, raw.appSecurity].filter(Boolean);
    const withPercent = metrics.filter((m) => m.percent != null);
    const mainPercent = withPercent.length
        ? Math.max(...withPercent.map((m) => m.percent as number))
        : null;

    let warning: string | null = null;
    if (raw.periodLikelyExpired) warning = 'Confirmar renovação de contrato';
    else if (raw.usedFallbackWindow) warning = 'Sem data de período — número pode estar subestimado';

    return {
        key: `classic-${raw.tenantId}`,
        licenseType: 'CLASSIC',
        clienteNome: raw.clienteNome ?? raw.label ?? 'Sem nome',
        tenantId: raw.tenantId ?? null,
        category: raw.category ?? null,
        percent: mainPercent,
        expired: false,
        periodEnd: null,
        warning,
        classic: {
            hostUnits: raw.hostUnits,
            ddu: raw.ddu,
            dem: raw.dem,
            appSecurity: raw.appSecurity,
            periodStart: raw.periodStart ?? null,
            usedFallbackWindow: !!raw.usedFallbackWindow,
            periodLikelyExpired: !!raw.periodLikelyExpired,
        },
    };
}

function buildSummary(projects: LicenseProject[]): LicenseSummary[] {
    const counts: Record<LicenseCategory, number> = { ideal: 0, atencao: 0, critico: 0, excedido: 0 };
    for (const p of projects) {
        if (p.category) counts[p.category]++;
    }
    return (Object.keys(counts) as LicenseCategory[]).map((key) => ({
        key,
        label: CATEGORY_LABELS[key],
        count: counts[key],
    }));
}

// ── Service ──────────────────────────────────────────────────────

export const dynaLicenseService = {
    /**
     * Busca DPS + Classic em paralelo e devolve tudo já unificado numa lista
     * só, com o resumo por categoria pronto pros cards do topo.
     */
    listarTodos: async (): Promise<{ projects: LicenseProject[]; summary: LicenseSummary[] }> => {
        const [dpsRes, classicRes] = await Promise.allSettled([
            apiPrivate.get<{ success: boolean; projects: any[] }>(`${BASE}/projects`),
            apiPrivate.get<{ success: boolean; projects: any[] }>(`${BASE}/classic-projects`),
        ]);

        // ⚠️ Antes isso falhava silenciosamente (Promise.allSettled engolindo o
        // erro) e a tela mostrava "0 projetos" sem indicar que algo quebrou.
        // Loga no console pra facilitar diagnóstico — se aparecer aqui, o
        // problema é na chamada em si (rede/CORS/auth), não em "não ter dados".
        if (dpsRes.status === 'rejected') {
            console.error('[dynaLicenseService] Falha ao buscar /projects (DPS):', dpsRes.reason);
        }
        if (classicRes.status === 'rejected') {
            console.error('[dynaLicenseService] Falha ao buscar /classic-projects:', classicRes.reason);
        }

        const dpsProjects =
            dpsRes.status === 'fulfilled'
                ? (dpsRes.value.data.projects ?? [])
                    // Remove 2 tipos de "ruído":
                    //  1. Placeholder de conta sem nenhuma subscription DPS (uuid null,
                    //     é só um aviso "provável Classic" — não é um projeto de verdade).
                    //  2. Subscriptions não-ativas (trial expirado, cancelada etc.) —
                    //     não são contratos vigentes, não fazem sentido num card de
                    //     acompanhamento de consumo.
                    .filter((p: any) => p.uuid && p.status === 'ACTIVE')
                    .map(normalizeDps)
                : [];
        const classicProjects =
            classicRes.status === 'fulfilled' ? (classicRes.value.data.projects ?? []).map(normalizeClassic) : [];

        // Projetos com erro (falha ao coletar) não têm "category" — ficam de
        // fora do resumo, mas continuam na lista pra aparecerem como "erro" no card.
        const projects = [...dpsProjects, ...classicProjects];

        return { projects, summary: buildSummary(projects) };
    },

    /** Detalhe diário de custo por serviço (aba "Valores" do modal DPS) */
    getProjectDetail: async (uuid: string, accountUuid: string, days = 7): Promise<DpsProjectDetail> => {
        const { data } = await apiPrivate.get(`${BASE}/projects/${uuid}`, {
            params: { accountUuid, days },
        });
        return { dailyCost: data.dailyCost ?? [], windowDays: data.windowDays };
    },

    /** Projeção linear (aba "Projeção/Estimativa" do modal DPS) */
    getProjectProjection: async (uuid: string, accountUuid: string, days = 30): Promise<DpsProjection> => {
        const { data } = await apiPrivate.get(`${BASE}/projects/${uuid}/projection`, {
            params: { accountUuid, days },
        });
        return data;
    },
};