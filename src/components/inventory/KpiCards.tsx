import { formatNumber, type InventoryCategory } from "@/lib/inventoryPresentation";
import { Server, Layers, Globe, Boxes, TrendingUp } from "lucide-react";

interface Props {
    categories: InventoryCategory[];
    total: number;
}

export const KpiCards = ({ categories, total }: Props) => {
    const find = (k: string) => categories.find((c) => c.key === k)?.count ?? 0;

    const kpis = [
        {
            label: "Hosts monitorados",
            value: find("HOST"),
            icon: Server,
            accent: "inv-domain-infra",
            sub: `${find("KUBERNETES_NODE")} nós K8s`,
        },
        {
            label: "Serviços instrumentados",
            value: find("SERVICE"),
            icon: Layers,
            accent: "inv-domain-workload",
            sub: `${formatNumber(find("PROCESS_GROUP"))} process groups`,
        },
        {
            label: "Workloads em containers",
            value: find("CLOUD_APPLICATION"),
            icon: Boxes,
            accent: "inv-domain-workload",
            sub: `${find("CLOUD_APPLICATION_NAMESPACE")} namespaces`,
        },
        {
            label: "Aplicações Web (RUM)",
            value: find("APPLICATION"),
            icon: Globe,
            accent: "inv-domain-observe",
            sub: `${find("SYNTHETIC_MONITORS")} sintéticos ativos`,
        },
    ];

    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((k, i) => {
                const Icon = k.icon;
                const pct = total > 0 ? ((k.value / total) * 100).toFixed(1) : "0.0";
                return (
                    <div
                        key={k.label}
                        className="group relative overflow-hidden rounded-xl border border-invborder bg-invcard p-5 hover:border-invborder-strong transition-all duration-300 animate-fade-in-up"
                        style={{ animationDelay: `${i * 60}ms`, boxShadow: 'var(--inv-shadow-card)' }}
                    >
                        <div
                            className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity"
                            style={{ background: `hsl(var(--${k.accent}))` }}
                        />
                        <div className="flex items-start justify-between mb-4 relative">
                            <div
                                className="h-9 w-9 rounded-lg flex items-center justify-center"
                                style={{
                                    background: `hsl(var(--${k.accent}) / 0.12)`,
                                    color: `hsl(var(--${k.accent}))`,
                                }}
                            >
                                <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] inv-font-mono text-invmuted-foreground">
                                <TrendingUp className="h-3 w-3" />
                                {pct}%
                            </span>
                        </div>

                        <div className="inv-font-display text-3xl md:text-4xl font-semibold tabular-nums leading-none">
                            {formatNumber(k.value)}
                        </div>
                        <div className="mt-2 text-sm text-invforeground/90">{k.label}</div>
                        <div className="mt-1 text-xs text-invmuted-foreground inv-font-mono">{k.sub}</div>
                    </div>
                );
            })}
        </section>
    );
};