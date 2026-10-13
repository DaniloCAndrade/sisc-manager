// src/components/RageClicksPie.tsx
import React, { useEffect, useRef } from 'react';
import { Pie as G2Pie, type PieOptions } from '@antv/g2plot';

type RageRow = {
  label: string;  // "0 cliques de raiva", "1 clique de raiva", ..., "Outros"
  count: number;
};

type Props = {
  data: RageRow[];
};

type Slice = {
  name: string;
  value: number;
  pct: number;
};

const COLORS = ['#1671f9ff', '#FB7185', '#6366F1', '#c54822ff', '#06B6D4', '#9CA3AF'];

const RageClicksPie: React.FC<Props> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const plotRef = useRef<G2Pie | null>(null);

  const slices: Slice[] = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    const total = data.reduce((acc, r) => acc + r.count, 0);

    return data.map((r) => ({
      name: r.label,
      value: r.count,
      pct: total > 0 ? (r.count / total) * 100 : 0,
    }));
  }, [data]);

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
        formatter: (item: any) => {
          // tenta pegar pct tanto direto quanto dentro de data
          const rawPct =
            typeof item.pct === 'number'
              ? item.pct
              : typeof item.data?.pct === 'number'
                ? item.data.pct
                : 0;

          const rawValue =
            typeof item.value === 'number'
              ? item.value
              : typeof item.data?.value === 'number'
                ? item.data.value
                : 0;

          const name = item.name ?? item.data?.name ?? '';

          return {
            name,
            value: `${rawPct.toFixed(2)}% (${rawValue.toLocaleString('pt-BR')} sessões)`,
          };
        },
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
    return <div style={{ textAlign: 'center', color: '#9CA3AF' }}>Sem dados de rage clicks para o período.</div>;
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
      <div ref={containerRef} style={{ width: 220, height: 220 }} />

      <div style={{ minWidth: 220 }}>
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
              {slice.pct.toFixed(2)}% {slice.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RageClicksPie;
