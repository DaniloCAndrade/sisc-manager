import { useState } from 'react';
import { Modal, Form, Input, Select, Button, Alert } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { userService, type User } from '@/services/userService';

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated?: (user: User) => void;
}

interface FormValues {
    nome: string;
    email: string;
    senha: string;
    perfil: 'admin' | 'viewer';
}

const CreateUserModal = ({ open, onClose, onCreated }: Props) => {
    const [form] = Form.useForm<FormValues>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            setError(null);
            const user = await userService.register(values);
            form.resetFields();
            onCreated?.(user);
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? err?.message ?? 'Erro ao criar usuário.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setError(null);
        onClose();
    };

    return (
        <Modal
            open={open}
            onCancel={handleCancel}
            title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserAddOutlined />
                    Novo usuário
                </span>
            }
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={handleCancel} disabled={loading}>Cancelar</Button>
                    <Button type="primary" loading={loading} onClick={handleSubmit}>
                        Criar usuário
                    </Button>
                </div>
            }
            width={480}
            destroyOnClose
        >
            <div style={{ padding: '8px 0' }}>
                {error && (
                    <Alert type="error" message={error} showIcon style={{ marginBottom: 16, borderRadius: 8 }} />
                )}

                <Form form={form} layout="vertical" requiredMark={false} initialValues={{ perfil: 'viewer' }}>
                    <Form.Item
                        name="nome"
                        label="Nome completo"
                        rules={[{ required: true, message: 'Informe o nome' }]}
                    >
                        <Input placeholder="Ex: João Silva" size="large" style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Informe o email' },
                            { type: 'email', message: 'Email inválido' },
                        ]}
                    >
                        <Input placeholder="fulano@verytecnologia.com.br" size="large" style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Form.Item
                        name="senha"
                        label="Senha"
                        rules={[
                            { required: true, message: 'Informe a senha' },
                            { min: 8, message: 'Mínimo de 8 caracteres' },
                        ]}
                    >
                        <Input.Password placeholder="Mínimo 8 caracteres" size="large" style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Form.Item name="perfil" label="Perfil">
                        <Select size="large" style={{ borderRadius: 8 }}>
                            <Select.Option value="viewer">Viewer - somente leitura</Select.Option>
                            <Select.Option value="admin">Admin - acesso completo</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default CreateUserModal;