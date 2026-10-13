import { API_PLATFORM_CONTROL } from '@/config';
import { apiPrivate } from './axiosConfig';

const BASE = API_PLATFORM_CONTROL;

export interface User {
    _id: string;
    nome: string;
    email: string;
    perfil: 'admin' | 'viewer';
    ativo: boolean;
    criadoEm: string;
}

export interface CreateUserPayload {
    nome: string;
    email: string;
    senha: string;
    perfil?: 'admin' | 'viewer';
}

export interface UpdateUserPayload {
    nome?: string;
    perfil?: 'admin' | 'viewer';
    ativo?: boolean;
}

export const userService = {
    async listAll(): Promise<User[]> {
        const response = await apiPrivate.get(`${BASE}/api/auth/users`);
        return response.data.data;
    },

    async register(payload: CreateUserPayload): Promise<User> {
        const response = await apiPrivate.post(`${BASE}/api/auth/register`, payload);
        return response.data.user;
    },

    async update(id: string, payload: UpdateUserPayload): Promise<User> {
        const response = await apiPrivate.put(`${BASE}/api/auth/users/${id}`, payload);
        return response.data.user;
    },

    async updateSenha(id: string, senha: string): Promise<void> {
        await apiPrivate.put(`${BASE}/api/auth/users/${id}/senha`, { senha });
    },

    async remove(id: string): Promise<void> {
        await apiPrivate.delete(`${BASE}/api/auth/users/${id}`);
    },
};