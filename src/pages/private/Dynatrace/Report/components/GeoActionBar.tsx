import React, { useEffect, useRef } from 'react';
import { Bar as G2Bar, type BarOptions } from '@antv/g2plot';

export type GeoRow = {
  name: string;
  value: number;
};

type Props = {
  data: GeoRow[];
};

const GeoActionBar: React.FC<Props> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const plotRef = useRef<G2Bar | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (plotRef.current) {
      plotRef.current.destroy();
      plotRef.current = null;
    }

    const total = data.reduce((acc, d) => acc + d.value, 0);

    const options: BarOptions = {
      data,
      xField: 'value',
      yField: 'name',
      seriesField: 'name',
      legend: false,
      height: 260,
      color: '#0062E4',
      xAxis: {
        title: { text: 'Ações de usuário (%)' },
        label: {
          formatter: (val) => {
            const num = Number(val);
            if (!total || !num) return val;
            const pct = (num / total) * 100;
            return `${pct.toFixed(1)}%`;
          },
        },
      },
      label: {
        position: 'right',
        formatter: (item: any) => {
          if (!total) return '';
          const pct = (item.value / total) * 100;
          return `${pct.toFixed(1)}%`;
        },
        style: {
          fontSize: 12,
          fill: '#111827',
        },
      },
      tooltip: {
        formatter: (item: any) => {
          if (!total) {
            return {
              name: item.name,
              value: item.value.toLocaleString('pt-BR'),
            };
          }
          const pct = (item.value / total) * 100;
          return {
            name: item.name,
            value: `${item.value.toLocaleString('pt-BR')} ações (${pct.toFixed(
              1
            )}%)`,
          };
        },
      },
      interactions: [{ type: 'element-active' }],
    };

    const plot = new G2Bar(containerRef.current, options);
    plot.render();
    plotRef.current = plot;

    return () => {
      plotRef.current?.destroy();
      plotRef.current = null;
    };
  }, [data]);

  return <div ref={containerRef} style={{ height: 260 }} />;
};

export default GeoActionBar;
