import BrowserUsagePie from '../components/BrowserUsagePie';
import OsUsagePie from '../components/OsUsagePie';
import type { BrowserRow, OsRow } from '../../types/dashboardReport';

type Props = {
  browserData: BrowserRow[];
  osData: OsRow[];
};

export const PlatformProfileSection: React.FC<Props> = ({ browserData, osData }) => (
  <section className="section" id="platform-profile">
    <h2 className="sectionTitle">Perfil de Plataforma</h2>

    <div
      style={{
        display: 'grid',
        gap: 32,
        gridTemplateColumns: window.innerWidth >= 900 ? '1fr 1fr' : '1fr',
      }}
    >
      {/* OS */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3
          style={{
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: 16,
            fontSize: 20,
          }}
        >
          Distribuição por Sistema Operacional
        </h3>

        <p
          style={{
            textAlign: 'center',
            color: '#6b7280',
            marginBottom: 24,
          }}
        >
          Aqui temos a distribuição das ações por família de sistema operacional
          (ex.: Windows, Android, iOS). Assim como no gráfico de navegadores, o TOP 5
          é apresentado explicitamente e o restante agrupado em &quot;Outros&quot;.
        </p>

        <OsUsagePie data={osData} />
      </div>

      {/* Browser */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3
          style={{
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: 16,
            fontSize: 20,
          }}
        >
          Distribuição por Navegador
        </h3>

        <p
          style={{
            textAlign: 'center',
            color: '#6b7280',
            marginBottom: 24,
          }}
        >
          Esta visão mostra os principais navegadores utilizados pelos usuários no
          período, agrupados por família de browser. O TOP 5 é destacado no gráfico, e
          todos os demais navegadores são consolidados em &quot;Outros&quot;.
        </p>

        <BrowserUsagePie data={browserData} />
      </div>
    </div>
  </section>
);

export default PlatformProfileSection;
