// pages/private/Dynatrace/Inventory/InventoryTenantSelectPage.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Divider, Tag, Skeleton, Alert, Button } from 'antd';
import {
  ArrowRightOutlined,
  ArrowLeftOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { dynaTenantService, type DynaTenant } from '@/services/dynaTenantService';
import './css/InventoryTenantSelectPage.css';
import TenantManager from '@/components/TenantManager/TenantManager';

const { Title, Text } = Typography;

interface Tenant {
  _id: string;
  nome: string;
  tenantId: string;
}

// Ícone determinístico - mesmo algoritmo do ReportSelectionPage
const ICONS = ['🔵', '🟣', '🟡', '🟠', '🔴', '🟢', '⚪'];
function tenantIcon(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return ICONS[Math.abs(h) % ICONS.length];
}

export default function InventoryTenantSelectPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filtered, setFiltered] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchTenants(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? tenants.filter(
          (t) =>
            t.nome.toLowerCase().includes(q) ||
            t.tenantId.toLowerCase().includes(q)
        )
        : tenants
    );
  }, [search, tenants]);

  async function fetchTenants() {
    setLoading(true);
    setError(null);
    try {
      const data = await dynaTenantService.getSimples();
      setTenants(data);
      setFiltered(data);
    } catch (err: any) {
      console.error('[InventoryTenantSelectPage]', err?.response?.status, err?.message);
      setError('Não foi possível carregar os tenants. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  }

  // Converte DynaTenant (completo) → Tenant (simplificado para os cards)
  function toSimple(t: DynaTenant): Tenant {
    return { _id: t._id, nome: t.nome, tenantId: t.tenantId };
  }

  const handleTenantsChange = (updated: DynaTenant[]) => {
    setTenants(updated.map(toSimple));
  };

  return (
    <div className="inv-wrapper">
      <Card className="inv-card">

        {/* ── Header ── */}
        <div className="inv-header">
          <div className="inv-header-left">
            <div className="inv-logo-box">
              <span className="inv-logo-text">PORTAL</span>
            </div>
            <div>
              <Title level={4} className="inv-title">Inventário de Tenants</Title>
              <Text className="inv-subtitle">Selecione o tenant para visualizar o inventário</Text>
            </div>
          </div>
          <div className="inv-header-right">
            <div className="inv-powered">
              Powered by <span>SISC</span>
            </div>
            <div className="inv-badge-env">Observability Platform</div>
          </div>
        </div>

        <Divider className="inv-divider" />

        {/* ── Barra de busca ── */}
        <div className="inv-search-bar">
          <SearchOutlined className="inv-search-icon" />
          <input
            className="inv-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou tenant ID..."
          />
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={fetchTenants}
            disabled={loading}
            size="small"
            type="text"
            className="inv-reload-btn"
          />
        </div>

        {/* ── Label ── */}
        <span className="inv-section-label">
          {search
            ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`
            : 'Ambientes disponíveis'}
        </span>

        {/* ── Error ── */}
        {error && (
          <Alert type="error" message={error} className="inv-error" showIcon />
        )}

        {/* ── Skeletons ── */}
        {loading && (
          <div className="inv-skeleton-grid">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="inv-tenant-card" style={{ cursor: 'default' }}>
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
              </Card>
            ))}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="inv-empty">
            <DatabaseOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
            {search ? 'Nenhum tenant encontrado para esta busca.' : 'Nenhum tenant cadastrado.'}
          </div>
        )}

        {/* ── Grid de tenants ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="inv-grid">
            {filtered.map((tenant) => (
              <Card
                key={tenant._id}
                className="inv-tenant-card"
                onClick={() => navigate(`/inventory/${tenant._id}`, { state: { tenant } })}
              >
                <div className="inv-tenant-header">
                  <div className="inv-tenant-icon">{tenantIcon(tenant.tenantId)}</div>
                  <Tag color="cyan" style={{ fontSize: 10 }}>Tenant</Tag>
                </div>
                <Title level={5} className="inv-tenant-name">{tenant.nome}</Title>
                <div className="inv-tenant-id">ID: {tenant.tenantId}</div>
                <div className="inv-tenant-footer">
                  <span className="inv-tenant-action">Ver inventário</span>
                  <ArrowRightOutlined style={{ color: '#9ca3af', fontSize: 12 }} />
                </div>
              </Card>
            ))}
          </div>
        )}

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