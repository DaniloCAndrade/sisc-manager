import { useEffect, useState } from 'react';
import {
    Modal, Form, Input, Select, Button, Alert, Tag, Popconfirm,
    Typography, Divider, Switch,
} from 'antd';
import {
    EditOutlined, CloseOutlined,
    DeleteOutlined, CheckOutlined, LockOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { userService, type User } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';

const { Text } = Typography;

interface Props {
    user: User | null;
    onClose: () => void;
    onUpdated: (user: User) => void;
    onDeleted: (id: string) => void;
}

const ViewUserModal = ({ user, onClose, onUpdated, onDeleted }: Props) => {
    const { user: currentUser } = useAuth();

    const [form] = Form.useForm();
    const [senhaForm] = Form.useForm();

    const [editField, setEditField] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingSenha, setLoadingSenha] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [senhaOk, setSenhaOk] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const [draft, setDraft] = useState<User | null>(null);

    useEffect(() => {
        if (user) {
            setDraft({ ...user });
            setHasChanges(false);
            setError(null);
            setSenhaOk(false);
            setEditField(null);
            form.resetFields();
            senhaForm.resetFields();
        }
    }, [user]);

    if (!user || !draft) return null;

    const isSelf = user._id === currentUser?.id;

    const saveField = async (field: string, value: any) => {
        setDraft(prev => prev ? { ...prev, [field]: value } : prev);
        setHasChanges(true);
        setEditField(null);
    };

    const handleConcluir = async () => {
        if (!hasChanges) { onClose(); return; }
        try {
            setLoading(true);
            setError(null);
            const saved = await userService.update(user._id, {
                nome: draft.nome,
                perfil: draft.perfil,
                ativo: draft.ativo,
            });
            onUpdated(saved);
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? err?.message ?? 'Erro ao salvar.');
        } finally {
            setLoading(false);
        }
    };

    const handleSenha = async () => {
        try {
            const { senha } = await senhaForm.validateFields();
            setLoadingSenha(true);
            setError(null);
            setSenhaOk(false);
            await userService.updateSenha(user._id, senha);
            senhaForm.resetFields();
            setSenhaOk(true);
            // Limpa o feedback de sucesso após 4s
            setTimeout(() => setSenhaOk(false), 4000);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? err?.message ?? 'Erro ao alterar senha.');
        } finally {
            setLoadingSenha(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await userService.remove(user._id);
            onDeleted(user._id);
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? err?.message ?? 'Erro ao excluir.');
            setDeleting(false);
        }
    };

    const EditableField = ({
        label, field, value, children,
    }: {
        label: string; field: string; value: string; children?: React.ReactNode;
    }) => (
        <div style={{ marginBottom: 20 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                {label}
            </Text>
            {editField === field ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {children}
                    <Button
                        size="small" type="primary" icon={<CheckOutlined />}
                        onClick={() => { const val = form.getFieldValue(field); if (val !== undefined) saveField(field, val); }}
                        style={{ borderRadius: 6 }}
                    />
                    <Button size="small" icon={<CloseOutlined />} onClick={() => setEditField(null)} style={{ borderRadius: 6 }} />
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, background: '#F9FAFB', border: '0.5px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 14 }}>
                        {value}
                    </div>
                    <Button
                        size="small" icon={<EditOutlined />}
                        onClick={() => { form.setFieldValue(field, draft[field as keyof User]); setEditField(field); }}
                        style={{ borderRadius: 6 }}
                    />
                </div>
            )}
        </div>
    );

    return (
        <Modal
            open={!!user}
            onCancel={onClose}
            width={520}
            destroyOnClose
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: '#DBEAFE',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 600, color: '#1E40AF',
                    }}>
                        {draft.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{draft.nome}</div>
                        <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 400 }}>{draft.email}</div>
                    </div>
                </div>
            }
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {!isSelf ? (
                        <Popconfirm
                            title="Excluir usuário"
                            description={`Tem certeza que deseja excluir "${user.nome}"? Esta ação não pode ser desfeita.`}
                            onConfirm={handleDelete}
                            okText="Excluir"
                            cancelText="Cancelar"
                            okButtonProps={{ danger: true, loading: deleting }}
                            placement="topLeft"
                        >
                            <Button danger icon={<DeleteOutlined />} loading={deleting} style={{ borderRadius: 8 }}>
                                Excluir
                            </Button>
                        </Popconfirm>
                    ) : <div />}

                    <Button type="primary" loading={loading} onClick={handleConcluir} style={{ borderRadius: 8 }}>
                        {hasChanges ? 'Salvar e fechar' : 'Concluir'}
                    </Button>
                </div>
            }
        >
            <div style={{ padding: '8px 0' }}>
                {error && (
                    <Alert type="error" message={error} showIcon
                        style={{ marginBottom: 16, borderRadius: 8 }} closable onClose={() => setError(null)} />
                )}

                <Form form={form} layout="vertical">
                    <EditableField label="Nome completo" field="nome" value={draft.nome}>
                        <Form.Item name="nome" style={{ margin: 0, flex: 1 }}>
                            <Input size="small" style={{ borderRadius: 6 }} />
                        </Form.Item>
                    </EditableField>

                    <div style={{ marginBottom: 20 }}>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>Email</Text>
                        <div style={{ background: '#F3F4F6', border: '0.5px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: '#9CA3AF' }}>
                            {draft.email}
                        </div>
                    </div>

                    <EditableField label="Perfil" field="perfil" value={draft.perfil.charAt(0).toUpperCase() + draft.perfil.slice(1)}>
                        <Form.Item name="perfil" style={{ margin: 0, flex: 1 }}>
                            <Select size="small" style={{ borderRadius: 6 }}>
                                <Select.Option value="viewer">Viewer</Select.Option>
                                <Select.Option value="admin">Admin</Select.Option>
                            </Select>
                        </Form.Item>
                    </EditableField>

                    <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Status</Text>
                            <Tag color={draft.ativo ? 'success' : 'error'}>{draft.ativo ? 'Ativo' : 'Inativo'}</Tag>
                        </div>
                        <Switch
                            checked={draft.ativo}
                            disabled={isSelf}
                            onChange={(val) => { setDraft(d => d ? { ...d, ativo: val } : d); setHasChanges(true); }}
                        />
                    </div>
                </Form>

                {/* Alterar senha */}
                <Divider style={{ margin: '8px 0 16px' }} />
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>
                    <LockOutlined style={{ marginRight: 4 }} />
                    Alterar senha
                </Text>

                {/* Feedback de sucesso */}
                {senhaOk && (
                    <Alert
                        type="success"
                        icon={<CheckCircleOutlined />}
                        message="Senha alterada com sucesso."
                        showIcon
                        style={{ marginBottom: 12, borderRadius: 8 }}
                    />
                )}

                <Form form={senhaForm} layout="inline">
                    <Form.Item
                        name="senha"
                        rules={[
                            { required: true, message: '' },
                            { min: 8, message: 'Mínimo 8 caracteres' },
                        ]}
                        style={{ flex: 1, marginRight: 8 }}
                    >
                        <Input.Password
                            placeholder="Nova senha (mín. 8 caracteres)"
                            size="small"
                            style={{ borderRadius: 6 }}
                        />
                    </Form.Item>
                    <Button size="small" loading={loadingSenha} onClick={handleSenha} style={{ borderRadius: 6 }}>
                        Alterar
                    </Button>
                </Form>
            </div>
        </Modal>
    );
};

export default ViewUserModal;