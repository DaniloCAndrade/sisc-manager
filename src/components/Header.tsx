import { Button, Dropdown } from 'antd';
import {
  LoginOutlined, LogoutOutlined, UserOutlined, TeamOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAuth } from '@/context/AuthContext';
import type { MenuProps } from 'antd';
// ⚠️ Ajuste o caminho relativo se este arquivo não estiver 2 níveis abaixo da
// raiz do projeto (onde fica o package.json). Vite suporta import de JSON
// nativamente, sem precisar mexer no vite.config.ts.
import { version as appVersion } from '../../package.json';

interface HeaderProps {
  onAccessClick?: () => void;
}

const Header = ({ }: HeaderProps) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    message.success('Você saiu com sucesso. Até logo!', 3);
    navigate('/');
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Meu perfil',
      onClick: () => navigate('/profile'),
    },
    ...(user?.perfil === 'admin' ? [
      { type: 'divider' as const },
      {
        key: 'users',
        icon: <TeamOutlined />,
        label: 'Gerenciar usuários',
        onClick: () => navigate('/users'),
      },
    ] : []),
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sair',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="
        fixed top-0 left-0 right-0 z-50
        backdrop-blur-xl bg-background/80
        border-b border-border/50
      "
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <motion.div
              className="w-11 h-11 rounded-xl brand-logo-gradient flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.3" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold brand-text-gradient">SISC Manager</span>
              <span className="text-xs font-medium text-muted-foreground border border-border/60 rounded-full px-2 py-0.5 leading-none">
                v{appVersion}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                <Button
                  type="default"
                  size="large"
                  icon={<UserOutlined />}
                  className="h-11 px-4 font-semibold rounded-xl flex items-center gap-2"
                >
                  <span className="hidden sm:inline">{user?.nome}</span>
                </Button>
              </Dropdown>
            ) : (
              <Button
                type="primary"
                size="large"
                icon={<LoginOutlined />}
                onClick={() => navigate('/login')}
                className="h-11 px-6 font-semibold rounded-xl flex items-center gap-2"
              >
                Acessar Ambiente
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;