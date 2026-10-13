import { ExternalLink, Download, ArrowLeft, RefreshCw, ChevronDown, LayoutDashboard, AppWindow, Server } from "lucide-react";
import { Button, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { formatNumber, type TenantMeta } from "@/lib/inventoryPresentation";

interface Props {
    tenant: TenantMeta;
    total: number;
    onBack: () => void;
    onRefresh: () => void;
    isRefreshing: boolean;
    onExportGeral: () => void;
    onExportDashboards: () => void;
    onExportApplications: () => void;
    onExportInfrastructure: () => void;
    isExporting: boolean;
}

export const DashboardHeader = ({
    tenant, total, onBack, onRefresh, isRefreshing,
    onExportGeral, onExportDashboards, onExportApplications, onExportInfrastructure, isExporting,
}: Props) => {
    const date = tenant.collectedAt ? new Date(tenant.collectedAt) : null;
    const formatted = date
        ? date.toLocaleString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "—";

    const exportMenuItems: MenuProps["items"] = [
        { key: "geral", label: "Inventário Geral", icon: <Download className="h-4 w-4" />, onClick: onExportGeral },
        { type: "divider" },
        { key: "dashboards", label: "Dashboards & Notebooks", icon: <LayoutDashboard className="h-4 w-4" />, onClick: onExportDashboards },
        { key: "applications", label: "Aplicações", icon: <AppWindow className="h-4 w-4" />, onClick: onExportApplications },
        { key: "infrastructure", label: "Infraestrutura", icon: <Server className="h-4 w-4" />, onClick: onExportInfrastructure },
    ];

    return (
        <header className="inv-theme relative overflow-hidden border-b border-invborder">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--inv-gradient-glow)' }} />
            <div className="absolute inset-0 inv-grid-bg opacity-30 pointer-events-none" style={{ WebkitMaskImage: 'radial-gradient(ellipse at top, black, transparent 70%)', maskImage: 'radial-gradient(ellipse at top, black, transparent 70%)' }} />

            <div className="relative max-w-350 mx-auto px-6 pt-6">
                <Button type="text" size="small" onClick={onBack} icon={<ArrowLeft className="h-4 w-4" />} className="text-invmuted-foreground">
                    Tenants
                </Button>
            </div>

            <div className="relative max-w-350 mx-auto px-6 py-8 md:py-12">
                <div className="flex items-center gap-2 text-xs inv-font-mono text-invmuted-foreground mb-4">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-invsuccess animate-pulse-dot" />
                        LIVE
                    </span>
                    <span>•</span>
                    <span>DYNATRACE TENANT INVENTORY</span>
                    <span>•</span>
                    <span>v1.0</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <h1 className="inv-font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
                            Inventário do <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--inv-gradient-primary)' }}>{tenant.name}</span>
                        </h1>
                        <p className="text-invmuted-foreground text-base md:text-lg">
                            Visão executiva de todos os objetos monitorados — composição, escala e maturidade
                            operacional do ambiente em um só lugar.
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                            {tenant.url && (
                                <a
                                    href={tenant.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm inv-font-mono text-invprimary hover:text-invprimary-glow transition-colors"
                                >
                                    {tenant.url}
                                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                                </a>
                            )}
                            <span className="text-xs text-invmuted-foreground">Coletado em {formatted}</span>
                        </div>
                    </div>

                    <div className="flex items-stretch gap-3">
                        <div className="rounded-xl border border-invborder-strong bg-invcard-elevated/60 backdrop-blur px-5 py-4 min-w-45" style={{ boxShadow: 'var(--inv-shadow-card)' }}>
                            <div className="text-[10px] uppercase tracking-widest text-invmuted-foreground inv-font-mono">Total geral</div>
                            <div className="inv-font-display font-semibold text-3xl md:text-4xl text-invforeground tabular-nums mt-1">
                                {formatNumber(total)}
                            </div>
                            <div className="text-xs text-invmuted-foreground mt-0.5">objetos monitorados</div>
                        </div>

                        <Button
                            size="large"
                            icon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />}
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            title="Re-executar inventário (ignora cache)"
                            className="h-auto"
                        />

                        <Dropdown menu={{ items: exportMenuItems }} trigger={["click"]} disabled={isExporting}>
                            <Button type="primary" size="large" className="h-auto px-4">
                                <Download className="h-4 w-4" />
                                {isExporting ? "Gerando..." : "Exportar"}
                                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                            </Button>
                        </Dropdown>
                    </div>
                </div>
            </div>
        </header>
    );
};