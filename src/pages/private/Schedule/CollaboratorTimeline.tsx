// components/schedule/CollaboratorTimeline.tsx
import type { DailySchedule } from '@/types/schedule';
import { Tooltip } from 'antd';
import { MoonOutlined, SunOutlined, SwapOutlined, StarOutlined } from '@ant-design/icons';

const TIMELINE_START_H = 7;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function toTimelinePercent(timeStr: string): number {
  const totalMin = 24 * 60;
  let minutes = timeToMinutes(timeStr) - TIMELINE_START_H * 60;
  if (minutes < 0) minutes += totalMin;
  return (minutes / totalMin) * 100;
}

function durationPercent(start: string, end: string): number {
  const totalMin = 24 * 60;
  let s = timeToMinutes(start);
  let e = timeToMinutes(end);
  if (e <= s) e += totalMin;
  return ((e - s) / totalMin) * 100;
}

const SLOT_STYLES = {
  day_shift: { bg: '#DBEAFE', border: '#3B82F6', text: '#1D4ED8' },
  night_shift: { bg: '#EDE9FE', border: '#7C3AED', text: '#5B21B6' },
  early_sub: { bg: '#DCFCE7', border: '#16A34A', text: '#15803D' },
  late_sub: { bg: '#FEF9C3', border: '#CA8A04', text: '#A16207' },
  full_12h: { bg: '#FFEDD5', border: '#EA580C', text: '#C2410C' },
  day_to_night_12x36: { bg: '#F3E8FF', border: '#9333EA', text: '#7E22CE' },
  overnight: { bg: '#FFF7ED', border: '#F97316', text: '#C2410C' },
  opening: { bg: '#ECFDF5', border: '#10B981', text: '#065F46' },
  absent: { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B' },
  regular: { bg: '#F8FAFC', border: '#94A3B8', text: '#475569' },
};

type SlotStyle = keyof typeof SLOT_STYLES;

interface TimeBlock {
  key: string;
  label: string;
  start: string;
  end: string;
  style: SlotStyle;
  icon?: React.ReactNode;
  tooltip: React.ReactNode;
  absent?: boolean;
  dimmed?: boolean;
}

function Block({ block }: { block: TimeBlock }) {
  const left = toTimelinePercent(block.start);
  const width = durationPercent(block.start, block.end);
  const s = SLOT_STYLES[block.absent ? 'absent' : block.style];

  return (
    <Tooltip title={block.tooltip} placement="top">
      <div style={{
        position: 'absolute', left: `${left}%`, width: `${Math.max(width, 1.5)}%`,
        height: '28px', backgroundColor: s.bg, border: `2px solid ${s.border}`,
        borderRadius: 4, padding: '1px 4px', fontSize: 11, overflow: 'hidden',
        whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: s.text, fontWeight: 500,
        display: 'flex', alignItems: 'center', gap: 4, cursor: 'default',
        opacity: block.dimmed ? 0.45 : 1, boxShadow: '0 1px 2px rgba(0,0,0,.08)',
      }}>
        {block.icon}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.label}</span>
      </div>
    </Tooltip>
  );
}

const HOUR_MARKS = [8, 10, 12, 14, 16, 18, 20, 22, 0, 2, 4, 6];

function TimeAxis() {
  return (
    <div style={{ display: 'flex', marginBottom: 4, borderBottom: '1px solid #f0f0f0', paddingBottom: 2 }}>
      {HOUR_MARKS.map(h => (
        <div key={h} style={{ width: `${(2 / 24) * 100}%`, fontSize: 10, color: '#aaa', textAlign: 'center' }}>
          {String(h).padStart(2, '0')}h
        </div>
      ))}
    </div>
  );
}

interface CollaboratorTimelineProps {
  day: DailySchedule;
}

export function CollaboratorTimeline({ day }: CollaboratorTimelineProps) {
  const rows: TimeBlock[][] = [];

  // Guards defensivos — banco pode retornar null em vez de []
  const substitutions = day.substitutions ?? [];
  const regular5x2 = day.regular_5x2 ?? [];

  function addBlock(block: TimeBlock) {
    const blockStart = toTimelinePercent(block.start);
    const blockEnd = blockStart + durationPercent(block.start, block.end);
    for (const row of rows) {
      const fits = row.every(b => {
        const bs = toTimelinePercent(b.start);
        const be = bs + durationPercent(b.start, b.end);
        return blockEnd <= bs || blockStart >= be;
      });
      if (fits) { row.push(block); return; }
    }
    rows.push([block]);
  }

  // 1. Turno dia
  if (day.day_shift) {
    const s = day.day_shift;
    addBlock({
      key: 'day', label: s.nome, start: s.start, end: s.end,
      style: 'day_shift', icon: <SunOutlined />, absent: s.absent,
      tooltip: <div><strong>{s.nome}</strong><br />Turno Dia · {s.start}–{s.end}{s.absent && <div style={{ color: '#fca5a5' }}>⚠ Ausente</div>}</div>,
    });
  }

  // 2. Turno noite
  if (day.night_shift) {
    const s = day.night_shift;
    addBlock({
      key: 'night', label: s.nome, start: s.start, end: s.end,
      style: 'night_shift', icon: <MoonOutlined />, absent: s.absent,
      tooltip: <div><strong>{s.nome}</strong><br />Turno Noite · {s.start}–{s.end}{s.absent && <div style={{ color: '#fca5a5' }}>⚠ Ausente</div>}</div>,
    });
  }

  // 3. Substituições — usa array com guard
  const subIds = new Set(substitutions.map(s => s.collaboratorId));
  for (const sub of substitutions) {
    const styleKey: SlotStyle =
      sub.type === 'early_sub' ? 'early_sub'
        : sub.type === 'late_sub' ? 'late_sub'
          : sub.type === 'day_to_night_12x36' ? 'day_to_night_12x36'
            : 'full_12h';

    const typeLabel =
      sub.type === 'early_sub' ? 'Cedo (07h–16h)'
        : sub.type === 'late_sub' ? 'Tarde (10h–19h)'
          : sub.type === 'day_to_night_12x36' ? '12x36 → Noite'
            : sub.start === '07:00' ? 'Full FDS (07h–19h)'
              : 'Full Noturno (19h–07h)';

    addBlock({
      key: `sub-${sub.collaboratorId}`, label: sub.nome,
      start: sub.start, end: sub.end, style: styleKey, icon: <SwapOutlined />,
      tooltip: <div><strong>{sub.nome}</strong><br />{typeLabel} · {sub.start}–{sub.end}<br />{sub.hours}h · {sub.auto ? 'Automático' : 'Manual'}</div>,
    });
  }

  // 4. Regular 5x2 — usa array com guard
  if (!day.isWeekend) {
    for (const r of regular5x2) {
      addBlock({
        key: `reg-${r.collaboratorId}`, label: r.nome,
        start: r.start, end: r.end, style: 'regular',
        dimmed: subIds.has(r.collaboratorId),
        tooltip: <div><strong>{r.nome}</strong><br />Horário Regular · {r.start}–{r.end}{subIds.has(r.collaboratorId) && <div style={{ color: '#94a3b8' }}>Em substituição hoje</div>}</div>,
      });
    }
  }

  // 5. Overnight
  if (day.overnight_5x2) {
    const ov = day.overnight_5x2;
    addBlock({
      key: 'overnight', label: ov.nome, start: ov.start, end: ov.end,
      style: 'overnight', icon: <StarOutlined />,
      tooltip: <div><strong>{ov.nome}</strong><br />Plantão · {ov.start}–{ov.end} · {ov.hours}h{ov.programName && <div>Programa: {ov.programName}</div>}</div>,
    });
  }

  if (day.opening_overnight_5x2) {
    const op = day.opening_overnight_5x2;
    addBlock({
      key: 'opening', label: op.nome, start: op.start, end: op.end, style: 'opening',
      tooltip: <div><strong>{op.nome}</strong><br />Abertura · {op.start}–{op.end} · {op.hours}h{op.programName && <div>Programa: {op.programName}</div>}</div>,
    });
  }

  return (
    <div style={{ width: '100%', minWidth: 400 }}>
      <TimeAxis />
      {rows.map((row, ri) => (
        <div key={ri} style={{ position: 'relative', height: 32, marginBottom: 4 }}>
          {row.map(block => <Block key={block.key} block={block} />)}
        </div>
      ))}
      {rows.length === 0 && (
        <div style={{ color: '#999', fontStyle: 'italic', fontSize: 12, padding: '4px 0' }}>
          Sem colaboradores escalados
        </div>
      )}
    </div>
  );
}