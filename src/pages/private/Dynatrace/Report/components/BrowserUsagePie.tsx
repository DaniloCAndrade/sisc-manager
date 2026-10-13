// BrowserUsagePie.tsx
import React, { useEffect, useRef } from 'react';
import { Pie as G2Pie, type PieOptions } from '@antv/g2plot';

// MESMO SHAPE QUE VOCÊ MONTA NO App.tsx:
export type BrowserRow = {
  family: string; // ex: "Chrome Mobile", "Safari mobile", "Other"
  count: number;  // quantidade de ações
};

type Props = {
  data: BrowserRow[];
};

type Slice = {
  name: string;
  value: number;
  pct: number;
};

const COLORS = ['#7C3AED', '#FDE68A', '#22D3EE', '#FB7185', '#F97316', '#9CA3AF'];

// --- função que monta TOP5 + "Outros" sem duplicar ---
function buildSlices(rows: BrowserRow[]): Slice[] {
  if (!rows || rows.length === 0) return [];

  // 1) Normalizar: qualquer coisa que pareça "outro/outros/other/unknown"
  // vira "Outros"
  const normalized = rows.map((r) => {
    const name = (r.family || '').toLowerCase();

    if (
      name.includes('other') ||
      name.includes('outro') ||
      name.includes('unknown')
    ) {
      return { family: 'Outros', count: r.count };
    }

    return r;
  });

  // 2) Consolidar por nome (Chrome Mobile, Safari, Outros, etc)
  const mergedMap: Record<string, number> = {};
  for (const r of normalized) {
    if (!r.family) continue;
    mergedMap[r.family] = (mergedMap[r.family] || 0) + r.count;
  }

  const all = Object.entries(mergedMap).map(([family, count]) => ({
    family,
    count,
  }));

  // 3) Total geral (100%)
  const total = all.reduce((acc, r) => acc + r.count, 0);

  // 4) Guardar o "Outros" explícito (se existir)
  const explicitOutrosCount = mergedMap['Outros'] ?? 0;

  // 5) Lista SEM o "Outros" explícito, para montar TOP N
  const withoutOutros = all.filter((r) => r.family !== 'Outros');
  withoutOutros.sort((a, b) => b.count - a.count); // decrescente

  const TOP_N = 5;
  const top = withoutOutros.slice(0, TOP_N);
  const tail = withoutOutros.slice(TOP_N);
  const tailValue = tail.reduce((acc, r) => acc + r.count, 0);

  // "Outros" final = Outros explícitos + cauda dos que sobraram
  const othersValue = explicitOutrosCount + tailValue;

  // 6) Base final mostrada no gráfico
  const base: { name: string; value: number }[] = top.map((r) => ({
    name: r.family,
    value: r.count,
  }));

  if (othersValue > 0) {
    base.push({ name: 'Outros', value: othersValue });
  }

  // 7) Sai já com percentuais certinhos
  return base.map((item) => ({
    name: item.name,
    value: item.value,
    pct: total > 0 ? (item.value / total) * 100 : 0,
  }));
}

export const BrowserUsagePie: React.FC<Props> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const plotRef = useRef<G2Pie | null>(null);

  const slices = buildSlices(data);

  useEffect(() => {
    if (!containerRef.current || slices.length === 0) return;

    if (plotRef.current) {
      plotRef.current.destroy();
      plotRef.current = null;
    }

    const options: PieOptions = {
        data: slices,
        angleField: 'value',
        colorField: 'name',
        color: COLORS,
        radius: 1,
        innerRadius: 0.7,
        legend: false, // legenda custom do lado
        label: false,
        tooltip: {
            formatter: (item: any) => ({
              name: item.name,
              value: `${item.pct.toFixed(2)}% (${item.value.toLocaleString(
                  'pt-BR',
              )} ações)`,
            }),
        },
        interactions: [{ type: 'element-active' }],
        statistic: {
            title: false,
            content: false,
        },
    };

    const plot = new G2Pie(containerRef.current, options);
    plot.render();
    plotRef.current = plot;

    return () => {
      plotRef.current?.destroy();
      plotRef.current = null;
    };
  }, [slices]);

  if (slices.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
        Sem dados de navegador no período.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 24,
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}
    >
      <div ref={containerRef} style={{ width: 260, height: 260 }} />

      <div style={{ minWidth: 200 }}>
        {slices.map((slice, idx) => (
          <div
            key={slice.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 6,
              fontSize: 14,
              color: '#374151',
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: '999px',
                marginRight: 8,
                backgroundColor: COLORS[idx % COLORS.length],
                display: 'inline-block',
              }}
            />
            <span>
              {slice.pct.toFixed(1)}% {slice.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrowserUsagePie;
