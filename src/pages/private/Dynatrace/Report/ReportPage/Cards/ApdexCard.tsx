import React from 'react';
import { Card, Statistic, Spin } from 'antd';
// 1. IMPORTA O CSS MODULE
import styles from '../components/css/Cards.module.css';

interface ApdexCardProps {
    apdexValue: number | null;
    loading: boolean;
}

export const ApdexCard: React.FC<ApdexCardProps> = ({ apdexValue, loading }) => {
    return (
        // 2. APLICA A CLASSE PRINCIPAL AO CARD
        <Card className={styles.kpiCard}>
            <Spin spinning={loading}>
                <Statistic
                    // 3. CORREÇÃO: Envolve o título em um <span> com a classe
                    title={<span className={styles.kpiTitle}>Média Geral (Apdex)</span>}
                    value={apdexValue !== null ? apdexValue : '-'}
                    precision={2}
                    valueStyle={{ fontSize: '2.5rem', color: '#0062E4', fontWeight: 600 }} // Limpa o inline style que tínhamos
                    className={styles.kpiValue} // Aplica a classe de valor
                />
            </Spin>
        </Card>
    );
};