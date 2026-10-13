import { Card, Button, Tag } from 'antd';
import { ArrowRightOutlined, LockOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ServiceCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const ServiceCard = ({
  title,
  description,
  icon,
  actionLabel = 'Acessar',
  onClick,
  disabled = false,
}: ServiceCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={disabled ? {} : { y: -8, transition: { duration: 0.3 } }}
      className="h-full"
    >
      <Card
        className={`
          h-full relative overflow-hidden
          border-0 rounded-2xl
          transition-all duration-300
          ${disabled 
            ? 'bg-muted/50 opacity-70 cursor-not-allowed' 
            : 'bg-card card-elevated gradient-border cursor-pointer hover:shadow-xl'
          }
        `}
        styles={{
          body: {
            padding: '2rem',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }
        }}
        onClick={disabled ? undefined : onClick}
      >
        {/* Icon Container */}
        {icon && (
          <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center mb-5
            ${disabled ? 'bg-muted' : 'brand-logo-gradient'}
          `}>
            <span className="text-2xl text-white">{icon}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className={`
              text-xl font-semibold m-0
              ${disabled ? 'text-muted-foreground' : 'text-foreground'}
            `}>
              {title}
            </h3>
            {disabled && (
              <Tag 
                icon={<LockOutlined />} 
                className="border-0 bg-muted text-muted-foreground text-xs"
              >
                Em breve
              </Tag>
            )}
          </div>
          <p className="text-muted-foreground leading-relaxed m-0 text-sm">
            {description}
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-border">
          <Button
            type={disabled ? 'default' : 'primary'}
            size="large"
            disabled={disabled}
            className={`
              w-full h-12 font-medium rounded-xl
              flex items-center justify-center gap-2
              ${disabled 
                ? 'bg-muted border-0 text-muted-foreground' 
                : 'border-0'
              }
            `}
            icon={disabled ? <LockOutlined /> : <ArrowRightOutlined />}
            iconPosition="end"
          >
            {disabled ? 'Indisponível' : actionLabel}
          </Button>
        </div>

        {/* Decorative gradient overlay on hover */}
        {!disabled && (
          <div className="
            absolute inset-0 pointer-events-none opacity-0
            hover:opacity-100 transition-opacity duration-500
            bg-gradient-to-br from-[hsl(349,97%,42%,0.02)] to-[hsl(20,92%,62%,0.05)]
          " />
        )}
      </Card>
    </motion.div>
  );
};

export default ServiceCard;