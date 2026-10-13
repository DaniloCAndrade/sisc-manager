import React from 'react';
import { Card, Statistic, Spin } from 'antd';
import styles from '../components/css/Cards.module.css';

// 1. Definição da interface
interface UserSessionsCardProps {
    sessionCount: number | null;
    loading: boolean;
}

export const UserSessionsCard: React.FC<UserSessionsCardProps> = ({ sessionCount, loading }) => {
    return (
        <Card className={styles.kpiCard}>
            <Spin spinning={loading}>
                <Statistic
                    // 2. Título alterado
                    title={<span className={styles.kpiTitle}>Total de Sessões</span>}
                    value={sessionCount !== null ? sessionCount : '-'}
                    precision={0}
                    valueStyle={{ fontSize: '2.5rem', color: '#0062E4', fontWeight: 600 }}
                    className={styles.kpiValue} // Aplica a classe de valor
                />
            </Spin>
        </Card>
    );
};