// pages/public/HomePage.tsx

import { useNavigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ptBR from 'antd/locale/pt_BR';
import Header from '../../components/Header';
import HeroSection from '../../components/HeroSection';
import ModulesSection from '../../components/ModulesSection';
import Footer from '../../components/Footer';

const HomePage = () => {
  const navigate = useNavigate();

  const handleReportClick = () => navigate('/select-report');
  const handleApdexAnalyzeClick = () => navigate('/form-apdex-analyze');
  const handleScheduleClick = () => navigate('/schedule');
  const handleInventoryClick = () => navigate('/inventory');
  const handlePlatformClick = () => navigate('/platform-credentials');
  const handleLicenseClick = () => navigate('/licenciamento');

  const theme = {
    token: {
      colorPrimary: '#D70233',
      colorLink: '#055078',
      borderRadius: 12,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
  };

  return (
    <ConfigProvider locale={ptBR} theme={theme}>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <HeroSection />
          <ModulesSection
            onReportClick={handleReportClick}
            onApdexAnalyzeClick={handleApdexAnalyzeClick}
            onScheduleClick={handleScheduleClick}
            onInventoryClick={handleInventoryClick}
            onCredentialsClick={handlePlatformClick}
            onLicenseClick={handleLicenseClick}
          />
        </main>
        <Footer />
      </div>
    </ConfigProvider>
  );
};

export default HomePage;