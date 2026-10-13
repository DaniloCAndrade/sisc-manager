import { motion } from 'framer-motion';
import { FileTextOutlined, LineChartOutlined, ClusterOutlined, CalendarOutlined, DatabaseOutlined } from '@ant-design/icons';
import ServiceCard from './ServiceCard';

interface ModulesSectionProps {
  onCredentialsClick: () => void;
  onReportClick: () => void;
  onApdexAnalyzeClick: () => void;
  onScheduleClick: () => void;
  onInventoryClick: () => void;
  onLicenseClick: () => void;
}

const ModulesSection = ({ onCredentialsClick, onReportClick, onApdexAnalyzeClick, onScheduleClick, onInventoryClick, onLicenseClick }: ModulesSectionProps) => {
  const modules = [
    {
      title: 'Credenciais do Dynatrace',
      description: 'Gerencie as credenciais de acesso aos ambientes Dynatrace, incluindo tokens e URLs, para garantir a conectividade dos módulos.',
      icon: <FileTextOutlined />,
      actionLabel: 'Acessar',
      onClick: onCredentialsClick,
      disabled: false,
    },
    {
      title: 'Relatórios APM',
      description: 'Geração automatizada de relatórios de performance, experiência do usuário e infraestrutura com insights detalhados.',
      icon: <FileTextOutlined />,
      actionLabel: 'Acessar',
      onClick: onReportClick,
      disabled: false,
    },
    {
      title: 'Inventário de Tenants',
      description: 'Varredura completa dos objetos de um tenant Dynatrace: hosts, serviços, aplicações, dashboards e muito mais.',
      icon: <DatabaseOutlined />,
      actionLabel: 'Acessar',
      onClick: onInventoryClick,
      disabled: false,
    },
    {
      title: 'Análise de APDEX',
      description: 'Visão aprofundada da experiência do usuário, classificações e tendências de satisfação ao longo do tempo.',
      icon: <LineChartOutlined />,
      actionLabel: 'Acessar',
      onClick: onApdexAnalyzeClick,
      disabled: false,
    },
    {
      title: 'Escala do Time',
      description: 'Gestão de turnos 12x36 e 5x2, plantões de madrugada, substituições e exportação mensal para o RH.',
      icon: <CalendarOutlined />,
      actionLabel: 'Acessar',
      onClick: onScheduleClick,
      disabled: false,
    },
    {
      title: 'Licenciamento',
      description: 'Visão gerencial de consumo (DPS e Classic) dos ambientes Dynatrace: Host Units, DDU, DEM e Application Security, de forma centralizada.',
      icon: <ClusterOutlined />,
      actionLabel: 'Acessar',
      onClick: onLicenseClick,
      disabled: false,
    },
  ];

  return (
    <section className="py-24 relative">
      {/* Section Background */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-muted/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4"
          >
            Funcionalidades
          </motion.span>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Módulos Disponíveis
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore as ferramentas disponíveis para análise e governança
            dos seus ambientes de monitoramento.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {modules.map((module, index) => (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ServiceCard {...module} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModulesSection;