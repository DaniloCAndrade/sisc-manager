// components/schedule/EditDailyScheduleDialog.tsx
// Modal de edição de um dia da escala — novo modelo
import { Modal, Select, Input, Divider, Space, Tag, Button, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { DailySchedule, Collaborator, Substitution, OvernightSlot } from '@/types/schedule';

const { TextArea } = Input;
const { Option } = Select;

const SUB_TYPE_LABELS = {
    early_sub: 'Cedo (07h–16h)',
    late_sub: 'Tarde (10h–19h)',
    full_12h: 'Full (07h–19h ou 19h–07h)',
    day_to_night_12x36: '12x36 → Noite (19h–07h)',
};

const SUB_TYPE_TIMES: Record<string, { start: string; end: string; hours: number }> = {
    early_sub: { start: '07:00', end: '16:00', hours: 9 },
    late_sub: { start: '10:00', end: '19:00', hours: 9 },
    full_12h: { start: '07:00', end: '19:00', hours: 12 },
    day_to_night_12x36: { start: '19:00', end: '07:00', hours: 12 },
};

interface EditDailyScheduleDialogProps {
    visible: boolean;
    onClose: () => void;
    onSave: (updated: Partial<DailySchedule>) => void;
    schedule: DailySchedule | null;
    availableCollaborators: Collaborator[];
}

export function EditDailyScheduleDialog({
    visible, onClose, onSave, schedule, availableCollaborators,
}: EditDailyScheduleDialogProps) {
    const [subs, setSubs] = useState<Substitution[]>([]);
    const [notes, setNotes] = useState('');
    const [overnight, setOvernight] = useState<OvernightSlot | null>(null);
    const [dayAbsent, setDayAbsent] = useState(false);
    const [nightAbsent, setNightAbsent] = useState(false);

    useEffect(() => {
        if (!schedule) return;
        setSubs(schedule.substitutions ?? []);
        setNotes(schedule.notes ?? '');
        setOvernight(schedule.overnight_5x2 ?? null);
        setDayAbsent(schedule.day_shift?.absent ?? false);
        setNightAbsent(schedule.night_shift?.absent ?? false);
    }, [schedule]);

    if (!schedule) return null;

    const dateLabel = dayjs(schedule.data).format('DD/MM/YYYY');
    const fixos = availableCollaborators.filter(c => c.subgrupo === 'FIXO');

    const handleSave = () => {
        const updated: Partial<DailySchedule> = {
            _id: schedule._id,
            substitutions: subs,
            notes,
            overnight_5x2: overnight,
        };
        if (schedule.day_shift) updated.day_shift = { ...schedule.day_shift, absent: dayAbsent };
        if (schedule.night_shift) updated.night_shift = { ...schedule.night_shift, absent: nightAbsent };
        onSave(updated);
        onClose();
    };

    const addSub = () => {
        const collab = fixos[0];
        if (!collab) return;
        const type = 'early_sub';
        setSubs(prev => [...prev, {
            collaboratorId: collab._id!,
            nome: collab.nome,
            type,
            ...SUB_TYPE_TIMES[type],
            confirmed: true,
            auto: false,
        }]);
    };

    const updateSub = (i: number, field: string, value: any) => {
        setSubs(prev => prev.map((s, idx) => {
            if (idx !== i) return s;
            if (field === 'collaboratorId') {
                const c = availableCollaborators.find(c => c._id === value);
                return { ...s, collaboratorId: value, nome: c?.nome ?? '' };
            }
            if (field === 'type') {
                return { ...s, type: value, ...SUB_TYPE_TIMES[value] };
            }
            return { ...s, [field]: value };
        }));
    };

    const removeSub = (i: number) => setSubs(prev => prev.filter((_, idx) => idx !== i));

    const setOvernightCollab = (collabId: string) => {
        const c = fixos.find(c => c._id === collabId);
        if (!c) return;
        setOvernight({ collaboratorId: c._id!, nome: c.nome, start: '19:00', end: '07:00', hours: 12, programName: null });
    };

    return (
        <Modal
            title={`Editar escala — ${dateLabel} (${schedule.diaSemana})`}
            open={visible}
            onCancel={onClose}
            onOk={handleSave}
            width={700}
            okText="Salvar"
            cancelText="Cancelar"
        >
            {/* Turnos 12x36 */}
            <Divider orientation="left">Turnos 12x36</Divider>
            <Space direction="vertical" style={{ width: '100%' }}>
                {schedule.day_shift && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Tag color="blue" style={{ minWidth: 80 }}>Dia</Tag>
                        <span style={{ flex: 1 }}>{schedule.day_shift.nome} · {schedule.day_shift.start}–{schedule.day_shift.end}</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Ausente?</span>
                        <Switch checked={dayAbsent} onChange={setDayAbsent} size="small" />
                    </div>
                )}
                {schedule.night_shift && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Tag color="purple" style={{ minWidth: 80 }}>Noite</Tag>
                        <span style={{ flex: 1 }}>{schedule.night_shift.nome} · {schedule.night_shift.start}–{schedule.night_shift.end}</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Ausente?</span>
                        <Switch checked={nightAbsent} onChange={setNightAbsent} size="small" />
                    </div>
                )}
                {!schedule.day_shift && !schedule.night_shift && (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>Nenhum 12x36 escalado hoje</span>
                )}
            </Space>

            {/* Substituições */}
            <Divider orientation="left">
                Substituições
                <Button size="small" icon={<PlusOutlined />} onClick={addSub} style={{ marginLeft: 8 }}>
                    Adicionar
                </Button>
            </Divider>
            <Space direction="vertical" style={{ width: '100%' }}>
                {subs.length === 0 && <span style={{ color: '#94a3b8', fontSize: 12 }}>Sem substituições</span>}
                {subs.map((sub, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Select
                            value={sub.collaboratorId}
                            onChange={v => updateSub(i, 'collaboratorId', v)}
                            style={{ flex: 2 }}
                            showSearch
                            optionFilterProp="children"
                        >
                            {availableCollaborators.map(c => (
                                <Option key={c._id} value={c._id}>
                                    {c.nome} <Tag style={{ marginLeft: 4 }}>{c.subgrupo}</Tag>
                                </Option>
                            ))}
                        </Select>
                        <Select
                            value={sub.type}
                            onChange={v => updateSub(i, 'type', v)}
                            style={{ flex: 2 }}
                        >
                            {Object.entries(SUB_TYPE_LABELS).map(([k, v]) => (
                                <Option key={k} value={k}>{v}</Option>
                            ))}
                        </Select>
                        <Tag>{sub.start}–{sub.end}</Tag>
                        <Button
                            type="text" danger size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeSub(i)}
                        />
                    </div>
                ))}
            </Space>

            {/* Plantão overnight */}
            <Divider orientation="left">Plantão Noturno (Overnight)</Divider>
            <Space>
                <Select
                    value={overnight?.collaboratorId ?? undefined}
                    onChange={setOvernightCollab}
                    placeholder="Selecionar plantonista"
                    style={{ width: 240 }}
                    allowClear
                    onClear={() => setOvernight(null)}
                >
                    {fixos.map(c => <Option key={c._id} value={c._id}>{c.nome}</Option>)}
                </Select>
                {overnight && (
                    <Tag color="orange">{overnight.nome} · {overnight.start}–{overnight.end}</Tag>
                )}
            </Space>

            {/* Observações */}
            <Divider orientation="left">Observações</Divider>
            <TextArea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Observações do dia..."
                maxLength={500}
                showCount
                style={{ marginBottom: 20 }}
            />
        </Modal>
    );
}