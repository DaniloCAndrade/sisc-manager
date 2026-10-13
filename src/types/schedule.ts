// ─────────────────────────────────────────────────────────────────
// types/schedule.ts  — tipos alinhados com o novo backend MongoDB
// ─────────────────────────────────────────────────────────────────

export interface TimeSchema {
    hora: number;
    minuto: number;
}

export interface HorarioTrabalhoSchema {
    inicio: TimeSchema;
    fim: TimeSchema;
    intervalo?: TimeSchema;
    intervaloTamanho?: TimeSchema;
}

// ── Collaborator ──────────────────────────────────────────────────
export type SubgrupoType = 'DIURNO' | 'NOTURNO' | 'FIXO';
export type TurnoType = 'MATUTINO' | 'VESPERTINO' | 'NOTURNO' | 'INTEGRAL' | 'ADMINISTRATIVO' | 'CUSTOMIZADO';
export type EscalaTipo = 'SEMANAL' | 'CICLICO' | 'LIVRE';

export interface Collaborator {
    _id?: string;
    nome: string;
    email?: string;
    ativo: boolean;
    subgrupo: SubgrupoType;
    turno: TurnoType;
    horarioTrabalho: HorarioTrabalhoSchema;
    escala: {
        tipo: EscalaTipo;
        semanal?: { diasTrabalho: number; diasDescanso: number; inicioSemana?: string };
        ciclico?: { horasTrabalho: number; horasDescanso: number; inicioCiclo?: string };
        livre?: any[];
        regime?: string;
    };
    observacoes?: string;
    criadoEm?: string;
    atualizadoEm?: string;
}

// ── Absence ───────────────────────────────────────────────────────
export type AbsenceTipo = 'ATESTADO' | 'FERIAS' | 'LICENCA' | 'OUTRO';
export type AbsenceStatus = 'CRIADO' | 'ACEITO' | 'ERRO';

export interface Absence {
    _id?: string;
    collaboratorId: string;
    nome?: string;
    tipo: AbsenceTipo;
    periodo: {
        inicio: string | Date;
        fim?: string | Date | null;
    };
    indeterminate?: boolean;
    substitutionChain?: {
        nightSubId?: string | null;
        nightSubNome?: string;
        dayDirectSubId?: string | null;
        dayDirectSubNome?: string;
    };
    status?: AbsenceStatus;
    observacao?: string;
    criadoEm?: string;
    atualizadoEm?: string;
}

// ── DailySchedule ─────────────────────────────────────────────────
export type SubstitutionType = 'early_sub' | 'late_sub' | 'full_12h' | 'day_to_night_12x36';

export interface ShiftSlot {
    collaboratorId: string;
    nome: string;
    start: string;  // "07:00"
    end: string;  // "19:00"
    absent?: boolean;
}

export interface Substitution {
    collaboratorId: string;
    nome: string;
    start: string;
    end: string;
    hours: number;
    type: SubstitutionType;
    confirmed: boolean;
    auto: boolean;
}

export interface OvernightSlot {
    collaboratorId: string;
    nome: string;
    start: string;
    end: string;
    hours: number;
    programName?: string | null;
}

export interface DailySchedule {
    _id: string;
    data: string;   // ISO date
    ano: number;
    mes: number;
    dia: number;
    diaSemana: string;
    isWeekend: boolean;
    day_shift: ShiftSlot | null;
    night_shift: ShiftSlot | null;
    regular_5x2: ShiftSlot[];
    substitutions: Substitution[];
    overnight_5x2: OvernightSlot | null;
    opening_overnight_5x2: OvernightSlot | null;
    notes: string;
    atualizadoEm?: string;
}

export interface DailyScheduleResponse {
    success: boolean;
    data: DailySchedule[];
    message?: string;
}

// ── Program ───────────────────────────────────────────────────────
export type ProgramTipo = 'commercial' | 'evening' | 'fullnight';

export interface ProgramSlot {
    date: string;
    diaSemana: string;
    slot: 'overnight' | 'opening';
    collaboratorId: string;
    collaborator: string;
    start: string;
    end: string;
    hours: number;
}

export interface Program {
    programName: string;
    totalSlots: number;
    collaborators: string[];
    startDate: string | null;
    endDate: string | null;
    slots: ProgramSlot[];
}