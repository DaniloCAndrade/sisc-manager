/**
 * TenantManager.tsx
 * Componente reutilizável para gerenciar tenants Dynatrace.
 * Encapsula listagem, criação e edição em um único bloco.
 *
 * Localização: src/components/TenantManager/TenantManager.tsx
 *
 * Uso mínimo (só o botão "Listar tenants"):
 *   <TenantManager />
 *
 * Com callback quando a lista muda (ex: para atualizar cards na página):
 *   <TenantManager onTenantsChange={(tenants) => setTenants(tenants)} />
 *
 * Abrindo o modal programaticamente (ex: botão externo "Novo tenant"):
 *   const ref = useRef<TenantManagerRef>(null);
 *   <Button onClick={() => ref.current?.openCreate()}>Novo</Button>
 *   <TenantManager ref={ref} onTenantsChange={...} />
 */

import { forwardRef, useImperativeHandle, useState } from 'react';
import {
  Modal, Table, Tag, Tooltip, Button, Spin,
} from 'antd';
import {
  UnorderedListOutlined, PlusOutlined, EditOutlined,
  EyeOutlined, EyeInvisibleOutlined,
} from '@ant-design/icons';
import { dynaTenantService, type DynaTenant } from '@/services/dynaTenantService';
import CreateTenantModal from '@/pages/private/Dynatrace/Modals/CreateTenantModal';
import EditTenantModal from '@/pages/private/Dynatrace/Modals/EditTenantModal';

// Importa o CSS da modal de listagem (já existe no ReportSelectionPage)
// Ajuste o caminho se necessário
import '@/pages/private/Dynatrace/Report/ReportPage/css/ReportSelectionPage.css';

// ── Ref handle (para controle externo) ───────────────────────────
export interface TenantManagerRef {
  openList(): void;
  openCreate(): void;
  reload(): void;
}

// ── Props ─────────────────────────────────────────────────────────
interface Props {
  /** Chamado após qualquer criação ou edição de tenant */
  onTenantsChange?: (tenants: DynaTenant[]) => void;
  /** Se true, não renderiza os botões - só expõe o ref para controle externo */
  headless?: boolean;
}

const TenantManager = forwardRef<TenantManagerRef, Props>(
  ({ onTenantsChange, headless = false }, ref) => {

    const [listOpen, setListOpen] = useState(false);
    const [tenants, setTenants] = useState<DynaTenant[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [visibleTokens, setVisibleTokens] = useState<Record<string, boolean>>({});
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<DynaTenant | null>(null);

    // ── Carrega a lista completa ────────────────────────────────
    const loadTenants = async () => {
      setLoadingList(true);
      try {
        const data = await dynaTenantService.listar();
        setTenants(data);
        onTenantsChange?.(data);
      } catch (err) {
        console.error('[TenantManager] Erro ao carregar tenants:', err);
      } finally {
        setLoadingList(false);
      }
    };

    const openList = async () => {
      setListOpen(true);
      if (tenants.length === 0) await loadTenants();
    };

    // ── Callbacks de criação e edição ───────────────────────────
    const handleCreated = (newTenant: DynaTenant) => {
      const updated = [...tenants, newTenant];
      setTenants(updated);
      onTenantsChange?.(updated);
    };

    const handleUpdated = (updatedTenant: DynaTenant) => {
      const updated = tenants.map((t) =>
        t._id === updatedTenant._id ? updatedTenant : t
      );
      setTenants(updated);
      onTenantsChange?.(updated);
    };

    const toggleToken = (id: string) =>
      setVisibleTokens((prev) => ({ ...prev, [id]: !prev[id] }));

    // ── Ref handle ──────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      openList,
      openCreate: () => setCreateOpen(true),
      reload: loadTenants,
    }));

    // ── Colunas da tabela ───────────────────────────────────────
    const columns = [
      {
        title: 'Nome',
        dataIndex: 'nome',
        width: 140,
        render: (v: string) => <span className="rs-tenant-row-nome">{v}</span>,
      },
      {
        title: 'Label',
        dataIndex: 'label',
        width: 180,
        ellipsis: true,
        className: 'rs-tenant-row-label',
      },
      {
        title: 'Tenant ID',
        dataIndex: 'tenantId',
        width: 110,
        className: 'rs-tenant-row-id',
        render: (v: string) => <Tag color="blue">{v}</Tag>,
      },
      {
        title: 'Base URL',
        dataIndex: 'baseUrl',
        ellipsis: true,
        className: 'rs-tenant-row-url',
        render: (v: string) => (
          <Tooltip title={v}>
            <a href={v} target="_blank" rel="noreferrer">{v}</a>
          </Tooltip>
        ),
      },
      {
        title: 'API Token',
        dataIndex: 'apiToken',
        width: 200,
        render: (v: string, row: DynaTenant) => {
          const visible = visibleTokens[row._id];
          const masked = v.slice(0, 10) + '••••••••••••';
          return (
            <span className="rs-token-cell">
              <span className={`rs-token-value${visible ? ' rs-token-visible' : ''}`}>
                {visible ? v : masked}
              </span>
              <Button
                type="text"
                size="small"
                className="rs-token-toggle"
                icon={visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => toggleToken(row._id)}
              />
            </span>
          );
        },
      },
      {
        title: '',
        width: 48,
        render: (_: unknown, row: DynaTenant) => (
          <Tooltip title="Editar tenant">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              className="rs-edit-btn"
              onClick={() => setEditing(row)}
            />
          </Tooltip>
        ),
      },
    ];

    return (
      <>
        {/* Botões - omitidos no modo headless */}
        {!headless && (
          <Button
            icon={<UnorderedListOutlined />}
            onClick={openList}
          >
            Listar tenants
          </Button>
        )}

        {/* ── Modal de listagem ── */}
        <Modal
          open={listOpen}
          className="rs-list-modal"
          title={
            <>
              <UnorderedListOutlined style={{ color: '#3b82f6', marginRight: 8 }} />
              Tenants cadastrados
            </>
          }
          onCancel={() => setListOpen(false)}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateOpen(true)}
              >
                Novo tenant
              </Button>
              <Button onClick={() => setListOpen(false)}>Fechar</Button>
            </div>
          }
          width={900}
        >
          {loadingList ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table<DynaTenant>
              dataSource={tenants}
              rowKey="_id"
              size="small"
              pagination={false}
              scroll={{ x: 820 }}
              columns={columns}
            />
          )}
        </Modal>

        {/* ── Modal de criação ── */}
        <CreateTenantModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />

        {/* ── Modal de edição ── */}
        <EditTenantModal
          tenant={editing}
          onClose={() => setEditing(null)}
          onUpdated={handleUpdated}
        />
      </>
    );
  }
);

TenantManager.displayName = 'TenantManager';

export default TenantManager;