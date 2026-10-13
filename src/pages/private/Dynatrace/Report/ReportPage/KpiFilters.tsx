// src/pages/KpiFilters.tsx
import React from 'react';
import { Card, Row, Col, Typography, DatePicker, Select, Button } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import type { TimeRangePickerProps } from 'antd';
import type { RangeValue } from '../../types/dashboardReport';

const { RangePicker } = DatePicker;

const rangePresets: TimeRangePickerProps['presets'] = [
  { label: 'Últimos 7 dias', value: [dayjs().add(-7, 'd'), dayjs()] as [Dayjs, Dayjs] },
  { label: 'Últimos 14 dias', value: [dayjs().add(-14, 'd'), dayjs()] as [Dayjs, Dayjs] },
  { label: 'Últimos 30 dias', value: [dayjs().add(-30, 'd'), dayjs()] as [Dayjs, Dayjs] },
  { label: 'Últimos 90 dias', value: [dayjs().add(-90, 'd'), dayjs()] as [Dayjs, Dayjs] },
];

interface TagOption {
  label: string;
  value: string;
}

interface KpiFiltersProps {
  dateRange: RangeValue;
  loading: boolean;

  tagKey: string;
  tagValue: string;
  tagKeyOptions: TagOption[];
  tagValueOptions: TagOption[];

  onDateChange: (dates: RangeValue) => void;
  onTagKeyChange: (value: string) => void;
  onTagValueChange: (value: string) => void;
  onFetchData: () => void;
}

export const KpiFilters: React.FC<KpiFiltersProps> = ({
  dateRange,
  loading,
  tagKey,
  tagValue,
  tagKeyOptions,
  tagValueOptions,
  onDateChange,
  onTagKeyChange,
  onTagValueChange,
  onFetchData,
}) => {
  return (
    <Card>
      <Row gutter={[16, 16]} align="middle" wrap>
        {/* Período */}
        <Col>
          <Typography.Text strong>Período:</Typography.Text>
        </Col>
        <Col flex="auto">
          <RangePicker
            value={dateRange as any}
            onChange={(values) => onDateChange(values as RangeValue)}
            showTime={{ format: 'HH:mm' }}   // ⬅ só hora:minuto
            format="DD/MM/YYYY HH:mm"       // ⬅ formatação do input
            style={{ width: '100%' }}
            presets={[
              {
                label: <span aria-label="Now ~ EOD">Agora ~ Fim do Dia</span>,
                value: () => [dayjs(), dayjs().endOf('day')],
              },
              ...(rangePresets || []),
            ]}
          />
        </Col>

        {/* Tag key */}
        <Col>
          <Typography.Text strong>Service tag (key):</Typography.Text>
        </Col>
        <Col>
          <Select
            style={{ minWidth: 160 }}
            placeholder="Sem filtro"
            value={tagKey}
            onChange={onTagKeyChange}
            options={tagKeyOptions} // <- aqui vai [{label, value}]
            allowClear
          />
        </Col>

        {/* Tag value */}
        <Col>
          <Typography.Text strong>Service tag (value):</Typography.Text>
        </Col>
        <Col>
          <Select
            style={{ minWidth: 160 }}
            value={tagValue}
            onChange={onTagValueChange}
            options={tagValueOptions}
          />
        </Col>

        <Col>
          <Button type="primary" onClick={onFetchData} loading={loading}>
            Carregar Dados
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default KpiFilters;
