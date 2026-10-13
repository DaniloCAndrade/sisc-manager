import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService, type AuthUser } from '@/services/authService';

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    loading: boolean;
    login: (email: string, senha: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Restaura sessão do localStorage ao carregar
    useEffect(() => {
        const storedToken = localStorage.getItem('sisc_token');
        const storedUser = localStorage.getItem('sisc_user');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('sisc_token');
                localStorage.removeItem('sisc_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, senha: string) => {
        const result = await authService.login(email, senha);
        setToken(result.token);
        setUser(result.user);
        localStorage.setItem('sisc_token', result.token);
        localStorage.setItem('sisc_user', JSON.stringify(result.user));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('sisc_token');
        localStorage.removeItem('sisc_user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            logout,
            isAuthenticated: !!token,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
    return ctx;
};