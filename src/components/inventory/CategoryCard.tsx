import { DOMAIN_META, formatNumber, type InventoryCategory } from "@/lib/inventoryPresentation";
import { ChevronRight } from "lucide-react";

interface Props {
    category: InventoryCategory;
    maxCount: number;
    index: number;
}

export const CategoryCard = ({ category, maxCount, index }: Props) => {
    const Icon = category.icon;
    const isEmpty = category.count === 0;
    const intensity = maxCount > 0 ? Math.sqrt(category.count / maxCount) : 0; // sqrt softens skew
    const domain = DOMAIN_META[category.domain];

    return (
        <article
            className="group relative overflow-hidden rounded-xl border border-invborder bg-invcard hover:border-invborder-strong transition-all duration-300 flex flex-col animate-fade-in-up"
            style={{ animationDelay: `${index * 25}ms` }}
        >
            {/* intensity bar at top */}
            <div className="h-1 w-full bg-invmuted relative overflow-hidden">
                <div
                    className="absolute inset-y-0 left-0 transition-all duration-700"
                    style={{
                        width: `${Math.max(intensity * 100, isEmpty ? 0 : 4)}%`,
                        background: `linear-gradient(90deg, hsl(var(--inv-domain-${category.domain}) / 0.4), hsl(var(--inv-domain-${category.domain})))`,
                    }}
                />
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                                background: `hsl(var(--inv-domain-${category.domain}) / 0.12)`,
                                color: `hsl(var(--inv-domain-${category.domain}))`,
                            }}
                        >
                            <Icon className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-medium text-sm truncate">{category.label}</h3>
                            <div className="text-[10px] uppercase tracking-wider text-invmuted-foreground inv-font-mono mt-0.5">
                                {category.key}
                            </div>
                        </div>
                    </div>

                    <div className="text-right shrink-0">
                        <div className="inv-font-display text-2xl font-semibold tabular-nums leading-none">
                            {formatNumber(category.count)}
                        </div>
                        <div className="text-[10px] text-invmuted-foreground inv-font-mono mt-1">{domain.label}</div>
                    </div>
                </div>

                <p className="text-xs text-invmuted-foreground mb-3 line-clamp-1">
                    {category.description}
                </p>

                {isEmpty ? (
                    <div className="flex-1 flex items-center justify-center py-4 rounded-lg border border-dashed border-invborder">
                        <span className="text-xs text-invmuted-foreground inv-font-mono">— sem itens —</span>
                    </div>
                ) : (
                    <div className="flex-1 space-y-1.5">
                        {category.samples.slice(0, 5).map((s, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 text-xs text-invforeground/75 hover:text-invforeground transition-colors"
                            >
                                <span
                                    className="h-1 w-1 rounded-full shrink-0"
                                    style={{ background: `hsl(var(--inv-domain-${category.domain}) / 0.6)` }}
                                />
                                <span className="truncate inv-font-mono text-[11px]">{s}</span>
                            </div>
                        ))}
                        {category.count > category.samples.length && (
                            <button className="flex items-center gap-1 text-[11px] text-invmuted-foreground hover:text-invprimary transition-colors pt-1.5 inv-font-mono">
                                + {formatNumber(category.count - category.samples.length)} adicionais
                                <ChevronRight className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
};