// ApdexCategoryPie.tsx
import { Pie as G2Pie, type PieOptions } from '@antv/g2plot';
import React, { useEffect, useRef } from 'react';

type Props = {
  dataByCat: Record<string, number>;
};

const ORDER = ['SATISFIED', 'TOLERATING', 'FRUSTRATED'] as const;

const COLORS: Record<string, string> = {
  SATISFIED: '#3bcc53',
  TOLERATING: '#FFC300',
  FRUSTRATED: '#ff3c00',
};

export const ApdexCategoryPie: React.FC<Props> = ({ dataByCat }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const plotRef = useRef<G2Pie | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const entries = ORDER
      .map((cat) => ({
        category: cat,
        value: Number(dataByCat?.[cat] ?? 0),
      }))
      .filter((d) => d.value > 0);

    // 🚨 BLOQUEIO CRÍTICO: sem dados = sem gráfico
    if (entries.length === 0) {
      plotRef.current?.destroy();
      plotRef.current = null;
      return;
    }

    const total = entries.reduce((acc, d) => acc + d.value, 0);

    if (plotRef.current) {
      plotRef.current.destroy();
      plotRef.current = null;
    }

    const options: PieOptions = {
      data: entries,
      angleField: 'value',
      colorField: 'category',
      color: (d: any) => COLORS[d.category] || '#9ca3af',
      radius: 1,
      innerRadius: 0.7,
      legend: { position: 'bottom' },
      label: false,
      tooltip: {
        formatter: (item: any) => {
          const pct = total ? (item.value / total) * 100 : 0;
          return {
            name: item.category,
            value: `${item.value.toLocaleString('pt-BR')} ações (${pct.toFixed(
              2,
            )}%)`,
          };
        },
      },
      interactions: [{ type: 'element-active' }],
      statistic: { title: false, content: false },
    };

    const plot = new G2Pie(containerRef.current, options);
    plot.render();
    plotRef.current = plot;

    return () => {
      plotRef.current?.destroy();
      plotRef.current = null;
    };
  }, [dataByCat]);

  // 🔹 Fallback visual (sem gráfico)
  const hasData = Object.values(dataByCat || {}).some((v) => v > 0);

  if (!hasData) {
    return (
      <div
        style={{
          height: 260,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontSize: 14,
          textAlign: 'center',
        }}
      >
        Não há dados de Apdex suficientes<br />
        para o período selecionado
      </div>
    );
  }

  return <div ref={containerRef} style={{ height: 260 }} />;
};

export default ApdexCategoryPie;
