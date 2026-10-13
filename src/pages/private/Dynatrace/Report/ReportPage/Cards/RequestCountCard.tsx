import React from 'react';
import { Card, Statistic, Spin } from 'antd';
import styles from '../components/css/Cards.module.css';

// 1. CORREÇÃO: Definição da interface que faltava
interface RequestCountCardProps {
    requestCount: number | null;
    loading: boolean;
}

export const RequestCountCard: React.FC<RequestCountCardProps> = ({ requestCount, loading }) => {
    return (
        <Card className={styles.kpiCard}>
            <Spin spinning={loading}>
                <Statistic
                    title={<span className={styles.kpiTitle}>Total de Requisições</span>}
                    value={requestCount !== null ? requestCount : '-'}
                    precision={0}
                    valueStyle={{ fontSize: '2.5rem', color: '#0062E4', fontWeight: 600 }}
                    className={styles.kpiValue} // Aplica a classe de valor
                />
            </Spin>
        </Card>
    );
};