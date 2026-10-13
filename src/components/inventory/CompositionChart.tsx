import { DOMAIN_META, byDomain, domainTotal, formatNumber, type Domain, type InventoryCategory } from "@/lib/inventoryPresentation";

const domains: Domain[] = ["infra", "workload", "observe", "govern"];

interface Props {
    categories: InventoryCategory[];
    total: number;
    /** Objetos coletados mas não detalhados nesta visão executiva (ex: API
     * Tokens, Extensions, ActiveGates etc.) — mostrado como faixa separada
     * pra o total sempre bater com o que foi de fato coletado/exportado. */
    othersTotal?: number;
}

export const CompositionChart = ({ categories, total, othersTotal = 0 }: Props) => {
    const grandTotal = total + othersTotal;

    return (
        <section className="rounded-xl border border-invborder bg-invcard p-6" style={{ boxShadow: 'var(--inv-shadow-card)' }}>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="inv-font-display text-xl font-semibold">Composição do ambiente</h2>
                    <p className="text-sm text-invmuted-foreground mt-1">
                        Distribuição de objetos por domínio operacional
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-invmuted-foreground inv-font-mono">Total</div>
                    <div className="inv-font-mono font-semibold tabular-nums text-lg">{formatNumber(grandTotal)}</div>
                </div>
            </div>

            {/* Stacked bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-invmuted mb-6">
                {domains.map((d) => {
                    const pct = grandTotal > 0 ? (domainTotal(categories, d) / grandTotal) * 100 : 0;
                    return (
                        <div
                            key={d}
                            className="h-full transition-all hover:opacity-90"
                            style={{ width: `${pct}%`, background: `hsl(var(--inv-domain-${d}))` }}
                            title={`${DOMAIN_META[d].label}: ${pct.toFixed(1)}%`}
                        />
                    );
                })}
                {othersTotal > 0 && (
                    <div
                        className="h-full transition-all hover:opacity-90"
                        style={{ width: `${(othersTotal / grandTotal) * 100}%`, background: 'hsl(var(--inv-border-strong))' }}
                        title={`Outras categorias: ${((othersTotal / grandTotal) * 100).toFixed(1)}%`}
                    />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {domains.map((d) => {
                    const domTotal = domainTotal(categories, d);
                    const pct = grandTotal > 0 ? (domTotal / grandTotal) * 100 : 0;
                    const cats = byDomain(categories, d).filter((c) => c.count > 0).sort((a, b) => b.count - a.count);
                    return (
                        <div key={d} className="space-y-3">
                            <div className="flex items-baseline justify-between gap-3 pb-2 border-b border-invborder">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full" style={{ background: `hsl(var(--inv-domain-${d}))` }} />
                                    <span className="font-medium text-sm">{DOMAIN_META[d].label}</span>
                                </div>
                                <div className="inv-font-mono text-xs text-invmuted-foreground tabular-nums">
                                    <span className="text-invforeground font-semibold">{formatNumber(domTotal)}</span>
                                    <span className="ml-2">{pct.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {cats.length === 0 && (
                                    <p className="text-xs text-invmuted-foreground">Nenhum objeto neste domínio.</p>
                                )}
                                {cats.map((c) => {
                                    const inner = domTotal > 0 ? (c.count / domTotal) * 100 : 0;
                                    return (
                                        <div key={c.key} className="group">
                                            <div className="flex items-baseline justify-between text-xs mb-1">
                                                <span className="text-invforeground/80 group-hover:text-invforeground transition-colors truncate pr-2">
                                                    {c.label}
                                                </span>
                                                <span className="inv-font-mono tabular-nums text-invmuted-foreground shrink-0">
                                                    {formatNumber(c.count)}
                                                </span>
                                            </div>
                                            <div className="h-1 w-full rounded-full bg-invmuted overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${inner}%`,
                                                        background: `hsl(var(--inv-domain-${d}) / 0.7)`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {othersTotal > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-baseline justify-between gap-3 pb-2 border-b border-invborder">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ background: 'hsl(var(--inv-border-strong))' }} />
                                <span className="font-medium text-sm">Outras categorias</span>
                            </div>
                            <div className="inv-font-mono text-xs text-invmuted-foreground tabular-nums">
                                <span className="text-invforeground font-semibold">{formatNumber(othersTotal)}</span>
                                <span className="ml-2">{((othersTotal / grandTotal) * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                        <p className="text-xs text-invmuted-foreground">
                            API Tokens, Extensions, ActiveGates, SLOs, Automação e outras categorias coletadas —
                            não detalhadas nesta visão executiva, mas incluídas no total e no export completo.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
};