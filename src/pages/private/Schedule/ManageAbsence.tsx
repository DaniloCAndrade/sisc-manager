// pages/schedule/ManageAbsence.tsx
import { Button, ConfigProvider, Modal, Spin, Table, Tabs, Tooltip, Tag, Space, message } from 'antd';
import { theme } from './helpers';
import { ScheduleHeader } from './ScheduleHeader';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { absenceService, type Absence } from '@/services/absenceService';
import { collaboratorService, type Collaborator } from '@/services/collaboratorService';
import { EditAbsenceDialog } from './EditAbsenceDialog';
import dayjs from 'dayjs';

export default function ManageAbsence() {
    const [loading, setLoading] = useState(true);
    const [tableData, setTableData] = useState<any[]>([]);
    const [absenceList, setAbsenceList] = useState<Absence[]>([]);
    const [collaboratorsMap, setCollaboratorsMap] = useState<Map<string, Collaborator>>(new Map());
    const [selected, setSelected] = useState<Absence | null>(null);
    const [editVisible, setEditVisible] = useState(false);
    const [deleteVisible, setDeleteVisible] = useState(false);

    const tipoConfig: Record<string, { color: string; label: string }> = {
        ATESTADO: { color: 'blue', label: 'Atestado' },
        FERIAS: { color: 'green', label: 'Férias' },
        LICENCA: { color: 'orange', label: 'Licença' },
        OUTRO: { color: 'default', label: 'Outro' },
    };

    const statusConfig: Record<string, { color: string; label: string }> = {
        CRIADO: { color: 'default', label: 'Criado' },
        ACEITO: { color: 'success', label: 'Aceito' },
        ERRO: { color: 'error', label: 'Erro' },
    };

    const columns = [
        {
            title: 'Colaborador', key: 'colaborador', width: 200,
            render: (_: any, r: any) => (
                <div>
                    <div className="font-medium">{r.colaboradorNome}</div>
                    <div className="text-xs text-gray-500">{r.subgrupo ?? ''}</div>
                </div>
            ),
        },
        {
            title: 'Período', key: 'periodo', width: 220,
            render: (_: any, r: any) => (
                <div>
                    <div>Início: <strong>{dayjs(r.periodoInicio).format('DD/MM/YYYY')}</strong></div>
                    <div>Fim: <strong>{r.indeterminate ? 'Indeterminado' : (r.periodoFim ? dayjs(r.periodoFim).format('DD/MM/YYYY') : '—')}</strong></div>
                    <div className="text-xs text-gray-500">{r.dias} dia(s)</div>
                </div>
            ),
        },
        {
            title: 'Tipo', dataIndex: 'tipo', key: 'tipo', width: 110,
            render: (tipo: string) => <Tag color={tipoConfig[tipo]?.color}>{tipoConfig[tipo]?.label ?? tipo}</Tag>,
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status', width: 90,
            render: (s: string) => <Tag color={statusConfig[s]?.color}>{statusConfig[s]?.label ?? s}</Tag>,
        },
        {
            title: 'Observação', dataIndex: 'observacao', key: 'obs', width: 200, ellipsis: true,
            render: (t: string) => t || '—',
        },
        {
            title: 'Ações', key: 'actions', width: 80,
            render: (_: any, r: any) => (
                <Space>
                    <Tooltip title="Editar">
                        <Button type="text" size="small" icon={<EditOutlined />}
                            onClick={() => { setSelected(absenceList.find(a => a._id === r._id) ?? null); setEditVisible(true); }} />
                    </Tooltip>
                    <Tooltip title="Deletar">
                        <Button type="text" size="small" danger icon={<DeleteOutlined />}
                            onClick={() => { setSelected(absenceList.find(a => a._id === r._id) ?? null); setDeleteVisible(true); }} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const loadCollaborators = async () => {
        const list = await collaboratorService.getAll();
        const map = new Map<string, Collaborator>();
        list.forEach(c => map.set(c._id ?? '', c));
        setCollaboratorsMap(map);
        return map;
    };

    const loadAbsences = async (map?: Map<string, Collaborator>) => {
        const cMap = map ?? collaboratorsMap;
        setLoading(true);
        try {
            const list = await absenceService.getAll();
            setAbsenceList(list);
            const rows = list.map(a => {
                const collab = cMap.get(a.collaboratorId);
                const inicio = new Date(a.periodo.inicio);
                const fim = a.periodo.fim ? new Date(a.periodo.fim) : null;
                const dias = fim ? Math.ceil((fim.getTime() - inicio.getTime()) / 86400000) + 1 : null;
                return {
                    ...a,
                    key: a._id,
                    colaboradorNome: collab?.nome ?? a.nome ?? 'Desconhecido',
                    subgrupo: (collab as any)?.subgrupo,
                    periodoInicio: a.periodo.inicio,
                    periodoFim: a.periodo.fim ?? null,
                    dias: dias ?? '∞',
                };
            });
            setTableData(rows);
        } catch (err) {
            console.error(err);
            message.error('Erro ao carregar ausências');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCollaborators().then(map => loadAbsences(map));
    }, []);

    const handleSave = async (data: Partial<Absence>) => {
        try {
            await absenceService.salve(data);
            message.success(data._id ? 'Ausência atualizada!' : 'Ausência criada!');
            loadAbsences();
        } catch (err) {
            console.error(err);
            message.error('Erro ao salvar ausência');
        }
    };

    const handleDelete = async () => {
        setDeleteVisible(false);
        if (!selected?._id) return;
        try {
            await absenceService.delete(selected._id);
            message.success('Ausência deletada!');
            loadAbsences();
        } catch (err) {
            console.error(err);
            message.error('Erro ao deletar ausência');
        }
    };

    return (
        <ConfigProvider locale={undefined} theme={theme}>
            <div className="min-h-screen bg-background">
                <ScheduleHeader />
                <main className="pt-28 pb-16 max-w-7xl mx-auto px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold">Gerenciar Ausências</h1>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelected(null); setEditVisible(true); }}>
                                Nova Ausência
                            </Button>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
                        <Spin spinning={loading}>
                            <Tabs defaultActiveKey="absences" size="large" items={[{
                                key: 'absences',
                                label: '📋 Ausências',
                                children: (
                                    <Table
                                        dataSource={tableData}
                                        columns={columns}
                                        pagination={{ pageSize: 10, showSizeChanger: true }}
                                        size="middle"
                                        scroll={{ x: 1000 }}
                                        className="rounded-2xl border overflow-hidden"
                                    />
                                ),
                            }]} />
                        </Spin>
                    </motion.div>
                </main>

                <EditAbsenceDialog
                    visible={editVisible}
                    onClose={() => { setEditVisible(false); setSelected(null); }}
                    onSave={handleSave}
                    absence={selected}
                    mode={selected ? 'edit' : 'create'}
                />

                <Modal
                    title="Confirmar exclusão"
                    open={deleteVisible}
                    onCancel={() => setDeleteVisible(false)}
                    onOk={handleDelete}
                    okText="Deletar"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                >
                    <p>Tem certeza que deseja deletar esta ausência?</p>
                    {selected && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                            <p><strong>Colaborador:</strong> {collaboratorsMap.get(selected.collaboratorId)?.nome ?? selected.nome}</p>
                            <p><strong>Período:</strong> {dayjs(selected.periodo.inicio).format('DD/MM/YYYY')}
                                {selected.periodo.fim ? ` — ${dayjs(selected.periodo.fim).format('DD/MM/YYYY')}` : ' (indeterminado)'}</p>
                            <p><strong>Tipo:</strong> {tipoConfig[selected.tipo]?.label ?? selected.tipo}</p>
                        </div>
                    )}
                </Modal>
            </div>
        </ConfigProvider>
    );
}