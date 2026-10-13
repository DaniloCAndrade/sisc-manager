import { Modal, Form, Input, Switch, Select, TimePicker, DatePicker, InputNumber, Row, Col, Divider, Tag } from 'antd';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { Collaborator, TimeSchema } from '@/services/collaboratorService';

const { Option } = Select;

const regimeOptions = [
  { label: 'Presencial', value: 'PRESENCIAL', color: 'green' },
  { label: 'Remoto', value: 'REMOTO', color: 'blue' },
  { label: 'Híbrido', value: 'HIBRIDO', color: 'purple' },
  { label: 'Indisponível', value: 'INDISPONIVEL', color: 'red' },
  { label: 'Disponivel', value: 'DISPONIVEL', color: 'yellow' },
  { label: 'Eventual', value: 'EVENTUAL', color: 'orange' },
];

const regimeEscalaOptions = [
  { label: 'Presencial', value: 'PRESENCIAL', color: 'green' },
  { label: 'Remoto', value: 'REMOTO', color: 'blue' },
  { label: 'Híbrido', value: 'HIBRIDO', color: 'purple' },
  { label: 'Ausente', value: 'AUSENTE', color: 'red' },
];

const subgrupoOptions = [
  { label: 'Diurno (12x36 — turno dia)', value: 'DIURNO', color: 'blue' },
  { label: 'Noturno (12x36 — turno noite)', value: 'NOTURNO', color: 'purple' },
  { label: 'Fixo (5x2)', value: 'FIXO', color: 'green' },
];

const diasSemana = [
  { nome: 'Domingo', value: 'domingo', abreviado: 'DOM' },
  { nome: 'Segunda', value: 'segunda', abreviado: 'SEG' },
  { nome: 'Terça', value: 'terca', abreviado: 'TER' },
  { nome: 'Quarta', value: 'quarta', abreviado: 'QUA' },
  { nome: 'Quinta', value: 'quinta', abreviado: 'QUI' },
  { nome: 'Sexta', value: 'sexta', abreviado: 'SEX' },
  { nome: 'Sábado', value: 'sabado', abreviado: 'SAB' },
];

interface EditCollaboratorDialogProps {
  visible: boolean;
  onClose: () => void;
  onSave: (updatedCollaborator: Partial<Collaborator>) => void;
  collaborator: Collaborator | null;
  mode?: 'edit' | 'create';
}

const timeToDayjs = (time: TimeSchema): Dayjs =>
  dayjs().hour(time.hora).minute(time.minuto).second(0);

const dayjsToTime = (date: Dayjs | null): TimeSchema => {
  if (!date) return { hora: 0, minuto: 0 };
  return { hora: date.hour(), minuto: date.minute() };
};

const defaultValues = {
  nome: '',
  email: '',
  ativo: true,
  subgrupo: 'FIXO',
  turno: 'CUSTOMIZADO',
  horarioInicio: dayjs().hour(8).minute(0),
  horarioFim: dayjs().hour(18).minute(0),
  tipoEscala: 'CICLICO' as const,
  horasTrabalho: 12,
  horasDescanso: 36,
  inicioCiclo: dayjs().startOf('day'),
  diasTrabalho: 5,
  diasDescanso: 2,
  regimeDomingo: 'DISPONIVEL',
  regimeSegunda: 'PRESENCIAL',
  regimeTerca: 'PRESENCIAL',
  regimeQuarta: 'PRESENCIAL',
  regimeQuinta: 'PRESENCIAL',
  regimeSexta: 'PRESENCIAL',
  regimeSabado: 'DISPONIVEL',
  regime: 'PRESENCIAL',
};

export function EditCollaboratorDialog({
  visible, onClose, onSave, collaborator, mode = 'edit',
}: EditCollaboratorDialogProps) {

  const [form] = Form.useForm();
  const [tipoEscala, setTipoEscala] = useState<'CICLICO' | 'SEMANAL' | 'LIVRE'>('CICLICO');

  const dialogTitle = mode === 'create'
    ? 'Novo Colaborador'
    : `Editar Colaborador: ${collaborator?.nome}`;

  useEffect(() => {
    if (!visible) return;

    if (mode === 'create') {
      form.resetFields();
      form.setFieldsValue(defaultValues);
      setTipoEscala('CICLICO');
      return;
    }

    if (!collaborator) return;
    setTipoEscala(collaborator.escala.tipo as 'CICLICO' | 'SEMANAL');

    const v: any = {
      nome: collaborator.nome,
      email: collaborator.email,
      ativo: collaborator.ativo,
      subgrupo: (collaborator as any).subgrupo ?? 'FIXO',
      turno: collaborator.turno,
      horarioInicio: timeToDayjs(collaborator.horarioTrabalho.inicio),
      horarioFim: timeToDayjs(collaborator.horarioTrabalho.fim),
      tipoEscala: collaborator.escala.tipo,
    };

    if (collaborator.escala.tipo === 'CICLICO' && collaborator.escala.ciclico) {
      v.horasTrabalho = collaborator.escala.ciclico.horasTrabalho;
      v.horasDescanso = collaborator.escala.ciclico.horasDescanso;
      v.inicioCiclo = dayjs(collaborator.escala.ciclico.inicioCiclo);
    } else if (collaborator.escala.tipo === 'SEMANAL' && collaborator.escala.semanal) {
      v.diasTrabalho = collaborator.escala.semanal.diasTrabalho;
      v.diasDescanso = collaborator.escala.semanal.diasDescanso;
      const dias = collaborator.escala.semanal.diasEspecificos;
      if (dias) {
        v.regimeDomingo = dias.domingo || 'HIBRIDO';
        v.regimeSegunda = dias.segunda || 'HIBRIDO';
        v.regimeTerca = dias.terca || 'HIBRIDO';
        v.regimeQuarta = dias.quarta || 'HIBRIDO';
        v.regimeQuinta = dias.quinta || 'HIBRIDO';
        v.regimeSexta = dias.sexta || 'HIBRIDO';
        v.regimeSabado = dias.sabado || 'HIBRIDO';
      }
    }

    if (collaborator.escala?.regime) v.regime = collaborator.escala.regime;
    if (collaborator.horarioTrabalho.intervalo) v.intervalo = timeToDayjs(collaborator.horarioTrabalho.intervalo);
    if (collaborator.horarioTrabalho.intervaloTamanho) v.intervaloTamanho = timeToDayjs(collaborator.horarioTrabalho.intervaloTamanho);

    form.setFieldsValue(v);
  }, [visible, mode, collaborator, form]);

  const handleSave = () => {
    form.validateFields().then(values => {
      const data: Partial<Collaborator> = {
        nome: values.nome,
        email: values.email,
        ativo: values.ativo,
        turno: values.turno,
        // subgrupo via cast pois o tipo base do service ainda não tem o campo
        ...(({ subgrupo: values.subgrupo }) as any),
        horarioTrabalho: {
          inicio: dayjsToTime(values.horarioInicio),
          fim: dayjsToTime(values.horarioFim),
        },
        escala: { tipo: values.tipoEscala, livre: [] },
      };

      if (mode === 'edit' && collaborator?._id) data._id = collaborator._id;

      if (values.tipoEscala === 'CICLICO') {
        data.escala!.ciclico = {
          horasTrabalho: values.horasTrabalho,
          horasDescanso: values.horasDescanso,
          inicioCiclo: values.inicioCiclo.toISOString(),
        };
        data.escala!.regime = values.regime;
      } else if (values.tipoEscala === 'SEMANAL') {
        data.escala!.semanal = {
          diasTrabalho: values.diasTrabalho,
          diasDescanso: values.diasDescanso,
          diasEspecificos: {
            domingo: values.regimeDomingo,
            segunda: values.regimeSegunda,
            terca: values.regimeTerca,
            quarta: values.regimeQuarta,
            quinta: values.regimeQuinta,
            sexta: values.regimeSexta,
            sabado: values.regimeSabado,
          },
          inicioSemana: 'SEGUNDA',
        };
      }

      if (values.intervaloTamanho && data.horarioTrabalho)
        data.horarioTrabalho.intervaloTamanho = dayjsToTime(values.intervaloTamanho);
      if (values.intervalo && data.horarioTrabalho)
        data.horarioTrabalho.intervalo = dayjsToTime(values.intervalo);

      // Garante que subgrupo vai no body
      (data as any).subgrupo = values.subgrupo;

      onSave(data);
      onClose();
    });
  };

  const RegimeSelector = ({ dia, nome, abreviado }: { dia: string; nome: string; abreviado: string }) => (
    <Col span={24} style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 120, fontWeight: 500 }}>
          {nome} <Tag color="blue">{abreviado}</Tag>
        </div>
        <Form.Item
          name={`regime${dia.charAt(0).toUpperCase() + dia.slice(1)}`}
          style={{ marginBottom: 0, flex: 1 }}
        >
          <Select>
            {regimeOptions.map(o => (
              <Option key={o.value} value={o.value}>
                <Tag color={o.color}>{o.label}</Tag>
              </Option>
            ))}
          </Select>
        </Form.Item>
      </div>
    </Col>
  );

  return (
    <Modal
      title={dialogTitle}
      open={visible}
      onCancel={onClose}
      onOk={handleSave}
      width={900}
      okText={mode === 'create' ? 'Criar' : 'Salvar'}
      cancelText="Cancelar"
    >
      <Form form={form} layout="vertical" initialValues={defaultValues}>

        <Divider orientation="left">Informações Básicas</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="nome" label="Nome" rules={[{ required: true, message: 'Nome é obrigatório' }]}>
              <Input placeholder="Nome do colaborador" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item name="ativo" label="Ativo" valuePropName="checked">
              <Switch checkedChildren="Sim" unCheckedChildren="Não" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="turno" label="Turno">
              <Select>
                <Option value="MATUTINO">Matutino</Option>
                <Option value="VESPERTINO">Vespertino</Option>
                <Option value="NOTURNO">Noturno</Option>
                <Option value="INTEGRAL">Integral</Option>
                <Option value="ADMINISTRATIVO">Administrativo</Option>
                <Option value="CUSTOMIZADO">Customizado</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item
              name="subgrupo"
              label="Subgrupo"
              rules={[{ required: true, message: 'Subgrupo é obrigatório' }]}
            >
              <Select placeholder="Selecione o subgrupo">
                {subgrupoOptions.map(o => (
                  <Option key={o.value} value={o.value}>
                    <Tag color={o.color}>{o.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="Email">
              <Input placeholder="E-mail do colaborador" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Horário de Trabalho</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="horarioInicio" label="Horário Início" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" className="w-full" needConfirm={false} showNow={false} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="horarioFim" label="Horário Fim" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" className="w-full" needConfirm={false} showNow={false} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="intervalo" label="Inicio Intervalo">
              <TimePicker format="HH:mm" className="w-full" needConfirm={false} showNow={false} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="intervaloTamanho" label="Duração Intervalo">
              <TimePicker format="HH:mm" className="w-full" needConfirm={false} showNow={false} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Escala</Divider>

        <Form.Item name="tipoEscala" label="Tipo de Escala">
          <Select onChange={v => setTipoEscala(v as any)}>
            <Option value="CICLICO">Cíclica (ex: 12×36, 24×72)</Option>
            <Option value="SEMANAL">Semanal (ex: 5×2, 6×1)</Option>
            <Option value="LIVRE">Livre</Option>
          </Select>
        </Form.Item>

        {tipoEscala === 'CICLICO' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="horasTrabalho" label="Horas de Trabalho" rules={[{ required: true }]}>
                  <InputNumber min={1} max={168} className="w-full" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="horasDescanso" label="Horas de Descanso" rules={[{ required: true }]}>
                  <InputNumber min={1} max={168} className="w-full" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="inicioCiclo" label="Início do Ciclo" rules={[{ required: true }]}>
                  <DatePicker showTime format="DD/MM/YYYY HH:mm" className="w-full" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="regime" label="Regime">
                  <Select>
                    {regimeEscalaOptions.map(o => (
                      <Option key={o.value} value={o.value}>
                        <Tag color={o.color}>{o.label}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <div className="text-sm text-gray-500 mt-2">
              Exemplo: 12×36 significa 12h trabalho, 36h descanso
            </div>
          </div>
        )}

        {tipoEscala === 'SEMANAL' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="diasTrabalho" label="Dias de Trabalho" rules={[{ required: true }]}>
                  <InputNumber min={1} max={7} className="w-full" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="diasDescanso" label="Dias de Descanso" rules={[{ required: true }]}>
                  <InputNumber min={0} max={6} className="w-full" />
                </Form.Item>
              </Col>
            </Row>
            <Divider orientation="left" style={{ margin: '16px 0' }}>Regime por Dia da Semana</Divider>
            <Row>
              {diasSemana.map(dia => (
                <RegimeSelector key={dia.value} dia={dia.value} nome={dia.nome} abreviado={dia.abreviado} />
              ))}
            </Row>
          </div>
        )}

        {tipoEscala === 'LIVRE' && (
          <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
            Escala livre será implementada em breve
          </div>
        )}

      </Form>
    </Modal>
  );
}