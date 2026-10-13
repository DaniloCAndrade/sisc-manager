import {
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Row,
  Select,
  Spin,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { dynaTenantService } from '@/services/dynaTenantService';
import { useTenant } from '../../../../context/TenantContext';
import type { FrontendApp } from '../types/dashboardApdexAnalyze';
import { ArrowLeftOutlined } from '@ant-design/icons';

// import './css/TenantSelectionPage.css';

const { Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;

export const FormApdexAnalyze: React.FC = () => {
  const navigate = useNavigate();

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

  // 🔹 Período padrão: últimas 2h
  const [dateRange, setDateRange] = useState<any>([
    dayjs().subtract(2, 'hour'),
    dayjs(),
  ]);

  // --------------------------------------------------
  // Carrega frontends ao trocar tenant
  // --------------------------------------------------
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

        // TODO ................. 
        dynaTenantService.getFrontends(selectedTenant._id)
          .then((dyTena: FrontendApp[]) => {
            setFronts(dyTena);
            // mantém só apps ainda existentes
            const stillValid = selectedApps.filter((id) =>
              dyTena.some((app) => app.id === id),
            );
            setSelectedApps(stillValid);
          })
          .catch(error => {
            if (error.name !== 'AbortError') {
              console.error('Erro ao carregar tenants:', error);
            }
          });
        /*
       const { data } = await axios.get<FrontendApp[]>(
         `${API_BASE_URL}/config/frontends`,
         {
           params: { tenantId: selectedTenant.tenantId },
         },
       );

       setFronts(data);

       // mantém apenas apps ainda válidos
       const stillValid = selectedApps.filter((id) =>
         data.some((app) => app.id === id),
       );
       setSelectedApps(stillValid); // */
      } catch (err) {
        console.error('Erro ao carregar frontends:', err);
        setError('Falha ao carregar aplicações frontend.');
      } finally {
        setLoadingFronts(false);
      }
    };

    loadFronts();
  }, [selectedTenant?.tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  // --------------------------------------------------
  // Handlers
  // --------------------------------------------------
  const handleChangeTenant = (tenantId: string) => {
    setTenant(tenantId);
    setSelectedApps([]);
  };

  const handleChangeFronts = (vals: any[]) => {
    setSelectedApps(vals as string[]);
  };

  const handleContinue = () => {
    if (!selectedTenant || selectedApps.length === 0) return;

    const [start, end] = dateRange || [];

    navigate('/form-apdex-analyze/result', {
      state: {
        from: start ? start.valueOf() : undefined,
        to: end ? end.valueOf() : undefined,
      },
    });
  };

  const isContinueDisabled =
    !selectedTenant || selectedApps.length === 0 || !dateRange;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="tenant-selection-wrapper">
      <Card className="tenant-selection-card">
        {/* Cabeçalho */}
        <div className="tenant-selection-header">
          <div className="tenant-selection-title-block">
            <Title level={3}>Análise de APDEX – Frontend</Title>
            <Paragraph type="secondary">
              Selecione o ambiente, as aplicações e o período para identificar
              as páginas mais acessadas com pior experiência do usuário.
            </Paragraph>
          </div>
        </div>

        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
          Voltar ao portal
        </Button>
        <Divider />

        {/* Tenant + Frontends */}
        <Row gutter={[16, 24]}>
          <Col xs={24} md={10}>
            <label className="tenant-selection-label">
              Ambiente (Tenant)
            </label>

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
          </Col>

          <Col xs={24} md={14}>
            <label className="tenant-selection-label">
              Frontends (aplicações web)
            </label>

            {!selectedTenant ? (
              <Paragraph type="secondary">
                Selecione um tenant para listar as aplicações.
              </Paragraph>
            ) : loadingFronts ? (
              <Spin />
            ) : fronts.length === 0 ? (
              <Paragraph type="secondary">
                Nenhuma aplicação frontend encontrada.
              </Paragraph>
            ) : (
              <Checkbox.Group
                style={{ width: '100%' }}
                value={selectedApps}
                onChange={handleChangeFronts}
              >
                <div className="tenant-selection-fronts-scroll">
                  {fronts.map((app) => (
                    <div key={app.id}>
                      <Checkbox value={app.id}>{app.name}</Checkbox>
                    </div>
                  ))}
                </div>
              </Checkbox.Group>
            )}
          </Col>
        </Row>

        <Divider />

        {/* Período */}
        <div className="tenant-selection-section">
          <label className="tenant-selection-label">
            Período de análise
          </label>

          <RangePicker
            style={{ width: '100%' }}
            value={dateRange}
            onChange={(range) => setDateRange(range)}
            showTime={{ format: 'HH:mm' }}
            format="DD/MM/YYYY HH:mm"
          />

          <Paragraph type="secondary">
            Janela de tempo usada para calcular o APDEX por página.
          </Paragraph>
        </div>

        {error && (
          <Paragraph type="danger">{error}</Paragraph>
        )}

        <Divider />

        <div className="tenant-selection-footer">
          <Button
            type="primary"
            size="large"
            disabled={isContinueDisabled}
            onClick={handleContinue}
          >
            Analisar APDEX
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default FormApdexAnalyze;
