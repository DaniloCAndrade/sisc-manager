// pages/schedule/ManagePrograms.tsx
import { Button, ConfigProvider, DatePicker, Form, Input, Modal, Select, Spin, Table, Tag, Tooltip, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { ScheduleHeader } from './ScheduleHeader';
import { theme } from './helpers';
import { collaboratorService } from '@/services/scheduleServices';
import { programService } from '@/services/scheduleServices';
import type { Collaborator, Program, ProgramTipo } from '@/types/schedule';

const { Option } = Select;
const { RangePicker } = DatePicker;

const TIPO_LABELS: Record<ProgramTipo, string> = {
    commercial: 'Horário Comercial',
    evening: 'Evening (19h–23h59)',
    fullnight: 'Fullnight (19h–07h)',
};

const TIPO_COLORS: Record<ProgramTipo, string> = {
    commercial: 'default',
    evening: 'orange',
    fullnight: 'purple',
};

export default function ManagePrograms() {
    const [loading, setLoading] = useState(false);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
    const [form] = Form.useForm();

    // Período padrão: mês atual
    const [periodo, setPeriodo] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
        dayjs().startOf('month'),
        dayjs().endOf('month'),
    ]);

    useEffect(() => {
        collaboratorService.getAll().then(setCollaborators).catch(console.error);
    }, []);

    useEffect(() => {
        buscarProgramas();
    }, [periodo]);

    const buscarProgramas = async () => {
        setLoading(true);
        try {
            const res = await programService.getAll(periodo[0].toDate(), periodo[1].toDate());
            setPrograms(res);
        } catch (err) {
            console.error(err);
            message.error('Erro ao buscar programas');
        } finally {
            setLoading(false);
        }
    };

    const handleCriar = async () => {
        try {
            const values = await form.validateFields();
            const tipo: ProgramTipo = values.tipo;

            await programService.criar({
                programName: values.programName,
                tipo,
                startDate: values.periodo[0].format('YYYY-MM-DD'),
                endDate: values.periodo[1].format('YYYY-MM-DD'),
                firstCollaboratorId: tipo !== 'commercial' ? values.firstCollaboratorId : undefined,
            });

            message.success('Programa criado com sucesso!');
            setModalVisible(false);
            form.resetFields();
            buscarProgramas();
        } catch (err: any) {
            if (err?.errorFields) return; // validação antd
            console.error(err);
            message.error('Erro ao criar programa');
        }
    };

    const handleDeletar = async () => {
        if (!deleteTarget) return;
        try {
            await programService.deletar(
                deleteTarget.programName,
                deleteTarget.startDate ?? undefined,
                deleteTarget.endDate ?? undefined,
            );
            message.success('Programa removido!');
            setDeleteTarget(null);
            buscarProgramas();
        } catch (err) {
            console.error(err);
            message.error('Erro ao remover programa');
        }
    };

    const columns = [
        {
            title: 'Programa',
            dataIndex: 'programName',
            key: 'programName',
            width: 200,
            render: (name: string) => <strong>{name}</strong>,
        },
        {
            title: 'Período',
            key: 'periodo',
            width: 200,
            render: (_: any, r: Program) => (
                <div>
                    <div>{r.startDate ? dayjs(r.startDate).format('DD/MM/YYYY') : '—'}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>até {r.endDate ? dayjs(r.endDate).format('DD/MM/YYYY') : '—'}</div>
                </div>
            ),
        },
        {
            title: 'Plantonistas',
            dataIndex: 'collaborators',
            key: 'collaborators',
            render: (collabs: string[]) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {collabs.map(c => <Tag key={c}>{c}</Tag>)}
                </div>
            ),
        },
        {
            title: 'Slots',
            key: 'slots',
            width: 80,
            render: (_: any, r: Program) => <Tag color="blue">{r.totalSlots}</Tag>,
        },
        {
            title: 'Ações',
            key: 'actions',
            width: 60,
            render: (_: any, r: Program) => (
                <Tooltip title="Remover programa">
                    <Button
                        type="text" danger size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => setDeleteTarget(r)}
                    />
                </Tooltip>
            ),
        },
    ];

    const tipoWatch = Form.useWatch('tipo', form);

    return (
        <ConfigProvider locale={undefined} theme={theme}>
            <div className="min-h-screen bg-background">
                <ScheduleHeader />
                <main className="pt-28 pb-16 max-w-7xl mx-auto px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold">Programas</h1>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <RangePicker
                                    value={periodo}
                                    onChange={v => v && setPeriodo(v as any)}
                                    format="DD/MM/YYYY"
                                />
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                                    Novo Programa
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
                        <Spin spinning={loading}>
                            <Table
                                dataSource={programs}
                                columns={columns}
                                rowKey="programName"
                                pagination={false}
                                className="rounded-2xl border"
                                expandable={{
                                    expandedRowRender: (record: Program) => (
                                        <Table
                                            dataSource={record.slots}
                                            rowKey={(s, i) => `${s.date}-${i}`}
                                            pagination={false}
                                            size="small"
                                            columns={[
                                                { title: 'Data', dataIndex: 'date', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
                                                { title: 'Dia', dataIndex: 'diaSemana', width: 120 },
                                                { title: 'Slot', dataIndex: 'slot', width: 80, render: (s: string) => <Tag>{s}</Tag> },
                                                { title: 'Plantonista', dataIndex: 'collaborator' },
                                                { title: 'Horário', render: (_: any, s: any) => `${s.start}–${s.end}` },
                                                { title: 'Horas', dataIndex: 'hours', width: 70, render: (h: number) => `${h}h` },
                                            ]}
                                        />
                                    ),
                                }}
                            />
                        </Spin>
                    </motion.div>
                </main>

                {/* Modal criação */}
                <Modal
                    title="Novo Programa"
                    open={modalVisible}
                    onCancel={() => { setModalVisible(false); form.resetFields(); }}
                    onOk={handleCriar}
                    okText="Criar"
                    cancelText="Cancelar"
                    width={560}
                >
                    <Form form={form} layout="vertical" initialValues={{ tipo: 'fullnight' }}>
                        <Form.Item name="programName" label="Nome do Programa" rules={[{ required: true, message: 'Informe o nome' }]}>
                            <Input placeholder="Ex: Programa DETRAN — ENEM 2026" />
                        </Form.Item>

                        <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
                            <Select>
                                {(Object.entries(TIPO_LABELS) as [ProgramTipo, string][]).map(([k, v]) => (
                                    <Option key={k} value={k}>
                                        <Tag color={TIPO_COLORS[k]}>{v}</Tag>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="periodo" label="Período" rules={[{ required: true, message: 'Informe o período' }]}>
                            <RangePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                        </Form.Item>

                        {tipoWatch !== 'commercial' && (
                            <Form.Item
                                name="firstCollaboratorId"
                                label="Primeiro plantonista (início da rotação)"
                                rules={[{ required: true, message: 'Selecione o colaborador inicial' }]}
                            >
                                <Select
                                    showSearch
                                    optionFilterProp="children"
                                    placeholder="Selecione quem inicia o programa"
                                    filterOption={(input, opt) =>
                                        (opt?.children as any)?.toLowerCase?.()?.includes(input.toLowerCase())
                                    }
                                >
                                    {collaborators
                                        .filter(c => c.subgrupo === 'FIXO')
                                        .map(c => <Option key={c._id} value={c._id}>{c.nome}</Option>)
                                    }
                                </Select>
                            </Form.Item>
                        )}
                    </Form>
                </Modal>

                {/* Modal confirmação de delete */}
                <Modal
                    title="Remover Programa"
                    open={!!deleteTarget}
                    onCancel={() => setDeleteTarget(null)}
                    onOk={handleDeletar}
                    okText="Remover"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                >
                    <p>Tem certeza que deseja remover o programa <strong>{deleteTarget?.programName}</strong>?</p>
                    <p style={{ color: '#64748b', fontSize: 13 }}>
                        Todos os slots de overnight e opening serão apagados dos dias correspondentes.
                    </p>
                </Modal>
            </div>
        </ConfigProvider>
    );
}