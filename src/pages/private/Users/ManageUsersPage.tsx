import { useEffect, useState } from 'react';
import { Table, Tag, Button, Typography, Spin, Alert, ConfigProvider } from 'antd';
import { UserAddOutlined, TeamOutlined, ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ptBR from 'antd/locale/pt_BR';
import { userService, type User } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';
import CreateUserModal from './CreateUserModal';
import ViewUserModal from './ViewUserModal';

const { Title, Text } = Typography;

const theme = {
    token: {
        colorPrimary: '#D70233',
        borderRadius: 12,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
};

const ManageUsersPage = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [viewUser, setViewUser] = useState<User | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await userService.listAll();
            setUsers(data);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Erro ao carregar usuários.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const getInitials = (nome: string) =>
        nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

    const formatDate = (date: string) => {
        if (!date) return '—';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const columns = [
        {
            title: 'Nome',
            dataIndex: 'nome',
            key: 'nome',
            render: (nome: string, record: User) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: '#DBEAFE',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 500, color: '#1E40AF', flexShrink: 0,
                    }}>
                        {getInitials(nome)}
                    </div>
                    <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>
                            {nome}
                            {record.email === currentUser?.email && (
                                <Tag style={{ marginLeft: 8, fontSize: 11 }}>Você</Tag>
                            )}
                        </div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{record.email}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Perfil',
            dataIndex: 'perfil',
            key: 'perfil',
            render: (perfil: string) => (
                <Tag color={perfil === 'admin' ? 'blue' : 'default'}>
                    {perfil.charAt(0).toUpperCase() + perfil.slice(1)}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'ativo',
            key: 'ativo',
            render: (ativo: boolean) => (
                <Tag color={ativo ? 'success' : 'error'}>{ativo ? 'Ativo' : 'Inativo'}</Tag>
            ),
        },
        {
            title: 'Criado em',
            dataIndex: 'criadoEm',
            key: 'criadoEm',
            render: (date: string) => formatDate(date),
        },
        {
            title: '',
            key: 'acoes',
            width: 60,
            render: (_: any, record: User) => (
                <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => setViewUser(record)}
                    style={{ borderRadius: 6 }}
                />
            ),
        },
    ];

    return (
        <ConfigProvider locale={ptBR} theme={theme}>
            <div className="min-h-screen bg-background pt-24 pb-12 px-6">
                <div className="max-w-5xl mx-auto">

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 16 }}>
                        <Button
                            icon={<ArrowLeftOutlined />} type="text"
                            onClick={() => navigate('/')}
                            style={{ padding: '0 4px', color: '#6B7280' }}
                        >
                            Voltar
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <TeamOutlined style={{ fontSize: 24, color: '#6B7280' }} />
                            <div>
                                <Title level={4} style={{ margin: 0 }}>Usuários</Title>
                                {!loading && (
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
                                    </Text>
                                )}
                            </div>
                        </div>
                        <Button
                            type="primary" icon={<UserAddOutlined />}
                            onClick={() => setCreateOpen(true)}
                            size="large" style={{ borderRadius: 10, fontWeight: 600 }}
                        >
                            Novo usuário
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}
                    >
                        {error ? (
                            <div style={{ padding: 24 }}><Alert type="error" message={error} showIcon /></div>
                        ) : loading ? (
                            <div style={{ padding: 64, display: 'flex', justifyContent: 'center' }}><Spin size="large" /></div>
                        ) : (
                            <Table dataSource={users} columns={columns} rowKey="_id" pagination={false} />
                        )}
                    </motion.div>
                </div>
            </div>

            <CreateUserModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(newUser) => setUsers(prev => [...prev, newUser])}
            />

            <ViewUserModal
                user={viewUser}
                onClose={() => setViewUser(null)}
                onUpdated={(updated) => {
                    setUsers(prev => prev.map(u => u._id === updated._id ? updated : u));
                    setViewUser(null);
                }}
                onDeleted={(id) => {
                    setUsers(prev => prev.filter(u => u._id !== id));
                    setViewUser(null);
                }}
            />
        </ConfigProvider>
    );
};

export default ManageUsersPage;