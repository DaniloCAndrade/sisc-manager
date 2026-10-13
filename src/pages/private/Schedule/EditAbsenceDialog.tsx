import { Modal, Form, Select, DatePicker, Input, Divider, Row, Col, Tag, Space, message } from 'antd';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { Absence } from '@/services/absenceService';
import { collaboratorService, type Collaborator } from '@/services/collaboratorService';

const { Option } = Select;
const { TextArea } = Input;

interface EditAbsenceDialogProps {
  visible: boolean;
  onClose: () => void;
  onSave: (updatedAbsence: Partial<Absence>) => void;
  absence: Absence | null;
  mode?: 'edit' | 'create';
}


export function EditAbsenceDialog({
  visible,
  onClose,
  onSave,
  absence,
  mode = 'edit'
}: EditAbsenceDialogProps) {

  const [form] = Form.useForm();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  // const [loading, setLoading] = useState(false);

  const dialogTitle = mode === 'create'
    ? 'Nova Ausência'
    : `Editar Ausência: ${absence?._id ? absence._id.slice(-6) : ''}`;

  // Busca colaboradores
  const buscaColaboradores = () => {
    collaboratorService.getAll()
      .then((response: Collaborator[]) => {
        setCollaborators(response);
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Erro ao carregar colaboradores:', error);
          message.error('Erro ao carregar colaboradores');
        }
      });
  };

  // Carrega os dados do formulário quando o dialog abre
  useEffect(() => {
    if (visible) {
      buscaColaboradores();

      if (mode === 'create') {
        form.resetFields();
        form.setFieldsValue({
          status: 'CRIADO',
          tipo: 'ATESTADO',
        });
      } else if (absence) {
        form.setFieldsValue({
          collaboratorId: absence.collaboratorId,
          tipo: absence.tipo,
          periodoInicio: dayjs(absence.periodo.inicio),
          periodoFim: dayjs(absence.periodo.fim),
          status: absence.status,
          observacao: absence.observacao || '',
        });
        // setSelectedCollaboratorId(absence.collaboratorId as string);
      }
    }
  }, [visible, mode, absence, form]);

  // const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>('');

  const handleSave = () => {
    form.validateFields().then(values => {
      const absenceData: Partial<Absence> = {
        collaboratorId: values.collaboratorId,
        tipo: values.tipo,
        periodo: {
          inicio: values.periodoInicio.toDate(),
          fim: values.periodoFim.toDate(),
        },
        status: values.status,
        observacao: values.observacao || '',
      };

      if (mode === 'edit' && absence?._id) {
        absenceData._id = absence._id;
      }

      onSave(absenceData);
      onClose();
    }).catch(error => {
      console.error('Erro ao validar formulário:', error);
    });
  };

  const onChangeCollaborator = (value: string) => {
    // setSelectedCollaboratorId(value);
    form.setFieldsValue({ collaboratorId: value });
  };

  // Validação de período
  const validatePeriodo = (_: any) => {
    const inicio = form.getFieldValue('periodoInicio');
    const fim = form.getFieldValue('periodoFim');

    if (inicio && fim && fim.isBefore(inicio)) {
      return Promise.reject(new Error('A data de fim não pode ser anterior à data de início'));
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title={dialogTitle}
      open={visible}
      onCancel={onClose}
      onOk={handleSave}
      width={700}
      okText={mode === 'create' ? 'Criar' : 'Salvar'}
      cancelText="Cancelar"
    // confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: 'CRIADO',
          tipo: 'ATESTADO',
        }}
      >
        {/* Seção: Colaborador */}
        <Divider orientation="left">Colaborador</Divider>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="collaboratorId"
              label="Colaborador"
              rules={[{ required: true, message: 'Selecione um colaborador' }]}
            >
              <Select
                placeholder="Selecione o colaborador"
                onChange={onChangeCollaborator}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {collaborators.map(collab => (
                  <Option key={collab._id} value={collab._id}>
                    {collab.nome}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Seção: Tipo e Status */}
        <Divider orientation="left">Informações da Ausência</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="tipo"
              label="Tipo de Ausência"
              rules={[{ required: true, message: 'Selecione o tipo' }]}
            >
              <Select>
                <Option value="ATESTADO">
                  <Space>
                    <Tag color="blue">Atestado</Tag>
                    <span>Médico/odontológico</span>
                  </Space>
                </Option>
                <Option value="FERIAS">
                  <Space>
                    <Tag color="green">Férias</Tag>
                    <span>Período de descanso</span>
                  </Space>
                </Option>
                <Option value="LICENCA">
                  <Space>
                    <Tag color="orange">Licença</Tag>
                    <span>Licença sem vencimento</span>
                  </Space>
                </Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Selecione o status' }]}
            >
              <Select>
                <Option value="CRIADO">
                  <Tag color="default">Criado</Tag>
                </Option>
                <Option value="ACEITO">
                  <Tag color="success">Aceito</Tag>
                </Option>
                <Option value="ERRO">
                  <Tag color="error">Erro</Tag>
                </Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Seção: Período */}
        <Divider orientation="left">Período</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="periodoInicio"
              label="Data de Início"
              rules={[{ required: true, message: 'Informe a data de início' }]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                className="w-full"
                placeholder="Selecione a data de início"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="periodoFim"
              label="Data de Fim"
              rules={[
                { required: true, message: 'Informe a data de fim' },
                { validator: validatePeriodo }
              ]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                className="w-full"
                placeholder="Selecione a data de fim"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Seção: Observação */}
        <Divider orientation="left">Observações</Divider>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="observacao"
              label="Observação"
            >
              <TextArea
                rows={4}
                placeholder="Informações adicionais sobre a ausência (opcional)"
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Resumo */}
        {mode === 'edit' && absence && (
          <div className="bg-gray-50 p-3 rounded-lg mt-4">
            <div className="flex justify-between text-sm">
              <span>Criado em: <strong>{dayjs(absence.criadoEm).format('DD/MM/YYYY HH:mm')}</strong></span>
              <span>Atualizado em: <strong>{dayjs(absence.atualizadoEm).format('DD/MM/YYYY HH:mm')}</strong></span>
            </div>
          </div>
        )}
      </Form>
    </Modal>
  );
}