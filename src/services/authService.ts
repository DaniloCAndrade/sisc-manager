import { API_PLATFORM_CONTROL } from '@/config';

const BASE = API_PLATFORM_CONTROL;

export interface AuthUser {
    id: string;
    nome: string;
    email: string;
    perfil: 'admin' | 'viewer';
}

export interface LoginResponse {
    success: boolean;
    token: string;
    user: AuthUser;
}

export const authService = {
    async login(email: string, senha: string): Promise<LoginResponse> {
        const res = await fetch(`${BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || 'Credenciais inválidas.');
        }

        return data;
    },

    async me(token: string): Promise<AuthUser> {
        const res = await fetch(`${BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Sessão inválida.');
        return data.user;
    },
};