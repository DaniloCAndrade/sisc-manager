import { useEffect } from 'react';
import { Layout, Typography, Alert, Button, Table, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';

import { useApdexAnalyze } from '../../../../hooks/useDashboardAnalyze';
import type { ApdexPageRow } from '../types/dashboardApdexAnalyze';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface LocationState {
  from?: number;
  to?: number;
}

function formatHeaderRange(from?: number, to?: number) {
  if (!from || !to) return 'Período não informado';

  return `${dayjs(from).format('DD/MM/YYYY HH:mm')} – ${dayjs(to).format(
    'DD/MM/YYYY HH:mm',
  )}`;
}

function ApdexAnalyzeResultPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { from, to } = (location.state || {}) as LocationState;

  const { loading, error, data, fetchApdexAnalyze } = useApdexAnalyze();

  useEffect(() => {
    fetchApdexAnalyze({ from, to });
  }, [fetchApdexAnalyze, from, to]);

  const columns = [
    {
      title: 'Página / User Action',
      dataIndex: 'page',
      key: 'page',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'APDEX',
      dataIndex: 'apdex',
      key: 'apdex',
      width: 120,
      render: (v: number | null) =>
        v !== null ? v.toFixed(2) : '-',
    },
    {
      title: 'Categoria',
      dataIndex: 'category',
      key: 'category',
      width: 160,
      render: (cat: string) => {
        const color =
          cat === 'Unacceptable'
            ? 'red'
            : cat === 'Poor'
              ? 'orange'
              : 'default';

        return <Tag color={color}>{cat}</Tag>;
      },
    },
    {
      title: 'Acessos',
      dataIndex: 'total',
      key: 'total',
      width: 120,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
      <Header
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
            aria-label="Voltar"
            onClick={() => navigate(-1)}
            style={{
              position: 'absolute',
              left: '-55px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />

          <Title
            level={1}
            style={{
              color: '#004AAD',
              fontWeight: 900,
              margin: 0,
              fontSize: '3rem',
            }}
          >
            Análise de APDEX por Página
          </Title>

          <div
            style={{
              color: '#6b7280',
              marginTop: 8,
              fontSize: '1.125rem',
            }}
          >
            {formatHeaderRange(from, to)}
          </div>
        </div>
      </Header>

      {/* Espaçamento igual ao Report */}
      <br />
      <br />
      <br />
      <br />
      <br />

      <Content style={{ padding: 24 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {error && (
            <Alert
              message="Aviso"
              description={error}
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Table<ApdexPageRow>
            rowKey="page"
            loading={loading}
            columns={columns}
            dataSource={data?.topPages || []}
            pagination={false}
            bordered
          />

          <footer
            style={{
              marginTop: 64,
              padding: '16px 0',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center',
              color: '#6b7280',
            }}
          >
            Análise baseada no cálculo canônico de APDEX
            (Satisfied + 0.5 × Tolerating) / Total
          </footer>
        </div>
      </Content>
    </Layout>
  );
}

export default ApdexAnalyzeResultPage;