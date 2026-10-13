import { useEffect, useState } from 'react';
import {
  Card,
  Select,
  Checkbox,
  Button,
  Spin,
  Typography,
  Input,
  DatePicker,
  Row,
  Col,
  Divider,
} from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';

import { useTenant } from '../../../../../context/TenantContext';
import type { FrontendApp } from '../../types/dashboardReport';
import { useDashboardData } from '../../../../../hooks/useDashboardReport';

import './css/TenantSelectionPage.css';
import { dynaTenantService } from '@/services/dynaTenantService';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;

interface SelectionLocationState {
  tenantId?: string;   // _id do MongoDB vindo da ReportSelectionPage
  tenantName?: string;   // nome amigável para pré-preencher o headerPrefix
}

export const TenantSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Estado vindo da ReportSelectionPage (opcional)
  const { tenantId: preselectedTenantId, tenantName } =
    (location.state ?? {}) as SelectionLocationState;

  const {
    tenants,
    selectedTenant,
    selectedApps,
    setTenant,
    setSelectedApps,
  } = useTenant();

  const [loadingFronts, setLoadingFronts] = useState(false);
  const [fronts, setFronts] = useState<FrontendApp[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Pré-preenche o nome do relatório com o nome do tenant se vier da seleção
  const [headerPrefix, setHeaderPrefix] = useState<string>(
    tenantName ?? 'Aplicação Projeto',
  );

  const [availabilityMode, setAvailabilityMode] = useState<'host' | 'synthetic'>('host');

  // Período padrão: hoje 08:00 → 23:59
  const today = dayjs();
  const defaultStart = today.hour(8).minute(0).second(0).millisecond(0);
  const defaultEnd = today.hour(23).minute(59).second(0).millisecond(0);

  const {
    dateRange,
    setDateRange,
    tagKey,
    setTagKey,
    tagValue,
    setTagValue,
    tagKeyOptions,
    tagValueOptions,
  } = useDashboardData({ initialDateRange: [defaultStart, defaultEnd] });

  // Pré-seleciona o tenant quando a página carrega (vindo da ReportSelectionPage)
  useEffect(() => {
    if (!preselectedTenantId || tenants.length === 0) return;

    // Encontra o tenant pelo _id recebido no state
    const match = tenants.find((t) => t._id === preselectedTenantId);
    if (match) setTenant(match.tenantId);
  }, [preselectedTenantId, tenants]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recarrega os frontends ao trocar de tenant
  useEffect(() => {
    if (!selectedTenant) {
      setFronts([]);
      setSelectedApps([]);
      return;
    }

    const loadFronts = async () => {
      try {
        setLoadingFronts(true);
        setError(null);

        dynaTenantService
          .getFrontends(selectedTenant._id)
          .then((dyTena: FrontendApp[]) => {
            setFronts(dyTena);
            const stillValid = selectedApps.filter((id) =>
              dyTena.some((app) => app.id === id),
            );
            setSelectedApps(stillValid);
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              console.error('Erro ao carregar frontends:', err);
            }
          });
      } catch (err: any) {
        console.error('Erro ao carregar frontends:', err);
        setError('Falha ao carregar aplicações frontend.');
      } finally {
        setLoadingFronts(false);
      }
    };

    loadFronts();
  }, [selectedTenant?.tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChangeTenant = (tenantId: string) => {
    setTenant(tenantId);
    setSelectedApps([]);
  };

  const handleChangeFronts = (vals: any[]) => {
    setSelectedApps(vals as string[]);
  };

  const handleContinue = () => {
    if (!selectedTenant || selectedApps.length === 0) return;

    const prefixToUse = headerPrefix.trim() || 'Aplicação Projeto';
    const [start, end] = dateRange || [];

    navigate('/form-report/report', {
      state: {
        headerPrefix: prefixToUse,
        tenantId: selectedTenant._id,   // repassa para o ReportPage
        from: start ? start.valueOf() : undefined,
        to: end ? end.valueOf() : undefined,
        initialTagKey: tagKey,
        initialTagValue: tagValue,
        availabilityMode,
      },
    });
  };

  const isContinueDisabled = !selectedTenant || selectedApps.length === 0;

  const quickSetRange = (type: 'last2h' | 'today' | 'yesterday' | 'last7d') => {
    const now = dayjs();
    if (type === 'last2h') {
      setDateRange([now.subtract(2, 'hour'), now] as any);
    } else if (type === 'today') {
      setDateRange([
        now.hour(8).minute(0).second(0).millisecond(0),
        now.hour(23).minute(59).second(0).millisecond(0),
      ] as any);
    } else if (type === 'yesterday') {
      const y = now.subtract(1, 'day');
      setDateRange([
        y.hour(8).minute(0).second(0).millisecond(0),
        y.hour(23).minute(59).second(0).millisecond(0),
      ] as any);
    } else if (type === 'last7d') {
      setDateRange([now.subtract(7, 'day'), now] as any);
    }
  };

  const formatRangeSummary = () => {
    const [start, end] = dateRange || [];
    if (!start || !end) return '';
    return `${dayjs(start).format('DD/MM HH:mm')} – ${dayjs(end).format('DD/MM HH:mm')}`;
  };

  const LogoVeryPill = () => (
    <div
      style={{
        height: 120,
        paddingInline: 1,
        borderRadius: 999,
        background: '#E5F0FF',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <img
        src="/logo_2.jpg"
        alt="Very Tecnologia"
        style={{ maxHeight: '100%', width: 'auto', objectFit: 'contain', display: 'block' }}
      />
    </div>
  );

  return (
    <div className="tenant-selection-wrapper">
      <Card className="tenant-selection-card">

        {/* ── Cabeçalho ── */}
        <div className="tenant-selection-header">
          <div className="tenant-selection-header-left">
            <LogoVeryPill />
            <div className="tenant-selection-title-block">
              <Title level={3} className="tenant-selection-title">
                Relatório de APM
              </Title>
              <Paragraph className="tenant-selection-subtitle" type="secondary">
                Configure o ambiente, período e filtros para gerar o relatório
                consolidado de desempenho.
              </Paragraph>
            </div>
          </div>
          <div className="tenant-selection-header-right">
            <Text className="tenant-selection-powered">
              Powered by <span>SISC</span>
            </Text>
            <br />
            <Text className="tenant-selection-badge">
              Observabilidade · Frontend · Backend
            </Text>
          </div>
        </div>

        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
          Voltar ao portal
        </Button>

        <Divider className="tenant-selection-divider" />

        {/* ── Nome do relatório ── */}
        <div className="tenant-selection-section">
          <label className="tenant-selection-label">
            Nome do relatório / aplicação
          </label>
          <Input
            placeholder='Ex: "Portal ENEM", "Projeto 2026", "Sistema X"'
            value={headerPrefix}
            onChange={(e) => setHeaderPrefix(e.target.value)}
          />
          <Paragraph className="tenant-selection-helper" type="secondary">
            Esse texto aparecerá no topo do PDF, antes de &quot;APM Report&quot;.
          </Paragraph>
        </div>

        {/* ── Tenant + Frontends ── */}
        <Row gutter={[16, 24]}>
          <Col xs={24} md={10}>
            <div className="tenant-selection-section">
              <label className="tenant-selection-label">
                Ambiente (Tenant)
              </label>
              {tenants.length === 0 ? (
                <Paragraph type="danger" className="tenant-selection-warning">
                  Nenhum tenant configurado em <code>VITE_SYSTEMS</code>.
                </Paragraph>
              ) : (
                <Select
                  style={{ width: '100%' }}
                  placeholder="Selecione um tenant"
                  value={selectedTenant?.tenantId}
                  onChange={handleChangeTenant}
                  options={tenants.map((t) => ({
                    value: t.tenantId,
                    label: t.nome,
                  }))}
                />
              )}
              <Paragraph className="tenant-selection-helper" type="secondary">
                Escolha o ambiente Dynatrace de onde os dados serão lidos.
              </Paragraph>
            </div>
          </Col>

          <Col xs={24} md={14}>
            <div
              className={
                'tenant-selection-section tenant-selection-fronts' +
                (!selectedTenant ? ' tenant-selection-fronts--disabled' : '')
              }
            >
              <label className="tenant-selection-label">
                Frontends (aplicações web)
              </label>
              {!selectedTenant ? (
                <Paragraph className="tenant-selection-helper" type="secondary">
                  Selecione um tenant para visualizar as aplicações disponíveis.
                </Paragraph>
              ) : loadingFronts ? (
                <div className="tenant-selection-loading"><Spin /></div>
              ) : fronts.length === 0 ? (
                <Paragraph className="tenant-selection-helper" type="secondary">
                  Nenhuma aplicação frontend encontrada para este tenant.
                </Paragraph>
              ) : (
                <Checkbox.Group
                  style={{ width: '100%' }}
                  value={selectedApps}
                  onChange={handleChangeFronts}
                >
                  <div className="tenant-selection-fronts-scroll">
                    {fronts.map((app) => (
                      <div key={app.id} className="tenant-selection-front-item">
                        <Checkbox value={app.id}>{app.name}</Checkbox>
                      </div>
                    ))}
                  </div>
                </Checkbox.Group>
              )}
              <Paragraph className="tenant-selection-helper" type="secondary">
                Você pode marcar uma ou mais aplicações para compor o relatório.
              </Paragraph>
            </div>
          </Col>
        </Row>

        <Divider className="tenant-selection-divider" />

        {/* ── Filtros ── */}
        <div className="tenant-selection-section">
          <div className="tenant-selection-filters-header">
            <Title level={4} className="tenant-selection-filters-title">
              Filtros do relatório
            </Title>
            <Text className="tenant-selection-filters-badge">
              Tudo aqui vale para todos os gráficos e KPIs.
            </Text>
          </div>
          <Paragraph className="tenant-selection-filters-subtitle" type="secondary">
            Defina o período analisado e, opcionalmente, um recorte por tags de
            serviço para focar em camadas específicas da aplicação.
          </Paragraph>

          <Row gutter={[16, 16]}>
            <Col span={24}>
              <label className="tenant-selection-label">Período do relatório</label>
              <div className="tenant-selection-quickranges">
                <span className="ts-quick-label">Atalhos:</span>
                {(['last2h', 'today', 'yesterday', 'last7d'] as const).map((t) => (
                  <Button key={t} size="small" type="text" onClick={() => quickSetRange(t)}>
                    {{ last2h: 'Últimas 2h', today: 'Hoje (08h–23h59)', yesterday: 'Ontem', last7d: 'Últimos 7 dias' }[t]}
                  </Button>
                ))}
              </div>
              <RangePicker
                style={{ width: '100%' }}
                value={dateRange as any}
                onChange={(range) => setDateRange(range as any)}
                showTime={{ format: 'HH:mm' }}
                format="DD/MM/YYYY HH:mm"
              />
              <Paragraph className="tenant-selection-helper" type="secondary">
                Janela de tempo usada para Apdex, requisições, sessões e demais métricas.
              </Paragraph>
            </Col>

            <Col xs={24} md={12}>
              <label className="tenant-selection-label">Tag de serviço (chave)</label>
              <Select
                style={{ width: '100%' }}
                placeholder="Ex: env, sistema, enemprd"
                value={tagKey}
                onChange={setTagKey}
                options={tagKeyOptions}
                disabled={!selectedTenant || selectedApps.length === 0}
              />
              <Paragraph className="tenant-selection-helper" type="secondary">
                Escolha qual chave de tag será usada para filtrar os serviços de backend.
              </Paragraph>
            </Col>

            <Col xs={24} md={12}>
              <label className="tenant-selection-label">Tag de serviço (valor)</label>
              <Select
                style={{ width: '100%' }}
                placeholder="Ex: front, back, database"
                value={tagValue}
                onChange={setTagValue}
                options={tagValueOptions}
                disabled={!selectedTenant || selectedApps.length === 0}
              />
              <Paragraph className="tenant-selection-helper" type="secondary">
                Use &quot;Todas&quot; para não restringir o valor da tag, ou
                escolha um valor específico para focar em uma camada.
              </Paragraph>
            </Col>

            <Col xs={24} md={12}>
              <label className="tenant-selection-label">Origem da disponibilidade</label>
              <Select
                style={{ width: '100%' }}
                value={availabilityMode}
                onChange={(value) => setAvailabilityMode(value as 'host' | 'synthetic')}
                options={[
                  { value: 'host', label: 'Hosts de infraestrutura' },
                  { value: 'synthetic', label: 'Monitores sintéticos (browser)' },
                ]}
              />
              <Paragraph className="tenant-selection-helper" type="secondary">
                Define se o índice de disponibilidade será calculado a partir
                dos hosts monitorados ou dos testes sintéticos de navegador.
              </Paragraph>
            </Col>
          </Row>
        </div>

        {error && (
          <Paragraph type="danger" className="tenant-selection-error">
            {error}
          </Paragraph>
        )}

        <Divider className="tenant-selection-divider" />

        {/* ── Footer ── */}
        <div className="tenant-selection-footer">
          <div className="tenant-selection-summary">
            <div className="tenant-selection-summary-badges">
              {selectedTenant && (
                <span className="ts-badge">
                  Tenant:&nbsp;{selectedTenant.nome || selectedTenant.tenantId}
                </span>
              )}
              {selectedApps.length > 0 && (
                <span className="ts-badge">
                  {selectedApps.length} frontend{selectedApps.length > 1 ? 's' : ''}
                </span>
              )}
              {dateRange?.[0] && dateRange?.[1] && (
                <span className="ts-badge">Período:&nbsp;{formatRangeSummary()}</span>
              )}
              {tagKey && (
                <span className="ts-badge">
                  Tag:&nbsp;{tagKey}{tagValue && tagValue !== 'all' ? `=${tagValue}` : ' (todas)'}
                </span>
              )}
            </div>
            <Paragraph className="tenant-selection-helper" type="secondary" style={{ margin: 0 }}>
              <strong>Dica:</strong> revise os filtros acima antes de gerar o relatório.
            </Paragraph>
          </div>

          <Button
            type="primary"
            disabled={isContinueDisabled}
            onClick={handleContinue}
            size="large"
          >
            Gerar relatório
          </Button>
        </div>

      </Card>
    </div>
  );
};

export default TenantSelectionPage;