import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, ConfigProvider } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import ptBR from 'antd/locale/pt_BR';

interface FormValues {
    email: string;
    senha: string;
}

const theme = {
    token: {
        colorPrimary: '#D70233',
        colorLink: '#055078',
        borderRadius: 12,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
};

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (values: FormValues) => {
        try {
            setLoading(true);
            setError(null);
            await login(values.email, values.senha);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ConfigProvider locale={ptBR} theme={theme}>
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Logo + título */}
                    <div className="flex flex-col items-center mb-8 gap-4">
                        <motion.div
                            className="w-14 h-14 rounded-2xl brand-logo-gradient flex items-center justify-center shadow-lg"
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.3" />
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </motion.div>
                        <div className="text-center">
                            <h1 className="text-2xl font-bold brand-text-gradient">SISC Manager</h1>
                            <p className="text-sm text-muted-foreground mt-1">Faça login para continuar</p>
                        </div>
                    </div>

                    {/* Card */}
                    <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-lg">
                        {error && (
                            <Alert
                                type="error"
                                message={error}
                                showIcon
                                className="mb-6"
                                style={{ borderRadius: 10 }}
                            />
                        )}

                        <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    { required: true, message: 'Informe seu email' },
                                    { type: 'email', message: 'Email inválido' },
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined className="text-muted-foreground" />}
                                    placeholder="seu@email.com"
                                    size="large"
                                    style={{ borderRadius: 10 }}
                                />
                            </Form.Item>

                            <Form.Item
                                name="senha"
                                label="Senha"
                                rules={[{ required: true, message: 'Informe sua senha' }]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="text-muted-foreground" />}
                                    placeholder="••••••••"
                                    size="large"
                                    style={{ borderRadius: 10 }}
                                />
                            </Form.Item>

                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={loading}
                                block
                                style={{ borderRadius: 10, height: 44, fontWeight: 600 }}
                            >
                                Entrar
                            </Button>
                        </Form>
                    </div>
                </motion.div>
            </div>
        </ConfigProvider>
    );
};

export default LoginPage;