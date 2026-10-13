import React from 'react';
import { Card, Statistic, Spin } from 'antd';
import styles from '../components/css/Cards.module.css';

// 1. Definição da interface
interface HostAvailabilityCardProps {
    availability: number | null;
    loading: boolean;
}

export const HostAvailabilityCard: React.FC<HostAvailabilityCardProps> = ({ availability, loading }) => {
    return (
        <Card className={styles.kpiCard}>
            <Spin spinning={loading}>
                <Statistic
                    // 2. Título e sufixo alterados
                    title={<span className={styles.kpiTitle}>Disponibilidade Média (Hosts)</span>}
                    value={availability !== null ? availability : '-'}
                    precision={2} // Disponibilidade é %
                    suffix="%" // Adiciona o %
                    valueStyle={{ fontSize: '2.5rem', color: '#0062E4', fontWeight: 600 }}
                    className={styles.kpiValue} // Aplica a classe de valor
                />
            </Spin>
        </Card>
    );
};