/**
 * EditTenantModal.tsx
 * Modal de edição de tenant Dynatrace.
 * Componente isolado - pode ser importado em qualquer página.
 *
 * Uso:
 *   <EditTenantModal
 *     tenant={selectedTenant}   // null = fechado
 *     onClose={() => setSelected(null)}
 *     onUpdated={(updated) => refresh(updated)}
 *   />
 */

import { useEffect, useState } from 'react';
import {
  Modal, Form, Input, InputNumber, DatePicker, Button, Alert, Typography, Divider, Collapse,
} from 'antd';
import { EditOutlined, ApiOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { dynaTenantService, type DynaTenant } from '@/services/dynaTenantService';
import './css/CreateTenantModal.css'; // reutiliza o mesmo CSS (mesma linguagem visual)

const { Text } = Typography;

interface Props {
  tenant: DynaTenant | null;  // null = modal fechada
  onClose: () => void;
  onUpdated?: (updated: DynaTenant) => void;
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

export const EditTenantModal: React.FC<Props> = ({ tenant, onClose, onUpdated }) => {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preenche o formulário sempre que o tenant mudar
  useEffect(() => {
    if (tenant) {
      form.setFieldsValue({
        nome: tenant.nome,
        label: tenant.label,
        tenantId: tenant.tenantId,
        baseUrl: tenant.baseUrl,
        apiToken: tenant.apiToken,
        descricao: tenant.descricao ?? '',
        hostUnitsQuota: tenant.hostUnitsQuota ?? undefined,
        dduQuota: tenant.dduQuota ?? undefined,
        demQuota: tenant.demQuota ?? undefined,
        appSecurityQuota: tenant.appSecurityQuota ?? undefined,
        licensePeriodStart: tenant.licensePeriodStart ? dayjs(tenant.licensePeriodStart) : undefined,
      });
      setError(null);
    }
  }, [tenant, form]);

  const handleSubmit = async () => {
    if (!tenant) return;
    try {
      const values = await form.validateFields();
      setLoading(true);
      setError(null);

      const updated = await dynaTenantService.atualizar(tenant._id, {
        nome: values.nome.trim(),
        label: values.label.trim(),
        tenantId: values.tenantId.trim(),
        baseUrl: values.baseUrl.trim().replace(/\/$/, ''),
        apiToken: values.apiToken.trim(),
        descricao: values.descricao?.trim() || undefined,
        // Licenciamento Classic — envia null explicitamente quando o campo
        // for limpo (em vez de omitir), pra permitir remover uma quota já
        // cadastrada.
        hostUnitsQuota: values.hostUnitsQuota ?? null,
        dduQuota: values.dduQuota ?? null,
        demQuota: values.demQuota ?? null,
        appSecurityQuota: values.appSecurityQuota ?? null,
        licensePeriodStart: values.licensePeriodStart ? values.licensePeriodStart.toISOString() : null,
      });

      onUpdated?.(updated);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Erro ao atualizar tenant.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal
      open={!!tenant}
      onCancel={handleCancel}
      className="ctm-modal"
      title={
        <span className="ctm-title">
          <EditOutlined className="ctm-title-icon" />
          Editar tenant
        </span>
      }
      footer={
        <div className="ctm-footer">
          <Button onClick={handleCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            loading={loading}
            onClick={handleSubmit}
          >
            Salvar alterações
          </Button>
        </div>
      }
      width={560}
      destroyOnClose
    >
      <div className="ctm-body">
        {error && (
          <Alert type="error" message={error} showIcon className="ctm-error" />
        )}

        <Form form={form} layout="vertical" requiredMark={false}>

          {/* ── Identificação ── */}
          <div className="ctm-section-label">Identificação</div>

          <Form.Item
            name="nome"
            label="Nome"
            rules={[{ required: true, message: 'Informe o nome do tenant' }]}
          >
            <Input placeholder='Ex: "PND Produção"' />
          </Form.Item>

          <Form.Item
            name="label"
            label="Label"
            rules={[{ required: true, message: 'Informe o label' }]}
          >
            <Input placeholder='Ex: "Dynatrace PND Produção"' />
          </Form.Item>

          <Form.Item
            name="tenantId"
            label="Tenant ID"
            rules={[
              { required: true, message: 'Informe o tenant ID' },
              {
                pattern: /^[a-z0-9_-]+$/,
                message: 'Use apenas letras minúsculas, números, _ ou -',
              },
            ]}
          >
            <Input placeholder='Ex: "pnd_old", "fies", "inep"' />
          </Form.Item>

          <Form.Item name="descricao" label="Descrição">
            <Input.TextArea
              placeholder="Descrição opcional do ambiente"
              rows={2}
              style={{ resize: 'none' }}
            />
          </Form.Item>

          {/* ── Conexão ── */}
          <div className="ctm-section-label ctm-section-label--mt">Conexão</div>

          <Form.Item
            name="baseUrl"
            label="Base URL"
            rules={[
              { required: true, message: 'Informe a URL base' },
              { type: 'url', message: 'Insira uma URL válida' },
            ]}
          >
            <Input placeholder="https://xxxxxxxx.live.dynatrace.com" />
          </Form.Item>

          <Form.Item
            name="apiToken"
            label="API Token"
            rules={[{ required: true, message: 'Informe o API token' }]}
          >
            <Input.Password
              placeholder="dt0c01.xxxxxxxxxxxxxxxx"
              visibilityToggle
            />
          </Form.Item>

          <Divider style={{ margin: '4px 0 12px' }} />

          <Text className="ctm-hint">
            <ApiOutlined style={{ marginRight: 4 }} />
            O token precisa ter as permissões: <code>entities.read</code>,{' '}
            <code>metrics.read</code> e <code>DataExport</code>.
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
                    Usado só pelo módulo de <strong>Licenciamento</strong>, pra tenants Classic
                    (sem API própria pra buscar isso — precisa preencher manualmente com os
                    valores contratados). Deixe em branco se esse tenant for DPS ou se ainda
                    não for acompanhar licenciamento por aqui.
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

export default EditTenantModal;