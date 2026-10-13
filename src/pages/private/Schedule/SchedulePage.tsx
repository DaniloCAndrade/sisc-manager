// pages/schedule/SchedulePageNew.tsx
// Página principal da escala — usa novo backend MongoDB
import { ConfigProvider, Spin, Table, Tabs, Tag, Tooltip, Button } from 'antd';
import { CalendarOutlined, EditOutlined, ExportOutlined, BarChartOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { theme, MONTH_NAMES } from './helpers';
import { ScheduleHeader } from './ScheduleHeader';
import { CollaboratorTimeline } from './CollaboratorTimeline';
import { EditDailyScheduleDialog } from './EditDailyScheduleDialog';
import { useScheduleData } from '@/hooks/useScheduleData';
import { dailyScheduleService, collaboratorService } from '@/services/scheduleServices';
import type { DailySchedule, Collaborator } from '@/types/schedule';
import { useEffect } from 'react';
import { message } from 'antd';

// ── Tabela de horas extras resumida ──────────────────────────────
function HorasExtrasTable({ days }: { days: DailySchedule[] }) {
  type Entry = { nome: string; fdsHoras: number; overnightHoras: number; total: number };
  const map: Record<string, Entry> = {};

  for (const day of days) {
    // full_12h no FDS
    if (day.isWeekend) {
      for (const s of (day.substitutions ?? [])) {
        if (s.type === 'full_12h' && s.start === '07:00') {
          if (!map[s.nome]) map[s.nome] = { nome: s.nome, fdsHoras: 0, overnightHoras: 0, total: 0 };
          map[s.nome].fdsHoras += s.hours ?? 12;
        }
      }
    }
    // overnight
    if (day.overnight_5x2) {
      const ov = day.overnight_5x2;
      if (!map[ov.nome]) map[ov.nome] = { nome: ov.nome, fdsHoras: 0, overnightHoras: 0, total: 0 };
      map[ov.nome].overnightHoras += ov.hours ?? 12;
    }
  }

  const data = Object.values(map).map(e => ({ ...e, total: e.fdsHoras + e.overnightHoras }))
    .sort((a, b) => b.total - a.total);

  return (
    <Table
      dataSource={data}
      rowKey="nome"
      pagination={false}
      size="small"
      columns={[
        { title: 'Colaborador', dataIndex: 'nome', width: 200 },
        {
          title: 'FDS (12h)',
          dataIndex: 'fdsHoras',
          width: 100,
          render: (h: number) => h > 0 ? <Tag color="orange">{h}h</Tag> : <span style={{ color: '#cbd5e1' }}>—</span>,
        },
        {
          title: 'Overnight',
          dataIndex: 'overnightHoras',
          width: 100,
          render: (h: number) => h > 0 ? <Tag color="purple">{h}h</Tag> : <span style={{ color: '#cbd5e1' }}>—</span>,
        },
        {
          title: 'Total',
          dataIndex: 'total',
          width: 80,
          render: (h: number) => <Tag color="blue">{h}h</Tag>,
        },
      ]}
      locale={{ emptyText: 'Sem horas extras no período' }}
    />
  );
}

// ── Página principal ──────────────────────────────────────────────
export default function SchedulePageNew() {
  const {
    scheduleResponse,
    loading,
    dataSelecionada,
    setDataSelecionada,
    refazerEscala,
    saveSchedule,
  } = useScheduleData();

  const [activeTab, setActiveTab] = useState('escala');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DailySchedule | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [exportingEscala, setExportingEscala] = useState(false);
  const [exportingRH, setExportingRH] = useState(false);
  dayjs.extend(utc);

  useEffect(() => {
    collaboratorService.getAll().then(setCollaborators).catch(console.error);
  }, []);

  const days = scheduleResponse?.data ?? [];

  const tableData = days.map(d => ({
    ...d,
    key: d._id,
    dataFormatada: dayjs(d.data).utc().format('ddd DD/MM'),
    substitutions: d.substitutions ?? [],
    regular_5x2: d.regular_5x2 ?? [],
  }));

  const onChangeSelectData = (value: number, type: 'month' | 'year') => {
    const d = new Date(dataSelecionada);
    if (type === 'month') d.setMonth(value - 1);
    else d.setFullYear(value);
    setDataSelecionada(d);
  };

  const handleExportEscala = async () => {
    setExportingEscala(true);
    try {
      const inicio = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), 1);
      const fim = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth() + 1, 0);
      await dailyScheduleService.exportarEscala(inicio, fim);
    } catch {
      message.error('Erro ao exportar escala.');
    } finally {
      setExportingEscala(false);
    }
  };

  const handleExportRH = async () => {
    setExportingRH(true);
    try {
      const inicio = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), 1);
      const fim = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth() + 1, 0);
      await dailyScheduleService.exportarHorasExtras(inicio, fim);
    } catch {
      message.error('Erro ao exportar horas extras.');
    } finally {
      setExportingRH(false);
    }
  };

  const columns = [
    {
      title: 'Data',
      dataIndex: 'dataFormatada',
      width: 110,
      render: (text: string, row: any) => (
        <span style={{ fontWeight: row.isWeekend ? 700 : 400, color: row.isWeekend ? '#2563EB' : undefined }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Escala',
      render: (_: any, row: DailySchedule) => <CollaboratorTimeline day={row} />,
    },
    {
      title: '',
      width: 40,
      render: (_: any, row: DailySchedule) => (
        <Tooltip title="Editar dia">
          <Button
            type="text" size="small"
            icon={<EditOutlined />}
            onClick={() => { setSelectedDay(row); setDialogVisible(true); }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <ConfigProvider locale={undefined} theme={theme}>
      <div className="min-h-screen bg-background">
        <ScheduleHeader
          dataSelecionada={dataSelecionada}
          onChangeSelectData={onChangeSelectData}
          onClickRefazerEscala={refazerEscala}
          scheduleResponse={scheduleResponse ?? undefined}
          onExportEscala={handleExportEscala}
          onExportRH={handleExportRH}
          exportingEscala={exportingEscala}
          exportingRH={exportingRH}
        />
        <main className="pt-28 pb-16 max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <h1 className="text-2xl font-bold mb-6">
              {MONTH_NAMES[dataSelecionada.getMonth()]} {dataSelecionada.getFullYear()}
            </h1>
          </motion.div>

          <Spin spinning={loading}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'escala',
                  label: <span><CalendarOutlined /> Escala Mensal</span>,
                  children: (
                    <Table
                      dataSource={tableData}
                      columns={columns}
                      pagination={false}
                      rowClassName={(row: any) => row.isWeekend ? 'bg-blue-500/5' : ''}
                      className="rounded-2xl border"
                    />
                  ),
                },
                {
                  key: 'horas',
                  label: <span><BarChartOutlined /> Horas Extras</span>,
                  children: (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                        <Button
                          type="primary"
                          icon={<ExportOutlined />}
                          loading={exportingRH}
                          onClick={handleExportRH}
                        >
                          Exportar Excel RH
                        </Button>
                      </div>
                      <HorasExtrasTable days={days} />
                    </div>
                  ),
                },
              ]}
            />
          </Spin>
        </main>

        <EditDailyScheduleDialog
          visible={dialogVisible}
          onClose={() => { setDialogVisible(false); setSelectedDay(null); }}
          onSave={saveSchedule}
          schedule={selectedDay}
          availableCollaborators={collaborators}
        />
      </div>
    </ConfigProvider>
  );
}