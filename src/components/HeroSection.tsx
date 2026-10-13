import { motion } from 'framer-motion';
import { BarChartOutlined, DashboardOutlined, SafetyOutlined } from '@ant-design/icons';

import './css/home.css'

const HeroSection = () => {
  const stats = [
    { icon: <BarChartOutlined />, value: '99.9%', label: 'Uptime' },
    { icon: <DashboardOutlined />, value: '150+', label: 'Métricas' },
    { icon: <SafetyOutlined />, value: '24/7', label: 'Monitoramento' },
  ];

  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden pt-20">
      {/* Background Gradient */}
      <div className="absolute inset-0 hero-gradient opacity-[0.03]" />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full brand-logo-gradient opacity-10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 w-125 h-125 rounded-full bg-[hsl(200,93%,24%)] opacity-5 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Plataforma Corporativa
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-foreground">Análise de </span>
              <span className="brand-text-gradient">Performance</span>
              <span className="text-foreground"> & </span>
              <span className="brand-text-gradient">Experiência</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl">
              Uma plataforma corporativa para análise de performance, 
              experiência do usuário e governança dos ambientes Dynatrace, 
              projetada para times técnicos e lideranças.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl brand-logo-gradient flex items-center justify-center text-white text-lg">
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Main Dashboard Card */}
              <motion.div
                className="bg-card rounded-3xl p-8 shadow-2xl border border-border/50"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Mock Chart */}
                <div className="flex items-end gap-3 h-48 mb-6">
                  {[40, 65, 45, 80, 55, 90, 70, 85].map((height, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-t-lg brand-logo-gradient"
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                    />
                  ))}
                </div>
                
                {/* Mock Labels */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Jan</span>
                  <span>Fev</span>
                  <span>Mar</span>
                  <span>Abr</span>
                  <span>Mai</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Ago</span>
                </div>
              </motion.div>

              {/* Floating Stats Card */}
              <motion.div
                className="absolute -bottom-6 -left-6 bg-card rounded-2xl p-5 shadow-xl border border-border/50"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                    ↑
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">APDEX Score</div>
                    <div className="text-xl font-bold text-foreground">0.94</div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Alert Card */}
              <motion.div
                className="absolute -top-4 -right-4 bg-card rounded-2xl p-4 shadow-xl border border-border/50"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-foreground">Sistemas Operacionais</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;