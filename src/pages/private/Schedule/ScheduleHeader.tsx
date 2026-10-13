// components/schedule/ScheduleHeader.tsx
import { Button, Divider, Select, Space, Dropdown } from 'antd';
import {
    ArrowLeftOutlined, CalendarOutlined, UserDeleteOutlined,
    AppstoreOutlined, ExportOutlined, DownOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MONTH_NAMES } from './helpers';
import type { DailyScheduleResponse } from '@/types/schedule';

interface ScheduleHeaderProps {
    dataSelecionada?: Date;
    onChangeSelectData?: (value: number, type: 'month' | 'year') => void;
    onClickRefazerEscala?: () => void;
    scheduleResponse?: DailyScheduleResponse;
    onExportEscala?: () => void;
    onExportRH?: () => void;
    exportingEscala?: boolean;
    exportingRH?: boolean;
}

export function ScheduleHeader({
    dataSelecionada,
    onChangeSelectData,
    onClickRefazerEscala,
    scheduleResponse,
    onExportEscala,
    onExportRH,
    exportingEscala,
    exportingRH,
}: ScheduleHeaderProps) {
    const navigate = useNavigate();

    const anos = Array.from({ length: 5 }, (_, i) => {
        const base = dataSelecionada ? dataSelecionada.getFullYear() : new Date().getFullYear();
        const ano = base - 1 + i;
        return { label: String(ano), value: ano };
    });

    const exportItems = [
        {
            key: 'escala',
            label: 'Escala Mensal (.xlsx)',
            icon: <CalendarOutlined />,
            onClick: onExportEscala,
        },
        {
            key: 'rh',
            label: 'Horas Extras RH (.xlsx)',
            icon: <ExportOutlined />,
            onClick: onExportRH,
        },
    ];

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50"
        >
            <div className="max-w-9xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">

                    {/* Esquerda */}
                    <div className="flex items-center gap-4">
                        <Button
                            type="text"
                            icon={<ArrowLeftOutlined />}
                            onClick={() => window.history.back()}
                            className="text-muted-foreground"
                        >
                            Voltar
                        </Button>
                        <Divider type="vertical" className="h-6" />
                        {dataSelecionada && (
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <CalendarOutlined className="text-primary text-base" />
                                </div>
                                <span className="text-lg font-semibold">Escala</span>
                            </div>
                        )}
                    </div>

                    {/* Direita */}
                    <Space size="small" wrap>
                        {dataSelecionada && onChangeSelectData && (
                            <>
                                <Select
                                    value={dataSelecionada.getMonth() + 1}
                                    onChange={v => onChangeSelectData(v, 'month')}
                                    style={{ width: 130 }}
                                    options={MONTH_NAMES.map((name, i) => ({ label: name, value: i + 1 }))}
                                />
                                <Select
                                    value={dataSelecionada.getFullYear()}
                                    onChange={v => onChangeSelectData(v, 'year')}
                                    style={{ width: 90 }}
                                    options={anos}
                                />
                                <Button
                                    danger
                                    onClick={onClickRefazerEscala}
                                >
                                    {scheduleResponse?.data?.length ? 'Refazer Escala' : 'Gerar Escala'}
                                </Button>
                            </>
                        )}

                        <Button icon={<UserDeleteOutlined />} onClick={() => navigate('/schedule/collaboratos')}>
                            Colaboradores
                        </Button>

                        <Button onClick={() => navigate('/schedule/absence')}>
                            Ausências
                        </Button>

                        <Button icon={<AppstoreOutlined />} onClick={() => navigate('/schedule/programs')}>
                            Programas
                        </Button>

                        {dataSelecionada && (onExportEscala || onExportRH) && (
                            <Dropdown
                                menu={{ items: exportItems }}
                                placement="bottomRight"
                            >
                                <Button
                                    type="primary"
                                    icon={<ExportOutlined />}
                                    loading={exportingEscala || exportingRH}
                                >
                                    Exportar <DownOutlined />
                                </Button>
                            </Dropdown>
                        )}
                    </Space>
                </div>
            </div>
        </motion.header>
    );
}