// pages/private/Dynatrace/PlatformCredentials/PlatformCredentialsPage.tsx
//
// Rota sugerida:
//   <Route path="/platform-credentials" element={<PlatformCredentialsPage />} />
// HomePage:
//   const handlePlatformClick = () => navigate('/platform-credentials');

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Typography, Divider, Table, Tag, Tooltip,
  Button, Alert, Skeleton, Popconfirm, App,
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, KeyOutlined,
  ApiOutlined, EditOutlined, DeleteOutlined,
  ThunderboltOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  dynaPlatformCredentialsService,
  type PlatformCredential,
} from '@/services/dynaPlatformCredentialsService';
import PlatformCredentialModal from './PlatformCredentialModal';
import './css/PlatformCredentialsPage.css';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Agrupamento: uma linha por cliente (tenant) — credenciais sem tenantRef
// caem num grupo "Sem vínculo (global)".
// ---------------------------------------------------------------------------
interface TenantGroup {
  tenantKey: string;
  tenantLabel: string;
  tenantId: string | null;
  credentials: PlatformCredential[];
}

function groupByTenant(credentials: PlatformCredential[]): TenantGroup[] {
  const map = new Map<string, TenantGroup>();

  for (const cred of credentials) {
    const key = cred.tenantRef?._id ?? '__global__';
    if (!map.has(key)) {
      map.set(key, {
        tenantKey: key,
        tenantLabel: cred.tenantRef ? cred.tenantRef.nome : 'Sem vínculo (global)',
        tenantId: cred.tenantRef?.tenantId ?? null,
        credentials: [],
      });
    }
    map.get(key)!.credentials.push(cred);
  }

  return Array.from(map.values()).sort((a, b) => a.tenantLabel.localeCompare(b.tenantLabel));
}

function PlatformCredentialsPageInner() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<PlatformCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformCredential | null>(null);
  const [presetTenantRef, setPresetTenantRef] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  useEffect(() => { fetchCredentials(); }, []);

  async function fetchCredentials() {
    setLoading(true);
    setError(null);
    try {
      const data = await dynaPlatformCredentialsService.listar();
      setCredentials(data);
    } catch (err: any) {
      setError('Não foi possível carregar as credenciais.');
    } finally {
      setLoading(false);
    }
  }

  const groups = useMemo(() => groupByTenant(credentials), [credentials]);

  function handleOpenCreate(tenantRef?: string | null) {
    setEditing(null);
    setPresetTenantRef(tenantRef ?? null);
    setModalOpen(true);
  }

  function handleOpenEdit(cred: PlatformCredential) {
    setEditing(cred);
    setPresetTenantRef(null);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await dynaPlatformCredentialsService.excluir(id);
      message.success('Credencial removida.');
      fetchCredentials();
    } catch (err: any) {
      message.error(err.message);
    }
  }

  async function handleTest(cred: PlatformCredential) {
    setTestingId(cred._id);
    try {
      const result = await dynaPlatformCredentialsService.testar(cred._id);
      setTestResults((prev) => ({ ...prev, [cred._id]: result }));
      if (result.success) message.success('Conexão OK - Documents API acessível!');
      else message.error(result.message);
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [cred._id]: { success: false, message: err.message },
      }));
    } finally {
      setTestingId(null);
    }
  }

  // ── Chip de uma credencial (finalidade + tipo + status + ações) ──
  function CredentialChip({ cred }: { cred: PlatformCredential }) {
    // Normaliza uma vez só: registros antigos (criados antes do campo
    // "finalidade" existir) vêm com o valor undefined do banco — tratamos
    // como "documents" (era o único tipo que existia até então). Usar essa
    // variável normalizada em TODO lugar evita a inconsistência que fazia
    // o botão de testar sumir só nesses registros antigos.
    const finalidade = cred.finalidade === 'license' ? 'license' : 'documents';
    const finalidadeLabel = finalidade === 'license' ? 'Licenciamento' : 'Documents API';
    const finalidadeColor = finalidade === 'license' ? 'gold' : 'geekblue';
    const tipoIcon = cred.tipo === 'oauth_client' ? <ApiOutlined /> : <KeyOutlined />;
    const tipoLabel = cred.tipo === 'oauth_client' ? 'OAuth Client' : 'Platform Token';
    const testResult = testResults[cred._id];

    return (
      <div className="pcp-cred-chip">
        <div className="pcp-cred-chip-tags">
          <Tag color={finalidadeColor}>{finalidadeLabel}</Tag>
          <Tag icon={tipoIcon}>{tipoLabel}</Tag>
          {testResult && (
            testResult.success
              ? <Tag icon={<CheckCircleOutlined />} color="success">OK</Tag>
              : <Tooltip title={testResult.message}>
                <Tag icon={<CloseCircleOutlined />} color="error">Erro</Tag>
              </Tooltip>
          )}
          {cred.nome && <span className="pcp-cred-chip-nome">{cred.nome}</span>}
        </div>
        <div className="pcp-cred-chip-actions">
          {finalidade === 'documents' && (
            <Tooltip title="Testar conexão">
              <Button
                type="text" size="small"
                icon={<ThunderboltOutlined />}
                loading={testingId === cred._id}
                onClick={() => handleTest(cred)}
                className="pcp-btn-action"
              />
            </Tooltip>
          )}
          <Tooltip title="Editar">
            <Button
              type="text" size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEdit(cred)}
              className="pcp-btn-action"
            />
          </Tooltip>
          <Tooltip title="Remover">
            <Popconfirm
              title="Remover credencial?"
              description="Esta ação não pode ser desfeita."
              onConfirm={() => handleDelete(cred._id)}
              okText="Remover"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" size="small" icon={<DeleteOutlined />} danger className="pcp-btn-action" />
            </Popconfirm>
          </Tooltip>
        </div>
      </div>
    );
  }

  const columns = [
    {
      title: 'Cliente',
      dataIndex: 'tenantLabel',
      key: 'tenantLabel',
      width: 220,
      render: (label: string, row: TenantGroup) => (
        <div>
          <span className="pcp-cred-nome">{label}</span>
          {row.tenantId && <Tag color="blue" style={{ fontSize: 10, marginLeft: 6 }}>{row.tenantId}</Tag>}
        </div>
      ),
    },
    {
      title: 'Credenciais',
      dataIndex: 'credentials',
      key: 'credentials',
      render: (creds: PlatformCredential[], row: TenantGroup) => (
        <div className="pcp-cred-chip-list">
          {creds.map((cred) => <CredentialChip key={cred._id} cred={cred} />)}
          {row.tenantKey !== '__global__' && (
            <Tooltip title="Adicionar credencial para este cliente">
              <Button
                type="dashed" size="small" icon={<PlusOutlined />}
                onClick={() => handleOpenCreate(row.tenantKey)}
              >
                Adicionar
              </Button>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="pcp-wrapper">
      <Card className="pcp-card">

        {/* ── Header ── */}
        <div className="pcp-header">
          <div className="pcp-header-left">
            <div className="pcp-logo-box">
              <span className="pcp-logo-text">PORTAL</span>
            </div>
            <div>
              <Title level={4} className="pcp-title">Credenciais de Plataforma</Title>
              <Text className="pcp-subtitle">
                Documents API (Dashboards Gen3, Notebooks) e Account Management API (Licenciamento) — por cliente
              </Text>
            </div>
          </div>
          <div className="pcp-header-right">
            <div className="pcp-powered">Powered by <span>SISC</span></div>
            <div className="pcp-badge-env">Platform API</div>
          </div>
        </div>

        <Divider className="pcp-divider" />

        {/* ── Toolbar ── */}
        <div className="pcp-toolbar">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
            Voltar ao portal
          </Button>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<ReloadOutlined />} onClick={fetchCredentials} loading={loading}>
              Atualizar
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenCreate(null)}>
              Nova credencial
            </Button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <Alert type="error" message={error} showIcon className="pcp-error" />
        )}

        {/* ── Skeletons ── */}
        {loading && (
          <div className="pcp-skeleton">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="pcp-skeleton-card">
                <Skeleton active paragraph={{ rows: 1 }} title={false} />
              </Card>
            ))}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && groups.length === 0 && (
          <div className="pcp-empty">
            <KeyOutlined style={{ fontSize: 28, marginBottom: 10 }} />
            <p>Nenhuma credencial de plataforma cadastrada.</p>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenCreate(null)}>
              Cadastrar primeira credencial
            </Button>
          </div>
        )}

        {/* ── Tabela agrupada por cliente ── */}
        {!loading && groups.length > 0 && (
          <Table<TenantGroup>
            dataSource={groups}
            rowKey="tenantKey"
            columns={columns}
            pagination={false}
            size="small"
            className="pcp-table"
            scroll={{ x: 860 }}
          />
        )}

      </Card>

      {/* ── Modal ── */}
      <PlatformCredentialModal
        open={modalOpen}
        editing={editing}
        presetTenantRef={presetTenantRef}
        onClose={() => { setModalOpen(false); setEditing(null); setPresetTenantRef(null); }}
        onSaved={fetchCredentials}
      />
    </div>
  );
}

export default function PlatformCredentialsPage() {
  return <App><PlatformCredentialsPageInner /></App>;
}