// OsUsagePie.tsx
import React, { useEffect, useRef } from 'react';
import { Pie as G2Pie, type PieOptions } from '@antv/g2plot';

export type OsRow = {
  family: string;
  count: number;
};

type Props = {
  data: OsRow[];
};

type Slice = {
  name: string;
  value: number;
  pct: number;
};

const COLORS = ['#0EA5E9', '#22C55E', '#F97316', '#A855F7', '#EAB308', '#9CA3AF'];

// mesma lógica: TOP 5 + "Outros" sem duplicar
function buildSlices(rows: OsRow[]): Slice[] {
  if (!rows || rows.length === 0) return [];

  // 1) Normalizar "outros/outro/other/unknown"
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

  // 2) Consolidar por nome
  const mergedMap: Record<string, number> = {};
  for (const r of normalized) {
    if (!r.family) continue;
    mergedMap[r.family] = (mergedMap[r.family] || 0) + r.count;
  }

  const all = Object.entries(mergedMap).map(([family, count]) => ({
    family,
    count,
  }));

  const total = all.reduce((acc, r) => acc + r.count, 0);

  const explicitOutrosCount = mergedMap['Outros'] ?? 0;

  const withoutOutros = all.filter((r) => r.family !== 'Outros');
  withoutOutros.sort((a, b) => b.count - a.count);

  const TOP_N = 5;
  const top = withoutOutros.slice(0, TOP_N);
  const tail = withoutOutros.slice(TOP_N);
  const tailValue = tail.reduce((acc, r) => acc + r.count, 0);

  const othersValue = explicitOutrosCount + tailValue;

  const base: { name: string; value: number }[] = top.map((r) => ({
    name: r.family,
    value: r.count,
  }));

  if (othersValue > 0) {
    base.push({ name: 'Outros', value: othersValue });
  }

  return base.map((item) => ({
    name: item.name,
    value: item.value,
    pct: total > 0 ? (item.value / total) * 100 : 0,
  }));
}

export const OsUsagePie: React.FC<Props> = ({ data }) => {
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
        legend: false,
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
        Sem dados de sistema operacional no período.
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

      {/* legenda custom do lado, igual browser */}
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

export default OsUsagePie;
