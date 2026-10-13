import { Card } from 'antd';
import '../components/css/Cards.module.css'

type Props = {
  sessionCount: number | null;
  requestCount: number | null;
  apdexValue: number | null;
  hostAvailability: number | null;
};

const formatCompact = (n: number | null, fallback = '-') =>
  n == null ? fallback : `~${Intl.NumberFormat('en', { notation: 'compact' }).format(n)}`;

const formatPercent = (n: number | null, digits = 2) =>
  n == null ? '-' : `${n.toFixed(digits)}%`;

export const KpiSummarySection: React.FC<Props> = ({
  sessionCount,
  requestCount,
  apdexValue,
  hostAvailability,
}) => (
  <section className="section" id="kpis-resumo">
    <h2 className="sectionTitle">Key Performance Indicators - Resumo</h2>

    <div className="kpiGrid">
      <Card className="kpiHover" styles={{ body: { textAlign: 'center' } }}>
        <div className="kpiTitle">Total de Sessões de Usuário Monitoradas</div>
        <div className="kpiValue" style={{ marginTop: 8 }}>
          {formatCompact(sessionCount)}
        </div>
      </Card>

      <Card className="kpiHover" styles={{ body: { textAlign: 'center' } }}>
        <div className="kpiTitle">Total de Requisições (APACHE)</div>
        <div className="kpiValue" style={{ marginTop: 8 }}>
          {formatCompact(requestCount)}
        </div>
      </Card>

      <Card className="kpiHover" styles={{ body: { textAlign: 'center' } }}>
        <div className="kpiTitle">Média Geral da Experiência do Usuário (APDEX)</div>
        <div className="kpiValue" style={{ marginTop: 8 }}>
          {apdexValue != null ? apdexValue.toFixed(2) : '-'}
        </div>
      </Card>

      <Card className="kpiHover" styles={{ body: { textAlign: 'center' } }}>
        <div className="kpiTitle">Disponibilidade da Aplicação</div>
        <div className="kpiValue" style={{ marginTop: 8, marginLeft: 20 }}>
          {formatPercent(hostAvailability)}
        </div>
      </Card>
    </div>
  </section>
);

export default KpiSummarySection;