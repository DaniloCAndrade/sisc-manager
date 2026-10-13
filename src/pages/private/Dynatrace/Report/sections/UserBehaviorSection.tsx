import BounceRatePie from '../components/BounceRatePie';
import RageClicksPie from '../components/RageClicksPie';
import RageClicksPerPagePie from '../components/RageClicksPerPagePie';
import type { BounceRow, RageRow, RagePerPagePieRow } from '../../types/dashboardReport';

type Props = {
  bounceData: BounceRow[];
  rageData: RageRow[];
  ragePerPageData: RagePerPagePieRow[];
};

export const UserBehaviorSection: React.FC<Props> = ({ bounceData, rageData, ragePerPageData }) => (
  <>
    <section className="section" id="behavior">
      <h2 className="sectionTitle">Comportamento do Usuário - Bounce & Rage Clicks</h2>

      <div
        style={{
          display: 'grid',
          gap: 32,
          gridTemplateColumns: window.innerWidth >= 900 ? '1fr 1fr' : '1fr',
        }}
      >
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3
            style={{
              fontWeight: 800,
              textAlign: 'center',
              marginBottom: 16,
              fontSize: 20,
            }}
          >
            Bounce Rate
          </h3>

          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 24 }}>
            Distribuição de sessões que encerram após uma única interação em comparação
            às sessões com maior engajamento. Valores calculados diretamente das user
            sessions monitoradas no período selecionado.
          </p>

          <BounceRatePie data={bounceData} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3
            style={{
              fontWeight: 800,
              textAlign: 'center',
              marginBottom: 16,
              fontSize: 20,
            }}
          >
            Rage Clicks
          </h3>

          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 24 }}>
            Distribuição de sessões de acordo com a quantidade de cliques repetidos em
            um mesmo elemento em curto intervalo - um forte indicador de frustração do
            usuário.
          </p>

          <RageClicksPie data={rageData} />
        </div>
      </div>
    </section>

    <section className="section" id="behavior">
      <h2 className="sectionTitle">Comportamento do Usuário - Bounce & Rage Clicks</h2>

      <div
        style={{
          display: 'grid',
          gap: 32,
          gridTemplateColumns: window.innerWidth >= 900 ? '1fr 1fr' : '1fr',
        }}
      >

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3
            style={{
              fontWeight: 800,
              textAlign: 'center',
              marginBottom: 16,
              fontSize: 20,
            }}
          >
            Rage Clicks
          </h3>

          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 24 }}>
            Distribuição de sessões de acordo com a quantidade de cliques repetidos em
            um mesmo elemento em curto intervalo - um forte indicador de frustração do
            usuário.
          </p>

          <RageClicksPerPagePie data={ragePerPageData} />
        </div>
      </div>
    </section>
  </>
);

export default UserBehaviorSection;