import { dynaTenantService, type DynaTenantSimples } from '@/services/dynaTenantService';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export type TenantContextType = {
  tenants: DynaTenantSimples[];
  selectedTenant: DynaTenantSimples | null;
  selectedApps: string[];
  setTenant: (tenantId: string) => void;
  setSelectedApps: (apps: string[]) => void;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  const [tenants, setTenants] = useState<DynaTenantSimples[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<DynaTenantSimples | null>(null);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);

  // Aguarda o AuthContext terminar de restaurar a sessão antes de buscar
  useEffect(() => {
    if (loading) return; // ainda restaurando sessão do localStorage

    if (!isAuthenticated) {
      setTenants([]);
      setSelectedTenant(null);
      return;
    }

    dynaTenantService.getSimples()
      .then((dyTena: DynaTenantSimples[]) => {
        setTenants(dyTena);
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Erro ao carregar tenants:', error);
        }
      });
  }, [isAuthenticated, loading]);

  const setTenant = (tenantId: string) => {
    const tenant = tenants.find((t) => t.tenantId === tenantId) || null;
    setSelectedTenant(tenant);
  };

  return (
    <TenantContext.Provider value={{
      tenants,
      selectedTenant,
      selectedApps,
      setTenant,
      setSelectedApps,
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error('useTenant deve ser usado dentro de <TenantProvider>');
  }
  return ctx;
}