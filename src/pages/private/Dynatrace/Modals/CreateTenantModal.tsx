import { useState } from 'react';
import {
  Modal, Form, Input, InputNumber, DatePicker, Button, Alert, Typography, Divider, Collapse, Spin,
} from 'antd';
import {
  PlusOutlined, ApiOutlined, ThunderboltOutlined, CheckCircleOutlined, DollarOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { dynaTenantService, type DynaTenant } from '@/services/dynaTenantService';
import { API_PLATFORM_CONTROL } from '@/config';
import './css/CreateTenantModal.css';

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (tenant: DynaTenant) => void;
}

interface FormValues {
  nome: string;
  label: string;
  tenantId: string;
  baseUrl: string;
  apiToken: string;
  descricao?: string;
  // ── Licenciamento Classic (opcional — só usado pelo módulo de Licenciamento) ──
  hostUnitsQuota?: number;
  dduQuota?: number;
  demQuota?: number;
  appSecurityQuota?: number;
  licensePeriodStart?: Dayjs;
}

export const CreateTenantModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [adminToken, setAdminToken] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState(false);

  const handleGenerateToken = async () => {
    const baseUrl = form.getFieldValue('baseUrl')?.trim();
    if (!baseUrl) {
      setGenerateError('Preencha o campo "Base URL" antes de gerar o token.');
      return;
    }
    if (!adminToken.trim()) {
      setGenerateError('Informe um token de administrador para autenticar a criação.');
      return;
    }

    setGenerating(true);
    setGenerateError(null);
    setGenerateSuccess(false);

    try {
      const res = await fetch(`${API_PLATFORM_CONTROL}/api/dynatrace/tokens/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, adminToken: adminToken.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setGenerateError(data.message || 'Erro ao gerar token.');
        return;
      }

      form.setFieldValue('apiToken', data.token);
      setGenerateSuccess(true);
      setAdminToken('');
    } catch (err: any) {
      setGenerateError(err.message ?? 'Falha de rede.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setError(null);

      const tenant = await dynaTenantService.criar({
        nome: values.nome.trim(),
        label: values.label.trim(),
        tenantId: values.tenantId.trim(),
        baseUrl: values.baseUrl.trim().replace(/\/$/, ''),
        apiToken: values.apiToken.trim(),
        descricao: values.descricao?.trim() || undefined,
        // Licenciamento Classic — opcional, pode ficar pra depois na edição
        hostUnitsQuota: values.hostUnitsQuota ?? undefined,
        dduQuota: values.dduQuota ?? undefined,
        demQuota: values.demQuota ?? undefined,
        appSecurityQuota: values.appSecurityQuota ?? undefined,
        licensePeriodStart: values.licensePeriodStart ? values.licensePeriodStart.toISOString() : undefined,
      });

      form.resetFields();
      setAdminToken('');
      setGenerateSuccess(false);
      onCreated?.(tenant);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Erro ao criar tenant.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setAdminToken('');
    setError(null);
    setGenerateError(null);
    setGenerateSuccess(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      className="ctm-modal"
      title={
        <span className="ctm-title">
          <ApiOutlined className="ctm-title-icon" />
          Novo tenant Dynatrace
        </span>
      }
      footer={
        <div className="ctm-footer">
          <Button onClick={handleCancel} disabled={loading}>Cancelar</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={loading}
            onClick={handleSubmit}
          >
            Criar tenant
          </Button>
        </div>
      }
      width={580}
      destroyOnClose
    >
      <div className="ctm-body">
        {error && (
          <Alert type="error" message={error} showIcon className="ctm-error" />
        )}

        <Form form={form} layout="vertical" requiredMark={false}>

          <div className="ctm-section-label">Identificação</div>

          <Form.Item name="nome" label="Nome" rules={[{ required: true, message: 'Informe o nome do tenant' }]}>
            <Input placeholder='Ex: "PND Produção"' />
          </Form.Item>

          <Form.Item name="label" label="Label" rules={[{ required: true, message: 'Informe o label' }]}>
            <Input placeholder='Ex: "Dynatrace PND Produção"' />
          </Form.Item>

          <Form.Item
            name="tenantId"
            label="Tenant ID"
            rules={[
              { required: true, message: 'Informe o tenant ID' },
              { pattern: /^[a-z0-9_-]+$/, message: 'Use apenas letras minúsculas, números, _ ou -' },
            ]}
          >
            <Input placeholder='Ex: "pnd_old", "fies", "inep"' />
          </Form.Item>

          <Form.Item name="descricao" label="Descrição">
            <Input.TextArea placeholder="Descrição opcional do ambiente" rows={2} style={{ resize: 'none' }} />
          </Form.Item>

          <div className="ctm-section-label ctm-section-label--mt">Conexão</div>

          <Form.Item
            name="baseUrl"
            label="Base URL"
            rules={[{ required: true, message: 'Informe a URL base' }, { type: 'url', message: 'Insira uma URL válida' }]}
          >
            <Input placeholder="https://xxxxxxxx.live.dynatrace.com" />
          </Form.Item>

          <Form.Item name="apiToken" label="API Token" rules={[{ required: true, message: 'Informe o API token' }]}>
            <Input.Password
              placeholder="dt0c01.xxxxxxxxxxxxxxxx"
              visibilityToggle
              suffix={generateSuccess ? <CheckCircleOutlined style={{ color: '#16a34a' }} /> : undefined}
            />
          </Form.Item>

          <Collapse
            ghost
            size="small"
            style={{ marginBottom: 12, marginTop: -4 }}
            items={[{
              key: 'gen',
              label: (
                <span style={{ fontSize: 13, color: '#3b82f6', fontWeight: 500 }}>
                  <ThunderboltOutlined style={{ marginRight: 6 }} />
                  Gerar token ReportAPI_v2 automaticamente
                </span>
              ),
              children: (
                <div className="ctm-token-generator">
                  <Text className="ctm-hint" style={{ display: 'block', marginBottom: 10 }}>
                    Informe um token de <strong>administrador</strong> do tenant para criar
                    o <code>ReportAPI_v2</code> com todas as permissões necessárias.
                    O token de admin <strong>não é salvo</strong> - é usado apenas nesta operação.
                  </Text>

                  {generateError && (
                    <Alert type="error" message={generateError} showIcon style={{ marginBottom: 10, borderRadius: 8 }} />
                  )}

                  {generateSuccess && (
                    <Alert type="success" message="Token ReportAPI_v2 gerado e preenchido com sucesso!" showIcon style={{ marginBottom: 10, borderRadius: 8 }} />
                  )}

                  <Input.Password
                    value={adminToken}
                    onChange={(e) => { setAdminToken(e.target.value); setGenerateError(null); setGenerateSuccess(false); }}
                    placeholder="Token de administrador (dt0c01.xxx...)"
                    style={{ marginBottom: 10 }}
                  />

                  <Button
                    type="default"
                    icon={generating ? <Spin size="small" /> : <ThunderboltOutlined />}
                    onClick={handleGenerateToken}
                    disabled={generating || !adminToken.trim()}
                    block
                  >
                    {generating ? 'Gerando token...' : 'Gerar ReportAPI_v2'}
                  </Button>
                </div>
              ),
            }]}
          />

          <Divider style={{ margin: '4px 0 12px' }} />

          <Text className="ctm-hint">
            O token precisa ter as permissões: <code>entities.read</code>,{' '}
            <code>ReadConfig</code> e <code>DataExport</code>, entre outras.
          </Text>

          {/* ── Licenciamento Classic (opcional) ── */}
          <Collapse
            ghost
            size="small"
            style={{ marginTop: 16 }}
            items={[{
              key: 'license',
              label: (
                <span style={{ fontSize: 13, color: '#3b82f6', fontWeight: 500 }}>
                  <DollarOutlined style={{ marginRight: 6 }} />
                  Licenciamento Classic (Host Units, DDU, DEM)
                </span>
              ),
              children: (
                <div className="ctm-token-generator">
                  <Text className="ctm-hint" style={{ display: 'block', marginBottom: 10 }}>
                    Usado só pelo módulo de <strong>Licenciamento</strong>, pra tenants Classic.
                    Pode deixar em branco agora e preencher depois, editando o tenant.
                  </Text>

                  <Form.Item name="hostUnitsQuota" label="Quota de Host Units" style={{ marginBottom: 10 }}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Ex: 150" />
                  </Form.Item>

                  <Form.Item name="dduQuota" label="Quota de DDU (Davis Data Units)" style={{ marginBottom: 10 }}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Ex: 1500000" />
                  </Form.Item>

                  <Form.Item name="demQuota" label="Quota de DEM (Digital Experience Monitoring)" style={{ marginBottom: 10 }}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Ex: 12500000" />
                  </Form.Item>

                  <Form.Item name="appSecurityQuota" label="Quota de Application Security Units" style={{ marginBottom: 10 }}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Ex: 1080000" />
                  </Form.Item>

                  <Form.Item
                    name="licensePeriodStart"
                    label="Início do período de contrato"
                    style={{ marginBottom: 0 }}
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Data de aniversário do contrato" />
                  </Form.Item>
                </div>
              ),
            }]}
          />

        </Form>
      </div>
    </Modal>
  );
};

export default CreateTenantModal;