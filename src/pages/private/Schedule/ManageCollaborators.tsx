// ManageCollaborators.tsx
import { Button, ConfigProvider, Modal, Spin, Table, Tabs, Tooltip, message, Tag } from 'antd';
import { theme } from './helpers';
import { ScheduleHeader } from './ScheduleHeader';
import { useEffect, useState } from 'react';
import { collaboratorService, type Collaborator } from '@/services/collaboratorService';
import { motion } from 'framer-motion';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { EditCollaboratorDialog } from './EditCollaboratorDialog';

const SUBGRUPO_LABELS: Record<string, { label: string; color: string }> = {
    DIURNO: { label: 'Diurno 12x36', color: 'blue' },
    NOTURNO: { label: 'Noturno 12x36', color: 'purple' },
    FIXO: { label: 'Fixo 5x2', color: 'green' },
};

export default function ManageCollaborators() {
    const [loading, setLoading] = useState(true);
    const [tableData, setTableData] = useState<any[]>([]);
    const [collabList, setCollabList] = useState<Collaborator[]>([]);
    const [selected, setSelected] = useState<Collaborator | null>(null);
    const [editVisible, setEditVisible] = useState(false);
    const [deleteVisible, setDeleteVisible] = useState(false);

    const columns = [
        {
            title: 'Colaborador', dataIndex: 'nome', width: 220,
            render: (nome: string, r: any) => (
                <div>
                    <div className="font-medium">{nome}</div>
                    {r.email && <div className="text-xs text-gray-400">{r.email}</div>}
                </div>
            ),
        },
        {
            title: 'Subgrupo', dataIndex: 'subgrupo', width: 150,
            render: (s: string) => {
                const cfg = SUBGRUPO_LABELS[s];
                return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{s ?? '—'}</Tag>;
            },
        },
        {
            title: 'Escala', dataIndex: 'nameEscala', width: 120,
            render: (t: string) => t ?? '—',
        },
        {
            title: 'Turno', dataIndex: 'turno', width: 120,
            render: (t: string) => t ?? '—',
        },
        {
            title: 'Ativo', dataIndex: 'ativo', width: 70,
            render: (v: boolean) => <Tag color={v ? 'success' : 'default'}>{v ? 'Sim' : 'Não'}</Tag>,
        },
        {
            title: '', width: 80,
            render: (_: unknown, row: any) => (
                <>
                    <Tooltip title="Editar">
                        <Button type="text" size="small" icon={<EditOutlined />}
                            onClick={() => { setSelected(collabList.find(c => c._id === row._id) ?? null); setEditVisible(true); }} />
                    </Tooltip>
                    <Tooltip title="Deletar">
                        <Button type="text" size="small" danger icon={<DeleteOutlined />}
                            onClick={() => { setSelected(collabList.find(c => c._id === row._id) ?? null); setDeleteVisible(true); }} />
                    </Tooltip>
                </>
            ),
        },
    ];

    function buscarColaboradores() {
        setLoading(true);
        collaboratorService.getAll()
            .then(list => {
                setCollabList(list);
                setTableData(list.map(c => ({ ...c, key: c._id, nameEscala: c?.escala?.tipo })));
            })
            .catch(err => { console.error(err); message.error('Erro ao carregar colaboradores'); })
            .finally(() => setLoading(false));
    }

    useEffect(() => { buscarColaboradores(); }, []);

    const handleSave = async (data: Partial<Collaborator>) => {
        try {
            await collaboratorService.salve(data);
            message.success(data._id ? 'Colaborador atualizado com sucesso!' : 'Colaborador criado com sucesso!');
            buscarColaboradores();
        } catch (err) {
            console.error(err);
            message.error('Erro ao salvar colaborador. Verifique os dados e tente novamente.');
        }
    };

    const handleDelete = async () => {
        setDeleteVisible(false);
        if (!selected?._id) return;
        try {
            await collaboratorService.delete(selected._id);
            message.success(`Colaborador ${selected.nome} deletado com sucesso!`);
            buscarColaboradores();
        } catch (err) {
            console.error(err);
            message.error('Erro ao deletar colaborador.');
        }
    };

    return (
        <ConfigProvider locale={undefined} theme={theme}>
            <div className="min-h-screen bg-background">
                <ScheduleHeader />
                <main className="pt-28 pb-16 max-w-7xl mx-auto px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold">Colaboradores</h1>
                            <Button type="primary" icon={<PlusOutlined />}
                                onClick={() => { setSelected(null); setEditVisible(true); }}>
                                Novo Colaborador
                            </Button>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
                        <Spin spinning={loading}>
                            <Tabs defaultActiveKey="list" size="large" items={[{
                                key: 'list',
                                label: 'Colaboradores',
                                children: (
                                    <Table
                                        dataSource={tableData}
                                        columns={columns}
                                        pagination={{ pageSize: 15, showSizeChanger: true }}
                                        size="middle"
                                        scroll={{ x: 900 }}
                                        className="rounded-2xl border overflow-hidden"
                                    />
                                ),
                            }]} />
                        </Spin>
                    </motion.div>
                </main>

                <EditCollaboratorDialog
                    visible={editVisible}
                    onClose={() => { setEditVisible(false); setSelected(null); }}
                    onSave={handleSave}
                    collaborator={selected}
                    mode={selected ? 'edit' : 'create'}
                />

                <Modal
                    title="Deletar Colaborador"
                    open={deleteVisible}
                    onCancel={() => setDeleteVisible(false)}
                    onOk={handleDelete}
                    okText="Deletar"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                >
                    <div className="p-4 rounded-lg text-center">
                        <p>Tem certeza que deseja deletar o colaborador <strong>{selected?.nome}</strong>?</p>
                        {selected?.email && <p className="text-gray-500 text-sm mt-1">{selected.email}</p>}
                    </div>
                </Modal>
            </div>
        </ConfigProvider>
    );
}