// ─────────────────────────────────────────────────────────────────
// services/scheduleServices.ts
// ─────────────────────────────────────────────────────────────────
import { API_SCHEDULE } from '@/config';
import { apiPrivate } from './axiosConfig';
import type {
    Collaborator, Absence, DailySchedule, DailyScheduleResponse, Program, ProgramTipo,
} from '@/types/schedule';

// ── Helpers ───────────────────────────────────────────────────────
function toISODate(d: Date | string): string {
    if (typeof d === 'string') return d.split('T')[0];
    // Usa UTC para evitar drift de timezone (ex: UTC-3 manda dia anterior)
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// ── collaboratorService ───────────────────────────────────────────
export const collaboratorService = {
    async getAll(): Promise<Collaborator[]> {
        const r = await apiPrivate.get(`${API_SCHEDULE}/api/collaborator`);
        if (r.data.success) return r.data.data;
        throw new Error('Erro ao buscar colaboradores');
    },

    async salve(collab: Partial<Collaborator>): Promise<Collaborator> {
        if (collab._id) {
            const r = await apiPrivate.put(`${API_SCHEDULE}/api/collaborator/${collab._id}`, collab);
            if (r.data.success) return r.data.data;
        } else {
            const r = await apiPrivate.post(`${API_SCHEDULE}/api/collaborator`, collab);
            if (r.data.success) return r.data.data;
        }
        throw new Error('Erro ao salvar colaborador');
    },

    async delete(id: string): Promise<void> {
        await apiPrivate.delete(`${API_SCHEDULE}/api/collaborator/${id}`);
    },
};

// ── absenceService ────────────────────────────────────────────────
export const absenceService = {
    async getAll(): Promise<Absence[]> {
        const r = await apiPrivate.get(`${API_SCHEDULE}/api/absence`);
        if (r.data.success) return r.data.data;
        throw new Error('Erro ao buscar ausências');
    },

    async getAtivos(): Promise<Absence[]> {
        const r = await apiPrivate.get(`${API_SCHEDULE}/api/absence/ativo`);
        if (r.data.success) return r.data.data;
        throw new Error('Erro ao buscar ausências ativas');
    },

    async salve(absence: Partial<Absence>): Promise<Absence> {
        if (absence._id) {
            const r = await apiPrivate.put(`${API_SCHEDULE}/api/absence/${absence._id}`, absence);
            if (r.data.success) return r.data.data;
        } else {
            const r = await apiPrivate.post(`${API_SCHEDULE}/api/absence`, absence);
            if (r.data.success) return r.data.data;
        }
        throw new Error('Erro ao salvar ausência');
    },

    async delete(id: string): Promise<void> {
        await apiPrivate.delete(`${API_SCHEDULE}/api/absence/${id}`);
    },
};

// ── dailyScheduleService ──────────────────────────────────────────
export const dailyScheduleService = {
    async getPeriodo(inicio: Date, fim: Date): Promise<DailyScheduleResponse> {
        const r = await apiPrivate.post(`${API_SCHEDULE}/api/dailySchedule/buscaTabelaPeriodo`, {
            inicio: toISODate(inicio),
            fim: toISODate(fim),
        });
        if (r.data.success) return r.data;
        throw new Error('Erro ao buscar escala');
    },

    async gerar(inicio: Date, fim: Date): Promise<DailyScheduleResponse> {
        const r = await apiPrivate.post(`${API_SCHEDULE}/api/dailySchedule/gerarEscalaPeriodo`, {
            inicio: toISODate(inicio),
            fim: toISODate(fim),
        });
        if (r.data.success) return r.data;
        throw new Error('Erro ao gerar escala');
    },

    async salve(escala: Partial<DailySchedule>): Promise<DailySchedule> {
        const r = await apiPrivate.put(`${API_SCHEDULE}/api/dailySchedule/${escala._id}`, escala);
        if (r.data.success) return r.data.data;
        throw new Error('Erro ao salvar escala');
    },

    async exportarEscala(inicio: Date, fim: Date): Promise<void> {
        const r = await apiPrivate.get(`${API_SCHEDULE}/api/export/escala`, {
            params: { inicio: toISODate(inicio), fim: toISODate(fim) },
            responseType: 'blob',
        });
        _downloadBlob(r.data, `escala_${toISODate(inicio)}_${toISODate(fim)}.xlsx`);
    },

    async exportarHorasExtras(inicio: Date, fim: Date): Promise<void> {
        const r = await apiPrivate.get(`${API_SCHEDULE}/api/export/horas-extras`, {
            params: { inicio: toISODate(inicio), fim: toISODate(fim) },
            responseType: 'blob',
        });
        _downloadBlob(r.data, `horas_extras_${toISODate(inicio)}_${toISODate(fim)}.xlsx`);
    },
};

// ── programService ────────────────────────────────────────────────
export const programService = {
    async getAll(inicio: Date, fim: Date): Promise<Program[]> {
        const r = await apiPrivate.get(`${API_SCHEDULE}/api/program`, {
            params: { start: toISODate(inicio), end: toISODate(fim) },
        });
        if (r.data.success) return r.data.data;
        throw new Error('Erro ao buscar programas');
    },

    async criar(data: {
        programName: string;
        tipo: ProgramTipo;
        startDate: string;
        endDate: string;
        firstCollaboratorId?: string;
    }): Promise<any> {
        const r = await apiPrivate.post(`${API_SCHEDULE}/api/program`, data);
        if (r.data.success) return r.data;
        throw new Error('Erro ao criar programa');
    },

    async deletar(programName: string, start?: string, end?: string): Promise<void> {
        await apiPrivate.delete(
            `${API_SCHEDULE}/api/program/${encodeURIComponent(programName)}`,
            { params: start && end ? { start, end } : undefined },
        );
    },
};

// ── helper ────────────────────────────────────────────────────────
function _downloadBlob(data: Blob, filename: string) {
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}