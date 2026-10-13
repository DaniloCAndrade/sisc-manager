import ApdexCategoryPie from '../components/ApdexCategoryPie';
import GeoActionBar from '../components/GeoActionBar';
import type { GeoRow } from '../../types/dashboardReport';

type Props = {
  apdexValue: number | null;
  apdexCategory: Record<string, number>;
  geoData: GeoRow[];
};

const getApdexNarrative = (
  apdex: number | null,
  satisfiedPct: number,
  toleratingPct: number,
  frustratedPct: number,
) => {
  if (apdex == null) {
    return 'A pontuação Apdex ainda não está disponível para o período analisado.';
  }

  if (apdex >= 0.9) {
    return (
      <>
        A pontuação Apdex de <b>{apdex.toFixed(2)}</b> reflete uma experiência
        <b> excelente</b> para o usuário. No período analisado,&nbsp;
        {formatPct(satisfiedPct)}% das ações foram classificadas com alto nível de
        satisfação,&nbsp;
        {formatPct(toleratingPct)}% como aceitáveis e apenas&nbsp;
        {formatPct(frustratedPct)}% como experiências frustrantes - indicando uma
        aplicação estável, rápida e bem percebida pelos usuários.
      </>
    );
  }

  if (apdex >= 0.8) {
    return (
      <>
        A pontuação Apdex de <b>{apdex.toFixed(2)}</b> indica uma experiência
        <b> positiva</b> para o usuário. No período analisado,&nbsp;
        {formatPct(satisfiedPct)}% das ações apresentaram alto nível de satisfação,&nbsp;
        {formatPct(toleratingPct)}% foram consideradas aceitáveis e&nbsp;
        {formatPct(frustratedPct)}% resultaram em experiências ruins - demonstrando
        boa performance geral da aplicação.
      </>
    );
  }

  if (apdex >= 0.7) {
    return (
      <>
        A pontuação Apdex de <b>{apdex.toFixed(2)}</b> aponta para uma experiência
        <b> razoável</b> do usuário. Embora&nbsp;
        {formatPct(satisfiedPct)}% das ações tenham sido satisfatórias,&nbsp;
        {formatPct(toleratingPct)}% ficaram no limite do aceitável e&nbsp;
        {formatPct(frustratedPct)}% geraram frustração - sugerindo pontos claros de
        melhoria na performance percebida.
      </>
    );
  }

  if (apdex >= 0.6) {
    return (
      <>
        A pontuação Apdex de <b>{apdex.toFixed(2)}</b> indica uma experiência
        <b> insatisfatória</b> para o usuário. Uma parcela relevante das ações
        ({formatPct(frustratedPct)}%) resultou em frustração, o que pode impactar
        diretamente a confiança e o engajamento dos usuários com a aplicação.
      </>
    );
  }

  return (
    <>
      A pontuação Apdex de <b>{apdex.toFixed(2)}</b> revela uma experiência
      <b> crítica</b> para o usuário. O elevado percentual de ações frustrantes
      ({formatPct(frustratedPct)}%) indica degradação severa da performance, exigindo
      atenção imediata para evitar impacto significativo no uso da aplicação.
    </>
  );
};


const formatPct = (v: number | null) =>
  v == null
    ? '-'
    : new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v);

const formatPctGeo = (v: number | null) =>
  v == null
    ? '-'
    : new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(v);

export const UserExperienceSection: React.FC<Props> = ({
  apdexValue,
  apdexCategory,
  geoData,
}) => {
  // Apdex %
  const totalActions = Object.values(apdexCategory).reduce((acc, v) => acc + v, 0);

  const satisfiedPct =
    totalActions > 0 ? ((apdexCategory['SATISFIED'] ?? 0) / totalActions) * 100 : 0;
  const toleratingPct =
    totalActions > 0 ? ((apdexCategory['TOLERATING'] ?? 0) / totalActions) * 100 : 0;
  const frustratedPct =
    totalActions > 0 ? ((apdexCategory['FRUSTRATED'] ?? 0) / totalActions) * 100 : 0;

  // Geo text (ignorando "Outros")
  const totalGeoAll = geoData.reduce((acc, r) => acc + r.value, 0);
  const geoDataClean = geoData.filter((r) => r.name !== 'Outros');
  const sortedGeo = [...geoDataClean].sort((a, b) => b.value - a.value);
  const top3 = sortedGeo.slice(0, 3);

  const geoText =
    totalGeoAll > 0 && top3.length === 3
      ? `O Dynatrace classifica a origem do usuário com base no seu IP. A região mais observada nesse período foi ${top3[0].name} (${formatPctGeo(
        (top3[0].value / totalGeoAll) * 100,
      )}%), seguida por ${top3[1].name} (${formatPctGeo(
        (top3[1].value / totalGeoAll) * 100,
      )}%) e ${top3[2].name} (${formatPctGeo(
        (top3[2].value / totalGeoAll) * 100,
      )}%). Essa distribuição não representa a distribuição de inscrições para o programa.`
      : 'A distribuição geográfica será exibida após o carregamento dos dados.';

  return (
    <section className="section" id="user-experience">
      <h2 className="sectionTitle">Experiência do Usuário &amp; Engajamento</h2>

      <div
        style={{
          display: 'grid',
          gap: 32,
          gridTemplateColumns: window.innerWidth >= 900 ? '1fr 1fr' : '1fr',
        }}
      >
        {/* Apdex */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3
            style={{
              fontWeight: 800,
              textAlign: 'center',
              marginBottom: 16,
              fontSize: 20,
            }}
          >
            Experiência do Usuário (Apdex)
          </h3>

          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 24 }}>
            {getApdexNarrative(
              apdexValue,
              satisfiedPct,
              toleratingPct,
              frustratedPct,
            )}
          </p>

          <div style={{ maxWidth: 380, margin: '0 auto' }}>
            <ApdexCategoryPie dataByCat={apdexCategory} />
          </div>
        </div>

        {/* Geo */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3
            style={{
              fontWeight: 800,
              textAlign: 'center',
              marginBottom: 16,
              fontSize: 20,
            }}
          >
            Distribuição Geográfica do Usuário
          </h3>

          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 24 }}>
            {geoText}
          </p>

          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <GeoActionBar data={geoData} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserExperienceSection;