/**
 * LicenseDashboardPage.tsx
 *
 * Rota sugerida:
 *   <Route path="/licenciamento" element={<LicenseDashboardPage />} />
 *
 * Mostra DPS + Classic unificados numa grid só, com 4 cards de categoria
 * no topo (clicáveis, funcionam como filtro). Clicar num projeto abre o
 * detalhe (modal ainda não implementado — próximo passo).
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton, Empty, Button, Tooltip, App } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, WarningOutlined, CheckCircleFilled, ClockCircleFilled, HourglassOutlined } from '@ant-design/icons';
import {
    dynaLicenseService,
    getContractStatus,
    type LicenseProject,
    type LicenseSummary,
    type LicenseCategory,
    type ContractStatus,
} from '@/services/dynaLicenseService';
import LicenseDetailModal from './LicenseDetailModal';
import './css/license-theme.css';

const CATEGORY_COLOR_VAR: Record<LicenseCategory, string> = {
    ideal: 'var(--lic-ideal)',
    atencao: 'var(--lic-atencao)',
    critico: 'var(--lic-critico)',
    excedido: 'var(--lic-excedido)',
};

function formatCurrency(value: number, currency: string) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency });
}

// Status distintos de contrato presentes numa categoria — usado pra
// mostrar os ícones agregados no canto do card de resumo (ex: "Atenção"
// pode ter tanto projetos perto de expirar quanto já expirados).
function getCategoryStatuses(categoryKey: LicenseCategory, projects: LicenseProject[]): ContractStatus[] {
    const inCategory = projects.filter((p) => p.category === categoryKey);
    const found = new Set(
        inCategory.map((p) => getContractStatus(p).status).filter((s): s is ContractStatus => !!s)
    );
    // ordem fixa de exibição
    return (['novo', 'atencao', 'expirado'] as ContractStatus[]).filter((s) => found.has(s));
}

function formatNumber(value: number) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(0);
}

function ContractStatusIcon({ status }: { status: ContractStatus | null }) {
    if (status === 'novo') return <CheckCircleFilled style={{ color: 'var(--lic-ideal)' }} />;
    if (status === 'atencao') return <ClockCircleFilled style={{ color: 'var(--lic-atencao)' }} />;
    if (status === 'expirado') return <HourglassOutlined style={{ color: 'var(--lic-excedido)' }} />;
    return null;
}

const CATEGORY_DOT_LEGEND: Record<LicenseCategory, string> = {
    ideal: 'Consumo Ideal',
    atencao: 'Atenção (70% – 90%)',
    critico: 'Crítico (90% – 100%)',
    excedido: 'Excedido (acima de 100%)',
};

/** Bolinha colorida com tooltip de legenda — usada no lugar da barra de
 * progresso pras métricas Classic (Host Units/DDU/DEM/App Security), já
 * que são unidades técnicas, não valor em R$ — uma barra de "gasto" não
 * faz tanto sentido quanto faz pro DPS. */
function CategoryDot({ category }: { category: LicenseCategory | null }) {
    if (!category) return null;
    return (
        <Tooltip title={CATEGORY_DOT_LEGEND[category]}>
            <span
                className="lic-category-dot"
                style={{ background: CATEGORY_COLOR_VAR[category] }}
            />
        </Tooltip>
    );
}

function ProjectCard({ project, onClick }: { project: LicenseProject; onClick: () => void }) {
    const cat = project.category;
    const colorVar = cat ? CATEGORY_COLOR_VAR[cat] : 'var(--lic-primary)';
    const percent = project.percent ?? 0;
    const contractStatus = getContractStatus(project);

    return (
        <div
            className="lic-project-card"
            style={{ '--lic-cat-color': colorVar } as React.CSSProperties}
            onClick={onClick}
        >
            <div className="lic-project-top">
                <p className="lic-project-name">{project.clienteNome}</p>
                <span
                    className={`lic-project-badge ${project.licenseType === 'DPS' ? 'lic-project-badge--dps' : 'lic-project-badge--classic'}`}
                >
                    {project.licenseType === 'DPS' ? 'DPS' : 'Clássico'}
                </span>
            </div>

            {/* ── DPS: valor contratado x consumido ── */}
            {project.dps && (
                <>
                    <div className="lic-project-metric-row">
                        <span>Consumido</span>
                        <span className="lic-project-metric-value">
                            {formatCurrency(project.dps.currentCost, project.dps.currencyCode)}
                        </span>
                    </div>
                    <div className="lic-project-metric-row">
                        <span>Contratado</span>
                        <span className="lic-project-metric-value">
                            {formatCurrency(project.dps.contractValue, project.dps.currencyCode)}
                        </span>
                    </div>
                </>
            )}

            {/* ── Classic: as 4 sub-métricas resumidas (bolinha em vez de barra) ── */}
            {project.classic && (
                <>
                    {project.classic.hostUnits?.quota != null && (
                        <div className="lic-project-metric-row">
                            <span>Host Units</span>
                            <span className="lic-project-metric-value">
                                {formatNumber(project.classic.hostUnits.used)}/{formatNumber(project.classic.hostUnits.quota)}
                                {' '}(<CategoryDot category={project.classic.hostUnits.category} /> {project.classic.hostUnits.percent ?? 0}%)
                            </span>
                        </div>
                    )}
                    {project.classic.ddu?.quota != null && (
                        <div className="lic-project-metric-row">
                            <span>DDU</span>
                            <span className="lic-project-metric-value">
                                {formatNumber(project.classic.ddu.used)}/{formatNumber(project.classic.ddu.quota)}
                                {' '}(<CategoryDot category={project.classic.ddu.category} /> {project.classic.ddu.percent ?? 0}%)
                            </span>
                        </div>
                    )}
                    {project.classic.dem?.quota != null && (
                        <div className="lic-project-metric-row">
                            <span>DEM</span>
                            <span className="lic-project-metric-value">
                                {formatNumber(project.classic.dem.used)}/{formatNumber(project.classic.dem.quota)}
                                {' '}(<CategoryDot category={project.classic.dem.category} /> {project.classic.dem.percent ?? 0}%)
                            </span>
                        </div>
                    )}
                    {project.classic.appSecurity?.quota != null && (
                        <div className="lic-project-metric-row">
                            <span>App Security</span>
                            <span className="lic-project-metric-value">
                                {formatNumber(project.classic.appSecurity.used)}/{formatNumber(project.classic.appSecurity.quota)}
                                {' '}(<CategoryDot category={project.classic.appSecurity.category} /> {project.classic.appSecurity.percent ?? 0}%)
                            </span>
                        </div>
                    )}
                </>
            )}

            {/* Barra de progresso só faz sentido pro DPS (é um valor em R$ gasto
          contra um orçamento contratado) — Classic usa a bolinha colorida
          em cada métrica acima em vez disso. */}
            {project.licenseType === 'DPS' && (
                <div className="lic-progress-track">
                    <div className="lic-progress-fill" style={{ width: `${Math.min(percent, 100)}%` }} />
                </div>
            )}

            <div className="lic-project-footer">
                <span>{cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Sem dados'}</span>
                <span>{percent}%</span>
            </div>

            {contractStatus.status && (
                <div className={`lic-date-chip lic-date-chip--${contractStatus.status}`}>
                    <ContractStatusIcon status={contractStatus.status} />
                    <span>
                        {contractStatus.endDate
                            ? new Date(contractStatus.endDate).toLocaleDateString('pt-BR')
                            : ''}
                    </span>
                    <span className="lic-date-chip-days">
                        {contractStatus.status === 'expirado'
                            ? '(Expirado)'
                            : contractStatus.daysRemaining != null
                                ? `(${contractStatus.daysRemaining} dias)`
                                : ''}
                    </span>
                </div>
            )}

            {project.warning && (
                <div className="lic-warning-chip">
                    <WarningOutlined /> {project.warning}
                </div>
            )}
        </div>
    );
}

export default function LicenseDashboardPage() {
    const navigate = useNavigate();
    const { message } = App.useApp();

    const [projects, setProjects] = useState<LicenseProject[]>([]);
    const [summary, setSummary] = useState<LicenseSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<LicenseCategory | null>(null);
    const [selectedProject, setSelectedProject] = useState<LicenseProject | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const { projects, summary } = await dynaLicenseService.listarTodos();
            setProjects(projects);
            setSummary(summary);
        } catch (err: any) {
            message.error('Não foi possível carregar os dados de licenciamento.');
        } finally {
            setLoading(false);
        }
    }

    const filteredProjects = useMemo(() => {
        if (!activeFilter) return projects;
        return projects.filter((p) => p.category === activeFilter);
    }, [projects, activeFilter]);

    const totalWithCategory = summary.reduce((acc, s) => acc + s.count, 0);

    return (
        <div className="lic-theme">
            {/* ── Header ── */}
            <div className="lic-header">
                <div className="lic-header-left">
                    <Button className="lic-back-btn" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
                        Voltar ao portal
                    </Button>
                    <div>
                        <p className="lic-title">Licenciamento</p>
                        <p className="lic-subtitle">
                            {totalWithCategory} projeto(s) monitorado(s) — DPS e Classic
                        </p>
                    </div>
                </div>
                <Tooltip title="Atualizar">
                    <Button className="lic-back-btn" icon={<ReloadOutlined />} onClick={fetchData} loading={loading} />
                </Tooltip>
            </div>

            {/* ── Cards de categoria (filtro) ── */}
            {loading ? (
                <div className="lic-category-grid">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="lic-category-card lic-skeleton-card">
                            <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="lic-category-grid">
                    {summary.map((s) => (
                        <div
                            key={s.key}
                            className={`lic-category-card ${activeFilter === s.key ? 'lic-category-card--active' : ''}`}
                            style={{ '--lic-cat-color': CATEGORY_COLOR_VAR[s.key] } as React.CSSProperties}
                            onClick={() => setActiveFilter(activeFilter === s.key ? null : s.key)}
                        >
                            <div className="lic-category-card-icons">
                                {getCategoryStatuses(s.key, projects).map((st) => (
                                    <ContractStatusIcon key={st} status={st} />
                                ))}
                            </div>
                            <div className="lic-category-card-label">{s.label}</div>
                            <div className="lic-category-card-count">{s.count}</div>
                            <div className="lic-category-card-hint">
                                {activeFilter === s.key ? 'Clique para limpar filtro' : 'Clique para filtrar'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Grid de projetos ── */}
            {loading ? (
                <div className="lic-project-grid">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="lic-project-card lic-skeleton-card">
                            <Skeleton active paragraph={{ rows: 3 }} />
                        </div>
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="lic-empty">
                    <Empty
                        description={
                            <span style={{ color: 'var(--lic-text-secondary)' }}>
                                {activeFilter
                                    ? 'Nenhum projeto nessa categoria.'
                                    : 'Nenhum projeto de licenciamento encontrado ainda.'}
                            </span>
                        }
                    />
                </div>
            ) : (
                <div className="lic-project-grid">
                    {filteredProjects.map((p) => (
                        <ProjectCard key={p.key} project={p} onClick={() => setSelectedProject(p)} />
                    ))}
                </div>
            )}

            <LicenseDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        </div>
    );
}