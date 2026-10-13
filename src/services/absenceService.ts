// services/absenceService.ts
import { API_SCHEDULE } from '@/config';
import { apiPrivate } from './axiosConfig';

export interface Absence {
    _id?: string;
    collaboratorId: string;   // novo campo — era idCollaborator
    nome?: string;
    tipo: 'ATESTADO' | 'FERIAS' | 'LICENCA' | 'OUTRO';
    periodo: {
        inicio: Date | string;
        fim?: Date | string | null;
    };
    indeterminate?: boolean;
    substitutionChain?: {
        nightSubId?: string | null;
        nightSubNome?: string;
        dayDirectSubId?: string | null;
        dayDirectSubNome?: string;
    };
    status?: 'CRIADO' | 'ACEITO' | 'ERRO';
    observacao?: string;
    criadoEm?: string;
    atualizadoEm?: string;
}

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