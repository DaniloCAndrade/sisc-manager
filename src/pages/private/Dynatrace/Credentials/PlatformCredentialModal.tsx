// pages/private/Dynatrace/PlatformCredentials/PlatformCredentialModal.tsx

import {
  dynaPlatformCredentialsService,
  type CredentialTipo,
  type CredentialFinalidade,
  type PlatformCredential,
} from '@/services/dynaPlatformCredentialsService';
import { dynaTenantService, type DynaTenant } from '@/services/dynaTenantService';
import {
  ApiOutlined, CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  EditOutlined,
  FileTextOutlined,
  KeyOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Form, Input,
  Modal,
  Segmented,
  Select,
  Spin,
  Typography
} from 'antd';
import { useEffect, useState } from 'react';
import '../Modals/css/CreateTenantModal.css';
import './css/PlatformCredentialModal.css';

const { Text } = Typography;

interface Props {
  open: boolean;
  editing?: PlatformCredential | null;
  presetTenantRef?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

// Campos exclusivos de cada tipo — usados pra limpar de verdade o lado que
// não está mais selecionado (Ant Design mantém valores de campos escondidos
// no form por padrão, o que antes dava a falsa impressão de que os dois
// tipos seriam salvos juntos).
const OAUTH_FIELDS = ['clientId', 'clientSecret', 'accountUrn'];
const TOKEN_FIELDS = ['platformToken'];

export default function PlatformCredentialModal({ open, editing, presetTenantRef, onClose, onSaved }: Props) {
  const [form] = Form.useForm();
  const [finalidade, setFinalidade] = useState<CredentialFinalidade>('documents');
  const [tipo, setTipo] = useState<CredentialTipo>('oauth_client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenants, setTenants] = useState<DynaTenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; docCount?: number } | null>(null);

  const isEditing = !!editing;

  // Carrega tenants para o select
  useEffect(() => {
    if (!open) return;
    setLoadingTenants(true);
    dynaTenantService.listar()
      .then(setTenants)
      .catch(() => { })
      .finally(() => setLoadingTenants(false));
  }, [open]);

  // Preenche o form via afterOpenChange - garante que o Form já está montado
  const handleAfterOpen = (opened: boolean) => {
    if (!opened) return;
    if (editing) {
      setFinalidade(editing.finalidade ?? 'documents');
      setTipo(editing.tipo);
      form.setFieldsValue({
        nome: editing.nome,
        tipo: editing.tipo,
        finalidade: editing.finalidade ?? 'documents',
        tenantRef: editing.tenantRef?._id ?? null,
        descricao: editing.descricao ?? '',
        accountUrn: editing.accountUrn ?? '',
        clientId: editing.clientId ?? '',
      });
    } else {
      form.resetFields();
      setFinalidade('documents');
      setTipo('oauth_client');
      if (presetTenantRef) {
        form.setFieldsValue({ tenantRef: presetTenantRef });
      }
    }
    setError(null);
    setTestResult(null);
  };

  // Ao trocar de tipo, limpa DE VERDADE os campos do tipo anterior — sem
  // isso, o Ant Design mantém os valores escondidos no form, dando a falsa
  // impressão de que os dois tipos seriam enviados juntos (só um vai).
  const handleTipoChange = (val: CredentialTipo) => {
    if (val === 'oauth_client') {
      form.resetFields(TOKEN_FIELDS);
    } else {
      form.resetFields(OAUTH_FIELDS);
    }
    setTipo(val);
    setTestResult(null);
  };

  const handleFinalidadeChange = (val: CredentialFinalidade) => {
    setFinalidade(val);
    setTestResult(null);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setError(null);

      const payload = {
        nome: values.nome.trim(),
        tipo,
        finalidade,
        tenantRef: values.tenantRef || null,
        descricao: values.descricao?.trim() || undefined,
        ...(tipo === 'platform_token'
          ? { platformToken: values.platformToken?.trim() }
          : {
            clientId: values.clientId?.trim(),
            clientSecret: values.clientSecret?.trim(),
            accountUrn: values.accountUrn?.trim(),
          }
        ),
      };

      if (isEditing) {
        await dynaPlatformCredentialsService.atualizar(editing!._id, payload);
      } else {
        await dynaPlatformCredentialsService.criar(payload as any);
      }

      form.resetFields();
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao salvar credencial.');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!isEditing) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const result = await dynaPlatformCredentialsService.testar(editing!._id);
      setTestResult({
        success: result.success,
        message: result.message,
        docCount: result.docCount !== undefined ? Number(result.docCount) : undefined,
      });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setError(null);
    setTestResult(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      className="ctm-modal"
      title={
        <span className="ctm-title">
          <KeyOutlined className="ctm-title-icon" />
          {isEditing ? 'Editar credencial de plataforma' : 'Nova credencial de plataforma'}
        </span>
      }
      footer={
        <div className="ctm-footer">
          <div style={{ display: 'flex', gap: 8 }}>
            {isEditing && finalidade === 'documents' && (
              <Button
                icon={testLoading ? <Spin size="small" /> : <ThunderboltOutlined />}
                onClick={handleTest}
                disabled={testLoading || loading}
              >
                Testar conexão
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={handleCancel} disabled={loading}>Cancelar</Button>
            <Button
              type="primary"
              icon={isEditing ? <EditOutlined /> : <PlusOutlined />}
              loading={loading}
              onClick={handleSubmit}
            >
              {isEditing ? 'Salvar alterações' : 'Criar credencial'}
            </Button>
          </div>
        </div>
      }
      width={580}
      afterOpenChange={handleAfterOpen}
      destroyOnHidden
    >
      <div className="ctm-body">
        {error && <Alert type="error" message={error} showIcon className="ctm-error" />}

        {testResult && (
          <Alert
            type={testResult.success ? 'success' : 'error'}
            message={testResult.success
              ? `Conexão OK - Documents API acessível${testResult.docCount !== undefined ? ` (${testResult.docCount} documento(s))` : ''}`
              : testResult.message}
            showIcon
            icon={testResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
        )}

        <Form form={form} layout="vertical" requiredMark={false}>

          {/* ── Identificação ── */}
          <div className="ctm-section-label">Identificação</div>

          <Form.Item
            name="nome"
            label="Nome"
            rules={[{ required: true, message: 'Informe um nome para identificar esta credencial' }]}
          >
            <Input placeholder='Ex: "DETRAN - Platform OAuth"' />
          </Form.Item>

          <Form.Item name="tenantRef" label="Tenant associado">
            <Select
              placeholder="Selecione o tenant (opcional)"
              loading={loadingTenants}
              allowClear
              showSearch
              optionFilterProp="label"
              options={tenants.map((t) => ({
                value: t._id,
                label: `${t.label} - ${t.tenantId}`,
              }))}
            />
          </Form.Item>

          <Form.Item name="descricao" label="Descrição">
            <Input.TextArea
              placeholder="Descrição opcional"
              rows={2}
              style={{ resize: 'none' }}
            />
          </Form.Item>

          {/* ── Finalidade ── */}
          <div className="ctm-section-label ctm-section-label--mt">Finalidade</div>

          <div className="pcm-tipo-selector">
            <Segmented
              value={finalidade}
              onChange={(v) => handleFinalidadeChange(v as CredentialFinalidade)}
              options={[
                {
                  value: 'documents',
                  label: (
                    <div className="pcm-tipo-option">
                      <FileTextOutlined />
                      <span>Documents API</span>
                    </div>
                  ),
                },
                {
                  value: 'license',
                  label: (
                    <div className="pcm-tipo-option">
                      <DollarOutlined />
                      <span>Licenciamento</span>
                    </div>
                  ),
                },
              ]}
              block
              style={{ marginBottom: 4 }}
            />
          </div>
          <p className="ctm-hint" style={{ marginBottom: 16 }}>
            {finalidade === 'documents'
              ? 'Usado pelo Inventário e Relatórios (Dashboards Gen3, Notebooks). Escopo: document:*, storage:*.'
              : 'Usado pelo módulo de Licenciamento (Account Management API). Escopo: account-uac-read.'}
          </p>

          {/* ── Tipo de credencial ── */}
          <div className="ctm-section-label">Tipo de credencial</div>
          <p className="ctm-hint" style={{ marginBottom: 8 }}>
            Um tenant pode ter as duas credenciais (Documents + Licenciamento) — são registros
            separados. Preencha e salve uma finalidade por vez.
          </p>

          <div className="pcm-tipo-selector">
            <Segmented
              value={tipo}
              onChange={(v) => handleTipoChange(v as CredentialTipo)}
              options={[
                {
                  value: 'oauth_client',
                  label: (
                    <div className="pcm-tipo-option">
                      <ApiOutlined />
                      <span>OAuth Client</span>
                    </div>
                  ),
                },
                {
                  value: 'platform_token',
                  label: (
                    <div className="pcm-tipo-option">
                      <KeyOutlined />
                      <span>Platform Token</span>
                    </div>
                  ),
                },
              ]}
              block
              style={{ marginBottom: 16 }}
            />
          </div>

          {/* ── Campos OAuth Client ── */}
          {tipo === 'oauth_client' && (
            <>
              <div className="pcm-tipo-hint">
                <ApiOutlined style={{ color: '#3b82f6', marginRight: 6 }} />
                <Text className="ctm-hint">
                  {finalidade === 'documents' ? (
                    <>Credenciais geradas no <strong>Account Management → OAuth Clients</strong>. O Bearer token é obtido e renovado automaticamente.</>
                  ) : (
                    <>Mesmo OAuth Client, com o escopo <code>account-uac-read</code> habilitado. O Account URN abaixo é o mesmo formato — o Account UUID usado na API é extraído dele automaticamente.</>
                  )}
                </Text>
              </div>

              <Form.Item
                name="clientId"
                label="Client ID"
                rules={[{ required: !isEditing, message: 'Informe o Client ID' }]}
              >
                <Input
                  placeholder="dt0s02.xxxxxxxxxxx"
                  autoComplete="off"
                />
              </Form.Item>

              <Form.Item
                name="clientSecret"
                label="Client Secret"
                rules={[{ required: !isEditing, message: 'Informe o Client Secret' }]}
                extra={isEditing ? 'Deixe em branco para manter o atual' : undefined}
              >
                <Input.Password
                  placeholder={isEditing ? '••••••••••••' : 'dt0s02.xxxxxxxxx.xxxxxxxxxxx'}
                  autoComplete="new-password"
                  visibilityToggle
                />
              </Form.Item>

              <Form.Item
                name="accountUrn"
                label="Account URN"
                rules={[{ required: !isEditing, message: 'Informe o Account URN' }]}
              >
                <Input placeholder="urn:dtaccount:xxxxx-aaaa-bbbb-cccc-dddddddddd" />
              </Form.Item>
            </>
          )}

          {/* ── Campos Platform Token ── */}
          {tipo === 'platform_token' && (
            <>
              <div className="pcm-tipo-hint">
                <KeyOutlined style={{ color: '#7c3aed', marginRight: 6 }} />
                <Text className="ctm-hint">
                  Token gerado em <strong>Account Management → Platform Tokens</strong>.
                  Formato: <code>dt0s16.xxxxxxxxx.xxx...</code>
                </Text>
              </div>

              <Form.Item
                name="platformToken"
                label="Platform Token"
                rules={[{ required: !isEditing, message: 'Informe o Platform Token' }]}
                extra={isEditing ? 'Deixe em branco para manter o atual' : undefined}
              >
                <Input.Password
                  placeholder={isEditing ? '••••••••••••' : 'dt0s16.xxxxxxxxx.xxx...'}
                  autoComplete="new-password"
                  visibilityToggle
                />
              </Form.Item>
            </>
          )}

        </Form>
      </div>
    </Modal>
  );
}