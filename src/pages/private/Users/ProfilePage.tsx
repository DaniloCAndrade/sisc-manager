import { useState } from 'react';
import { Form, Input, Button, Tag, Typography, ConfigProvider, Alert } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ptBR from 'antd/locale/pt_BR';
import { useAuth } from '@/context/AuthContext';

const { Title, Text } = Typography;

const theme = {
    token: {
        colorPrimary: '#D70233',
        borderRadius: 12,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
};

const getInitials = (nome: string) =>
    nome?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';

const ProfilePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form] = Form.useForm();

    const handleEdit = () => {
        form.setFieldsValue({ nome: user?.nome, email: user?.email });
        setEditing(true);
        setSuccess(false);
        setError(null);
    };

    const handleCancel = () => {
        form.resetFields();
        setEditing(false);
        setError(null);
    };

    const handleSave = async () => {
        try {
            await form.validateFields();
            setLoading(true);
            await new Promise(r => setTimeout(r, 800));
            setEditing(false);
            setSuccess(true);
        } catch {
            setError('Erro ao salvar alterações.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <ConfigProvider locale={ptBR} theme={theme}>
            <div className="min-h-screen bg-background pt-24 pb-12 px-6">
                <div className="max-w-3xl mx-auto">

                    {/* Botão voltar */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 16 }}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            onClick={() => navigate('/')}
                            style={{ padding: '0 4px', color: '#6B7280' }}
                        >
                            Voltar
                        </Button>
                    </motion.div>

                    {/* Banner decorativo */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            height: 100,
                            borderRadius: '16px 16px 0 0',
                            background: 'linear-gradient(135deg, #1F3864 0%, #D70233 100%)',
                        }}
                    />

                    {/* Card principal */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{
                            background: '#FFFFFF',
                            border: '0.5px solid #E5E7EB',
                            borderTop: 'none',
                            borderRadius: '0 0 16px 16px',
                            padding: '0 32px 32px',
                        }}
                    >
                        {/* Avatar + info */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: '50%',
                                    background: '#1F3864',
                                    border: '4px solid #FFFFFF',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 28, fontWeight: 500, color: '#fff',
                                    marginTop: -40, flexShrink: 0,
                                }}>
                                    {getInitials(user.nome)}
                                </div>
                                <div style={{ paddingBottom: 4 }}>
                                    <Title level={4} style={{ margin: 0 }}>{user.nome}</Title>
                                    <Text type="secondary" style={{ fontSize: 13 }}>{user.email}</Text>
                                </div>
                            </div>

                            {!editing ? (
                                <Button icon={<EditOutlined />} onClick={handleEdit} style={{ borderRadius: 8 }}>
                                    Editar
                                </Button>
                            ) : (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <Button icon={<CloseOutlined />} onClick={handleCancel} style={{ borderRadius: 8 }}>
                                        Cancelar
                                    </Button>
                                    <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSave} style={{ borderRadius: 8 }}>
                                        Salvar
                                    </Button>
                                </div>
                            )}
                        </div>

                        {success && (
                            <Alert type="success" message="Perfil atualizado com sucesso." showIcon
                                style={{ marginBottom: 24, borderRadius: 8 }} closable onClose={() => setSuccess(false)} />
                        )}
                        {error && (
                            <Alert type="error" message={error} showIcon style={{ marginBottom: 24, borderRadius: 8 }} />
                        )}

                        {/* Campos */}
                        {!editing ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 32px' }}>
                                {[
                                    { label: 'Nome completo', value: user.nome },
                                    { label: 'Email', value: user.email },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</Text>
                                        <div style={{
                                            background: '#F9FAFB', border: '0.5px solid #E5E7EB',
                                            borderRadius: 8, padding: '10px 14px', fontSize: 14,
                                        }}>
                                            {value}
                                        </div>
                                    </div>
                                ))}
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Perfil</Text>
                                    <div style={{ paddingTop: 6 }}>
                                        <Tag color={user.perfil === 'admin' ? 'blue' : 'default'}>
                                            {user.perfil.charAt(0).toUpperCase() + user.perfil.slice(1)}
                                        </Tag>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Form form={form} layout="vertical" requiredMark={false}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                                    <Form.Item name="nome" label="Nome completo" rules={[{ required: true, message: 'Informe o nome' }]}>
                                        <Input size="large" style={{ borderRadius: 8 }} />
                                    </Form.Item>
                                    <Form.Item name="email" label="Email">
                                        <Input size="large" disabled style={{ borderRadius: 8 }} />
                                    </Form.Item>
                                </div>
                                <Form.Item name="novaSenha" label="Nova senha" extra="Deixe em branco para manter a senha atual">
                                    <Input.Password placeholder="Mínimo 8 caracteres" size="large"
                                        style={{ borderRadius: 8, maxWidth: '50%' }} />
                                </Form.Item>
                            </Form>
                        )}

                        {/* Email de acesso */}
                        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '0.5px solid #E5E7EB' }}>
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                                Email de acesso
                            </Text>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 8, background: '#DBEAFE',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <UserOutlined style={{ color: '#1E40AF', fontSize: 16 }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{user.email}</div>
                                    <div style={{ fontSize: 12, color: '#6B7280' }}>Conta verificada</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </ConfigProvider>
    );
};

export default ProfilePage;