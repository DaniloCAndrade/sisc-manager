import { type InventoryCategory } from "@/lib/inventoryPresentation";
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
    categories: InventoryCategory[];
}

export const GovernancePanel = ({ categories }: Props) => {
    const get = (k: string) => categories.find((c) => c.key === k)?.count ?? 0;

    const checks = [
        {
            label: "Perfis de alerta",
            value: get("ALERTING_PROFILES"),
            healthy: get("ALERTING_PROFILES") >= 2,
            hint: "Roteamento de incidentes configurado",
        },
        {
            label: "Regras de Auto-Tag",
            value: get("AUTO_TAG_RULES"),
            healthy: get("AUTO_TAG_RULES") >= 2,
            hint: "Tagueamento automático ativo",
        },
        {
            label: "Management Zones",
            value: get("MANAGEMENT_ZONES"),
            healthy: get("MANAGEMENT_ZONES") >= 5,
            hint: "Segregação de visibilidade por equipe",
        },
        {
            label: "Janelas de manutenção",
            value: get("MAINTENANCE_WINDOWS"),
            healthy: get("MAINTENANCE_WINDOWS") > 0,
            hint: "Suprime alertas em manutenções planejadas",
        },
        {
            label: "Canais de notificação",
            value: get("NOTIFICATIONS"),
            healthy: get("NOTIFICATIONS") >= 1,
            hint: "Integrações para entrega de alertas",
        },
        {
            label: "Dashboards",
            value: get("DASHBOARDS"),
            healthy: get("DASHBOARDS") >= 5,
            hint: "Visões customizadas para equipes",
        },
    ];

    const healthy = checks.filter((c) => c.healthy).length;
    const score = Math.round((healthy / checks.length) * 100);
    const scoreLabel =
        score >= 80 ? "Maduro" : score >= 50 ? "Em evolução" : "Crítico";
    const scoreColor =
        score >= 80 ? "text-invsuccess" : score >= 50 ? "text-invwarning" : "text-invdestructive";

    return (
        <section className="rounded-xl border border-invborder bg-invcard p-6" style={{ boxShadow: 'var(--inv-shadow-card)' }}>
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h2 className="inv-font-display text-xl font-semibold flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-invdomain-govern" />
                        Maturidade de governança
                    </h2>
                    <p className="text-sm text-invmuted-foreground mt-1">
                        Indicadores de configuração e operação do tenant
                    </p>
                </div>
                <div className="text-right">
                    <div className={`inv-font-display text-3xl font-semibold tabular-nums ${scoreColor}`}>
                        {score}<span className="text-base text-invmuted-foreground">/100</span>
                    </div>
                    <div className={`text-xs inv-font-mono uppercase tracking-wider ${scoreColor}`}>{scoreLabel}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {checks.map((c) => {
                    const Icon = c.healthy ? CheckCircle2 : c.value === 0 ? ShieldAlert : AlertTriangle;
                    const color = c.healthy ? "text-invsuccess" : c.value === 0 ? "text-invdestructive" : "text-invwarning";
                    return (
                        <div
                            key={c.label}
                            className="flex items-start gap-3 p-3 rounded-lg border border-invborder bg-invcard-elevated/40 hover:border-invborder-strong transition-colors"
                        >
                            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-sm font-medium truncate">{c.label}</span>
                                    <span className="inv-font-mono text-sm tabular-nums shrink-0">{c.value}</span>
                                </div>
                                <p className="text-xs text-invmuted-foreground mt-0.5">{c.hint}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};