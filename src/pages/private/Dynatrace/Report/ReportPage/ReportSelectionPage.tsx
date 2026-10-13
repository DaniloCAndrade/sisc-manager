/**
 * ReportSelectionPage.tsx
 * Router:  <Route path="/select-report" element={<ReportSelectionPage />} />
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Typography, Divider, Tag, Skeleton, Alert, Button,
} from 'antd';
import {
  ArrowRightOutlined, ArrowLeftOutlined, GlobalOutlined,
} from '@ant-design/icons';
import './css/ReportSelectionPage.css';

import { dynaTenantService, type DynaTenant } from '@/services/dynaTenantService';
import TenantManager from '@/components/TenantManager/TenantManager';

const { Title, Text } = Typography;

// Versão simplificada usada nos cards
interface Tenant {
  _id: string;
  nome: string;
  tenantId: string;
}

// Ícone determinístico pelo tenantId
const ICONS = ['🔵', '🟣', '🟡', '🟠', '🔴', '🟢', '⚪'];
function tenantIcon(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return ICONS[Math.abs(h) % ICONS.length];
}

// Converte DynaTenant (completo) → Tenant (simplificado para os cards)
function toSimple(t: DynaTenant): Tenant {
  return { _id: t._id, nome: t.nome, tenantId: t.tenantId };
}

export default function ReportSelectionPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dynaTenantService
      .getSimples()
      .then(setTenants)
      .catch((err) => {
        console.error('[ReportSelectionPage]', err?.response?.status, err?.message);
        setError('Não foi possível carregar os tenants. Verifique se o servidor está rodando.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleTenantReport = (tenant: Tenant) => {
    navigate('/form-report', {
      state: { tenantId: tenant._id, tenantName: tenant.nome },
    });
  };

  // Quando o TenantManager notifica alterações, atualiza os cards
  const handleTenantsChange = (updated: DynaTenant[]) => {
    setTenants(updated.map(toSimple));
  };

  return (
    <div className="rs-wrapper">
      <Card className="rs-card">

        {/* ── Header ── */}
        <div className="rs-header">
          <div className="rs-header-left">
            <div className="rs-logo-box">
              <span className="rs-logo-text">PORTAL</span>
            </div>
            <div>
              <Title level={4} className="rs-title">Seleção de Ambiente</Title>
              <Text className="rs-subtitle">Escolha o tenant para gerar o relatório</Text>
            </div>
          </div>
          <div className="rs-header-right">
            <div className="rs-powered">Powered by <span>SISC</span></div>
            <div className="rs-badge-env">Observability Platform</div>
          </div>
        </div>

        <Divider className="rs-divider" />

        {/* ── Relatório padrão ── */}
        <span className="rs-section-label">Relatório padrão</span>
        <Card className="rs-standard-card" onClick={() => navigate('/form-report')}>
          <div className="rs-standard-inner">
            <div className="rs-standard-left">
              <div className="rs-standard-icon">📊</div>
              <div>
                <Title level={5} className="rs-standard-name">Visão Consolidada</Title>
                <Text className="rs-standard-desc">Todos os ambientes · relatório multi-tenant</Text>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag color="blue">Padrão</Tag>
              <ArrowRightOutlined style={{ color: '#3b82f6' }} />
            </div>
          </div>
        </Card>

        {/* ── Por ambiente ── */}
        <span className="rs-section-label">Por ambiente</span>

        {error && <Alert type="error" message={error} className="rs-error" showIcon />}

        {loading && (
          <div className="rs-skeleton-grid">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="rs-tenant-card" style={{ cursor: 'default' }}>
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && tenants.length === 0 && (
          <div className="rs-empty">
            <GlobalOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
            Nenhum tenant cadastrado.
          </div>
        )}

        {!loading && !error && tenants.length > 0 && (
          <div className="rs-grid">
            {tenants.map((tenant) => (
              <Card
                key={tenant._id}
                className="rs-tenant-card"
                onClick={() => handleTenantReport(tenant)}
              >
                <div className="rs-tenant-header">
                  <div className="rs-tenant-icon">{tenantIcon(tenant.tenantId)}</div>
                  <Tag color="cyan" style={{ fontSize: 10 }}>Tenant</Tag>
                </div>
                <Title level={5} className="rs-tenant-name">{tenant.nome}</Title>
                <div className="rs-tenant-id">ID: {tenant.tenantId}</div>
                <div className="rs-tenant-footer">
                  <span className="rs-tenant-action">Ver relatório</span>
                  <ArrowRightOutlined style={{ color: '#9ca3af', fontSize: 12 }} />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="rs-footer">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
            Voltar ao portal
          </Button>
          <TenantManager onTenantsChange={handleTenantsChange} />
        </div>

      </Card>
    </div>
  );
}