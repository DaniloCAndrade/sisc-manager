/**
 * LicenseDetailModal.tsx
 *
 * Modal de detalhe de um projeto de licenciamento.
 *  - DPS: 2 abas — "Valores" (tabela diária de custo por serviço) e
 *    "Projeção/Estimativa" (extrapolação linear pra 7/15/30 dias, 6 meses, 1 ano).
 *  - Classic: sem abas, sem tabela diária (DDU/DEM não variam tanto dia a
 *    dia quanto custo em R$ — não compensa o detalhamento). Só as 4
 *    métricas (Host Units, DDU, DEM, App Security) com uso/quota/%.
 */

import { useEffect, useState } from 'react';
import { Modal, Tabs, Spin, Alert, Tooltip } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import {
    dynaLicenseService,
    type LicenseProject,
    type LicenseCategory,
    type DpsProjectDetail,
    type DpsProjection,
} from '@/services/dynaLicenseService';
import './css/license-theme.css';

interface Props {
    project: LicenseProject | null;
    onClose: () => void;
}

const PROJECTION_PERIODS = [
    { label: '7 dias', days: 7 },
    { label: '15 dias', days: 15 },
    { label: '30 dias', days: 30 },
    { label: '6 meses', days: 182 },
    { label: '1 ano', days: 365 },
];

function formatCurrency(value: number, currency: string) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency });
}

function formatNumber(value: number) {
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(0);
}

function formatDateShort(iso: string) {
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
}

const CATEGORY_DOT_COLOR: Record<LicenseCategory, string> = {
    ideal: '#22c55e',
    atencao: '#eab308',
    critico: '#f97316',
    excedido: '#ef4444',
};

const CATEGORY_DOT_LEGEND: Record<LicenseCategory, string> = {
    ideal: 'Consumo Ideal',
    atencao: 'Atenção (70% – 90%)',
    critico: 'Crítico (90% – 100%)',
    excedido: 'Excedido (acima de 100%)',
};

/** Bolinha colorida com tooltip — Classic usa isso em vez de barra de
 * progresso (Host Units/DDU/DEM/App Security são unidades técnicas, não
 * valor em R$; barra de "gasto" faz mais sentido só pro DPS). */
function CategoryDot({ category }: { category: LicenseCategory | null }) {
    if (!category) return null;
    return (
        <Tooltip title={CATEGORY_DOT_LEGEND[category]}>
            <span
                style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: CATEGORY_DOT_COLOR[category],
                    marginRight: 4,
                    cursor: 'help',
                }}
            />
        </Tooltip>
    );
}

// ── Pivot da lista de custos diários em tabela (capability x dia) ──
function pivotDailyCost(items: { capabilityName: string; startTime: string; value: number; currencyCode: string }[]) {
    const capabilities: Record<string, { name: string; dailyCosts: Record<string, number>; total: number }> = {};
    const datesSet = new Set<string>();
    const dailyTotals: Record<string, number> = {};
    let grandTotal = 0;
    let currency = 'BRL';

    for (const item of items) {
        const date = item.startTime.split('T')[0];
        datesSet.add(date);
        if (!capabilities[item.capabilityName]) {
            capabilities[item.capabilityName] = { name: item.capabilityName, dailyCosts: {}, total: 0 };
        }
        capabilities[item.capabilityName].dailyCosts[date] = (capabilities[item.capabilityName].dailyCosts[date] || 0) + item.value;
        capabilities[item.capabilityName].total += item.value;
        dailyTotals[date] = (dailyTotals[date] || 0) + item.value;
        grandTotal += item.value;
        currency = item.currencyCode;
    }

    const dates = Array.from(datesSet).sort();
    return { capabilities: Object.values(capabilities).sort((a, b) => b.total - a.total), dates, dailyTotals, grandTotal, currency };
}

// ── Aba "Valores" (DPS) ──
function DpsValoresTab({ project }: { project: LicenseProject }) {
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<DpsProjectDetail | null>(null);

    useEffect(() => {
        if (!project.dps) return;
        setLoading(true);
        // Janela curta (30 dias) só pra tabela diária — o total do período
        // inteiro já aparece nos 3 cards acima (Valor Contratado/Consumido/%),
        // que vêm direto da subscription, não dessa chamada.
        dynaLicenseService
            .getProjectDetail(project.dps.uuid, project.dps.accountUuid, 30)
            .then(setDetail)
            .finally(() => setLoading(false));
    }, [project]);

    if (!project.dps) return null;
    const { contractValue, currentCost, currencyCode } = project.dps;
    const percent = contractValue > 0 ? Math.round((currentCost / contractValue) * 1000) / 10 : 0;

    const pivot = detail ? pivotDailyCost(detail.dailyCost) : null;

    return (
        <div>
            <div className="lic-metric-card-row">
                <div className="lic-metric-card lic-metric-card--ideal">
                    <div className="lic-metric-card-label">Valor Contratado</div>
                    <div className="lic-metric-card-value">{formatCurrency(contractValue, currencyCode)}</div>
                </div>
                <div className="lic-metric-card lic-metric-card--info">
                    <div className="lic-metric-card-label">Valor Consumido</div>
                    <div className="lic-metric-card-value">{formatCurrency(currentCost, currencyCode)}</div>
                </div>
                <div className="lic-metric-card lic-metric-card--warn">
                    <div className="lic-metric-card-label">% Valor Consumido</div>
                    <div className="lic-metric-card-value">{percent}%</div>
                </div>
            </div>

            <div className="lic-modal-section-title">Detalhamento de Consumo por Serviço — Licença DPS</div>

            {loading ? (
                <div className="lic-modal-loading"><Spin /></div>
            ) : !pivot || pivot.capabilities.length === 0 ? (
                <p className="lic-modal-empty-text">Sem dados de consumo nos últimos 30 dias.</p>
            ) : (
                <div className="lic-table-wrapper">
                    <table className="lic-table">
                        <thead>
                            <tr>
                                <th className="lic-table-sticky-col">Serviço</th>
                                {pivot.dates.map((d) => (
                                    <th key={d}>{formatDateShort(d)}</th>
                                ))}
                                <th>Valor Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="lic-table-total-row">
                                <td className="lic-table-sticky-col">Total Consumido por Dia</td>
                                {pivot.dates.map((d) => (
                                    <td key={d}>{formatCurrency(pivot.dailyTotals[d] ?? 0, pivot.currency)}</td>
                                ))}
                                <td>{formatCurrency(pivot.grandTotal, pivot.currency)}</td>
                            </tr>
                            {pivot.capabilities.map((cap) => (
                                <tr key={cap.name}>
                                    <td className="lic-table-sticky-col">{cap.name}</td>
                                    {pivot.dates.map((d) => (
                                        <td key={d}>{formatCurrency(cap.dailyCosts[d] ?? 0, pivot.currency)}</td>
                                    ))}
                                    <td className="lic-table-total-cell">{formatCurrency(cap.total, pivot.currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ── Aba "Projeção/Estimativa" (DPS) ──
function DpsProjecaoTab({ project }: { project: LicenseProject }) {
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [projection, setProjection] = useState<DpsProjection | null>(null);

    useEffect(() => {
        if (!project.dps) return;
        setLoading(true);
        dynaLicenseService
            .getProjectProjection(project.dps.uuid, project.dps.accountUuid, days)
            .then(setProjection)
            .finally(() => setLoading(false));
    }, [project, days]);

    if (!project.dps) return null;
    const currency = project.dps.currencyCode;

    return (
        <div>
            <div className="lic-modal-section-title">Período de Projeção</div>
            <div className="lic-period-btns">
                {PROJECTION_PERIODS.map((p) => (
                    <button
                        key={p.days}
                        className={`lic-period-btn ${days === p.days ? 'lic-period-btn--active' : ''}`}
                        onClick={() => setDays(p.days)}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {loading || !projection ? (
                <div className="lic-modal-loading"><Spin /></div>
            ) : (
                <>
                    <div className="lic-modal-section-title">Status Atual</div>
                    <div className="lic-metric-card-row">
                        <div className="lic-metric-card lic-metric-card--ideal">
                            <div className="lic-metric-card-label">Valor Contratado</div>
                            <div className="lic-metric-card-value">{formatCurrency(projection.contractValue, currency)}</div>
                        </div>
                        <div className="lic-metric-card lic-metric-card--info">
                            <div className="lic-metric-card-label">Consumido até Agora</div>
                            <div className="lic-metric-card-value">{formatCurrency(projection.consumedSoFar, currency)}</div>
                        </div>
                        <div className="lic-metric-card">
                            <div className="lic-metric-card-label">Média Diária</div>
                            <div className="lic-metric-card-value">{formatCurrency(projection.dailyAverage, currency)}</div>
                        </div>
                    </div>

                    <div className="lic-modal-section-title">Projeção para {days} dias</div>
                    <div className="lic-metric-card-row">
                        <div className={`lic-metric-card ${projection.willExceedBudget ? 'lic-metric-card--danger' : ''}`}>
                            <div className="lic-metric-card-label">Valor Projetado</div>
                            <div className="lic-metric-card-value">{formatCurrency(projection.projectedValue, currency)}</div>
                        </div>
                        <div className={`lic-metric-card ${projection.willExceedBudget ? 'lic-metric-card--danger' : ''}`}>
                            <div className="lic-metric-card-label">% do Contrato</div>
                            <div className="lic-metric-card-value">{projection.projectedPercentOfContract}%</div>
                        </div>
                        <div className={`lic-metric-card ${projection.willExceedBudget ? 'lic-metric-card--danger' : ''}`}>
                            <div className="lic-metric-card-label">Excesso Projetado</div>
                            <div className="lic-metric-card-value">
                                {projection.projectedExcess > 0 ? '-' : ''}
                                {formatCurrency(Math.abs(projection.projectedExcess), currency)}
                            </div>
                        </div>
                    </div>

                    {projection.willExceedBudget && (
                        <Alert
                            type="warning"
                            showIcon
                            icon={<WarningOutlined />}
                            message="A projeção indica que o orçamento será excedido neste período!"
                            style={{ marginTop: 8 }}
                        />
                    )}

                    {/* ⚠️ Aviso honesto sobre a limitação do método — pedido explícito
              do usuário: clientes com consumo sazonal (ex: INEP, que só
              debita durante a execução de programas específicos, geralmente
              1-2 semanas, raramente até 1 mês) não são bem representados por
              uma média linear simples. */}
                    <Alert
                        type="info"
                        showIcon
                        style={{ marginTop: 12 }}
                        message="Sobre esta projeção"
                        description="O cálculo usa a média diária de consumo desde o início do período e extrapola linearmente. Para ambientes com uso sazonal (ex: picos apenas durante a execução de programas específicos), essa projeção tende a não refletir bem a realidade — trate como uma estimativa aproximada, não como previsão precisa."
                    />
                </>
            )}
        </div>
    );
}

// ── Detalhe Classic (sem abas, sem tabela diária) ──
function ClassicDetail({ project }: { project: LicenseProject }) {
    if (!project.classic) return null;
    const { hostUnits, ddu, dem, appSecurity, periodStart, periodLikelyExpired, usedFallbackWindow } = project.classic;

    const metrics = [
        { label: 'Host Units', metric: hostUnits },
        { label: 'DDU (Davis Data Units)', metric: ddu },
        { label: 'DEM (Digital Experience Monitoring)', metric: dem },
        { label: 'Application Security Units', metric: appSecurity },
    ].filter((m) => m.metric?.quota != null);

    return (
        <div>
            {periodStart && (
                <p className="lic-modal-period-info">
                    Período de contrato desde {new Date(periodStart).toLocaleDateString('pt-BR')}
                </p>
            )}

            {periodLikelyExpired && (
                <Alert type="warning" showIcon message="Confirmar renovação de contrato — o período cadastrado já passou de ~1 ano." style={{ marginBottom: 16 }} />
            )}
            {usedFallbackWindow && (
                <Alert type="info" showIcon message="Sem data de início de período cadastrada — números calculados numa janela padrão de 30 dias, podem estar subestimados." style={{ marginBottom: 16 }} />
            )}

            <div className="lic-classic-metric-list">
                {metrics.map(({ label, metric }) => (
                    <div key={label} className="lic-classic-metric-row">
                        <div className="lic-classic-metric-top">
                            <span className="lic-classic-metric-label">{label}</span>
                            <span className="lic-classic-metric-value">
                                {formatNumber(metric.used)} / {formatNumber(metric.quota as number)}
                                {' '}(<CategoryDot category={metric.category} /> {metric.percent ?? 0}%)
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function LicenseDetailModal({ project, onClose }: Props) {
    return (
        <Modal
            open={!!project}
            onCancel={onClose}
            footer={null}
            width={760}
            rootClassName="lic-modal-root"
            // Estilo inline direto (prop `styles` do antd v5) — sempre vence
            // qualquer CSS externo, independente de ordem de carregamento no
            // bundle. O CSS em license-theme.css não estava vencendo o cascade
            // por algum motivo (provavelmente ordem de import com o Tailwind),
            // então aqui é a garantia definitiva.
            styles={{
                content: { background: '#171a24', padding: 0, borderRadius: 12 },
                header: { background: '#171a24', borderBottom: '1px solid #2a2e3a', padding: '18px 24px', margin: 0 },
                body: { background: '#171a24', padding: '20px 24px 24px', color: '#f1f5f9' },
                mask: { background: 'rgba(0, 0, 0, 0.7)' },
            }}
            title={
                // Título envolto num div com fundo pintado por dentro (margem
                // negativa "sangra" até a borda do header padrão do antd) — não
                // depende de nenhuma classe do Ant Design conseguir receber
                // background, então nenhum !important externo consegue quebrar isso.
                project && (
                    <div
                        style={{
                            background: '#171a24',
                            margin: '-20px -24px',
                            padding: '20px 24px',
                        }}
                    >
                        <div className="lic-modal-title">
                            <span>{project.clienteNome}</span>
                            <span className={`lic-project-badge ${project.licenseType === 'DPS' ? 'lic-project-badge--dps' : 'lic-project-badge--classic'}`}>
                                {project.licenseType === 'DPS' ? 'DPS' : 'Clássico'}
                            </span>
                        </div>
                    </div>
                )
            }
            destroyOnClose
            closeIcon={<span style={{ color: '#94a3b8', fontSize: 16 }}>✕</span>}
        >
            {/* Mesma tática pro corpo — pinta por dentro em vez de depender do
          .ant-modal-content/.ant-modal-body conseguirem receber background. */}
            <div
                style={{
                    background: '#171a24',
                    color: '#f1f5f9',
                    margin: '-20px -24px -24px',
                    padding: '20px 24px 24px',
                    minHeight: 200,
                    borderRadius: '0 0 12px 12px',
                }}
            >
                {project?.licenseType === 'DPS' && (
                    <Tabs
                        className="lic-tabs"
                        items={[
                            { key: 'valores', label: 'Valores', children: <DpsValoresTab project={project} /> },
                            { key: 'projecao', label: 'Projeção/Estimativa', children: <DpsProjecaoTab project={project} /> },
                        ]}
                    />
                )}
                {project?.licenseType === 'CLASSIC' && <ClassicDetail project={project} />}
            </div>
        </Modal>
    );
}