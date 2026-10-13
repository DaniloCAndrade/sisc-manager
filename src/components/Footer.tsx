import { motion } from 'framer-motion';
// ⚠️ Ajuste o caminho relativo se este arquivo não estiver 2 níveis abaixo da
// raiz do projeto (onde fica o package.json). Vite suporta import de JSON
// nativamente, sem precisar mexer no vite.config.ts.
import { version as appVersion } from '../../package.json';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="border-t border-border bg-card/50 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg brand-logo-gradient flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="currentColor"
                  fillOpacity="0.3"
                />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <span className="font-semibold brand-text-gradient">SISC Manager</span>
            <span className="text-xs font-medium text-muted-foreground border border-border/60 rounded-full px-2 py-0.5 leading-none">
              v{appVersion}
            </span>
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {currentYear} SISC Manager. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;