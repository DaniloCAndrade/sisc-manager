// src/pages/ReportPage.tsx
import { useEffect } from 'react';
import { Layout, Typography, Alert, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';

import { useDashboardData } from '../../../../../hooks/useDashboardReport';

import KpiSummarySection from '../sections/KpiSummarySection';
import UserExperienceSection from '../sections/UserExperienceSection';
import PlatformProfileSection from '../sections/PlatformProfileSection';
import UserBehaviorSection from '../sections/UserBehaviorSection';

import type { RangeValue } from '../../types/dashboardReport';

const { Header, Content } = Layout;
const { Title: AntTitle } = Typography;

function formatHeaderRange(range: RangeValue): string {
  if (!range || !range[0] || !range[1]) return 'Selecione um período';

  const [start, end] = range;

  const startStr = (start as any).toDate().toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
  });

  const endStr = (end as any).toDate().toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

  return `${startStr} - ${endStr}`;
}

interface ReportLocationState {
  headerPrefix?:      string;
  tenantId?:          string;
  from?:              number;
  to?:                number;
  initialTagKey?:     string;
  initialTagValue?:   string;
  availabilityMode?:  'host' | 'synthetic';
}

function ReportPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    headerPrefix,
    tenantId,
    from,
    to,
    initialTagKey,
    initialTagValue,
    availabilityMode,
  } = (location.state || {}) as ReportLocationState;

  const headerTextPrefix = headerPrefix || 'Aplicação Projeto';

  const initialRange: RangeValue = [
    from ? dayjs(from) : dayjs().subtract(2, 'hour'),
    to   ? dayjs(to)   : dayjs(),
  ];

  const {
    error,
    dateRange,
    fetchData,
    apdexValue,
    requestCount,
    sessionCount,
    hostAvailability,
    apdexCategory,
    geoData,
    browserData,
    osData,
    bounceData,
    rageData,
    ragePerPageData,
  } = useDashboardData({
    initialDateRange:        initialRange,
    initialTagKey,
    initialTagValue,
    initialAvailabilityMode: availabilityMode ?? 'host',
    tenantId,
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
      <Header
        className="site-header"
        style={{
          backgroundColor: '#F8F9FA',
          boxShadow: 'none',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '16px',
            position: 'relative',
            textAlign: 'center',
          }}
        >
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            shape="circle"
            aria-label="Voltar para seleção"
            onClick={() => navigate(-1)}
            style={{
              position: 'absolute',
              left: '-55px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />

          <AntTitle
            level={1}
            style={{
              color: '#004AAD',
              fontWeight: 900,
              margin: 0,
              fontSize: '3rem',
            }}
          >
            {headerTextPrefix} 2026 APM Report
          </AntTitle>

          <div
            style={{
              color: '#6b7280',
              marginTop: 8,
              fontSize: '1.125rem',
              lineHeight: '1.75rem',
            }}
          >
            {formatHeaderRange(dateRange)}
          </div>
        </div>
      </Header>

      <br /><br /><br /><br /><br />

      <Content style={{ padding: 24 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {error && (
            <div style={{ marginBottom: 24 }}>
              <Alert
                message="Aviso"
                description={error}
                type="warning"
                showIcon
              />
            </div>
          )}

          <KpiSummarySection
            sessionCount={sessionCount}
            requestCount={requestCount}
            apdexValue={apdexValue}
            hostAvailability={hostAvailability}
          />

          <UserExperienceSection
            apdexValue={apdexValue}
            apdexCategory={apdexCategory}
            geoData={geoData}
          />

          <PlatformProfileSection
            browserData={browserData}
            osData={osData}
          />

          <UserBehaviorSection
            bounceData={bounceData}
            rageData={rageData}
            ragePerPageData={ragePerPageData}
          />

          <footer
            className="text-center"
            style={{
              marginTop: 64,
              padding: '16px 0',
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <p style={{ color: '#6b7280' }}>
              Dynatrace APM &amp; Reliability Report | Generated by SISC
              Application Monitoring
            </p>
          </footer>
        </div>
      </Content>
    </Layout>
  );
}

export default ReportPage;