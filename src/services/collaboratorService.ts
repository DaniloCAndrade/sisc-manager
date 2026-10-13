import { API_SCHEDULE } from '@/config';
import { apiPrivate } from './axiosConfig';

export interface TimeSchema {
    hora: number;
    minuto: number;
}

export interface HorarioTrabalhoSchema {
    inicio: TimeSchema;
    fim: TimeSchema;
    intervalo?: TimeSchema;
    intervaloTamanho?: TimeSchema;
}

export interface DiaSemanaSchema {
    domingo: boolean;
    segunda: boolean;
    terca: boolean;
    quarta: boolean;
    quinta: boolean;
    sexta: boolean;
    sabado: boolean;
}

export interface EscalaSemanal {
    diasTrabalho: number;
    diasDescanso: number;
    diasEspecificos: DiaSemanaSchema;
    inicioSemana: 'DOMINGO' | 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO';
}

export interface EscalaCiclica {
    horasTrabalho: number;
    horasDescanso: number;
    inicioCiclo?: Date | string;
}

export interface EscalaLivre {
    data: Date | string;
    horaInicio: TimeSchema;
    horaFim: TimeSchema;
    observacao?: string;
}

export type Escala =
    | { tipo: 'SEMANAL'; semanal: EscalaSemanal; ciclico?: never; livre?: never; regime?: 'PRESENCIAL' | 'HIBRIDO' | 'REMOTO' }
    | { tipo: 'CICLICO'; ciclico: EscalaCiclica; semanal?: EscalaSemanal; livre?: never; regime?: 'PRESENCIAL' | 'HIBRIDO' | 'REMOTO' }
    | { tipo: 'LIVRE'; livre: EscalaLivre[]; semanal?: EscalaSemanal; ciclico?: never; regime?: 'PRESENCIAL' | 'HIBRIDO' | 'REMOTO' };

export interface Collaborator {
    _id?: string;
    nome: string;
    email?: string;
    ativo: boolean;
    horarioTrabalho: HorarioTrabalhoSchema;
    escala: Escala;
    turno: 'MATUTINO' | 'VESPERTINO' | 'NOTURNO' | 'INTEGRAL' | 'ADMINISTRATIVO' | 'CUSTOMIZADO';
    observacoes?: string;
    criadoEm: string;
    atualizadoEm: string;
}

export const collaboratorService = {
    async getAll(): Promise<Collaborator[]> {
        try {
            const response = await apiPrivate.get(`${API_SCHEDULE}/api/collaborator`);
            if (response.data.success) return response.data.data;
            throw new Error('Resposta não foi bem-sucedida');
        } catch (error) {
            console.error('Erro ao buscar collaborators:', error);
            throw error;
        }
    },

    async salve(colab: Partial<Collaborator>): Promise<Collaborator> {
        try {
            if (colab._id) {
                const response = await apiPrivate.put(`${API_SCHEDULE}/api/collaborator/${colab._id}`, colab);
                if (response.data.success) return response.data;
                throw new Error('Resposta não foi bem-sucedida');
            } else {
                const response = await apiPrivate.post(`${API_SCHEDULE}/api/collaborator`, colab);
                if (response.data.success) return response.data;
                throw new Error('Resposta não foi bem-sucedida');
            }
        } catch (error) {
            console.error('Erro ao salvar collaborator:', error);
            throw error;
        }
    },

    async delete(id: string): Promise<Collaborator> {
        try {
            const response = await apiPrivate.delete(`${API_SCHEDULE}/api/collaborator/${id}`);
            if (response.data.success) return response.data;
            throw new Error('Resposta não foi bem-sucedida');
        } catch (error) {
            console.error('Erro ao deletar collaborator:', error);
            throw error;
        }
    },

    async getAtivos(): Promise<Collaborator[]> {
        try {
            const response = await apiPrivate.get(`${API_SCHEDULE}/api/collaborator/ativo`);
            if (response.data.success) return response.data.data;
            throw new Error('Resposta não foi bem-sucedida');
        } catch (error) {
            console.error('Erro ao buscar collaborators ativos:', error);
            throw error;
        }
    },
};