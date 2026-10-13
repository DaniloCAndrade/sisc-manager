import { useMemo, useState } from "react";
import { DOMAIN_META, type Domain, type InventoryCategory } from "@/lib/inventoryPresentation";
import { CategoryCard } from "./CategoryCard";
import { Input } from "antd";
import { Search } from "lucide-react";

type Filter = "all" | Domain;

const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "infra", label: DOMAIN_META.infra.label },
    { key: "workload", label: DOMAIN_META.workload.label },
    { key: "observe", label: DOMAIN_META.observe.label },
    { key: "govern", label: DOMAIN_META.govern.label },
];

interface Props {
    categories: InventoryCategory[];
}

export const CategoryGrid = ({ categories }: Props) => {
    const [filter, setFilter] = useState<Filter>("all");
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        let list = filter === "all" ? categories : categories.filter((c) => c.domain === filter);
        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter(
                (c) =>
                    c.label.toLowerCase().includes(q) ||
                    c.key.toLowerCase().includes(q) ||
                    c.samples.some((s) => s.toLowerCase().includes(q))
            );
        }
        return [...list].sort((a, b) => b.count - a.count);
    }, [categories, filter, query]);

    const maxCount = Math.max(...filtered.map((c) => c.count), 1);

    return (
        <section className="space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="inv-font-display text-xl font-semibold">Categorias de objetos</h2>
                    <p className="text-sm text-invmuted-foreground mt-1">
                        {filtered.length} {filtered.length === 1 ? "categoria" : "categorias"} • clique para detalhar
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 lg:w-auto w-full">
                    <div className="relative flex-1 sm:flex-initial sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-invmuted-foreground z-10 pointer-events-none" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar categoria ou item…"
                            className="pl-9 h-9"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {filters.map((f) => {
                    const active = filter === f.key;
                    return (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={
                                active
                                    ? "inline-flex items-center gap-2 h-8 px-3 rounded-full border text-xs font-medium transition-all border-invprimary/40 bg-invprimary/10 text-invprimary"
                                    : "inline-flex items-center gap-2 h-8 px-3 rounded-full border text-xs font-medium transition-all border-invborder bg-invcard text-invmuted-foreground hover:text-invforeground hover:border-invborder-strong"
                            }
                            style={active ? { boxShadow: 'var(--inv-shadow-glow)' } : undefined}
                        >
                            {f.key !== "all" && (
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: `hsl(var(--inv-domain-${f.key}))` }} />
                            )}
                            {f.label}
                        </button>
                    );
                })}
            </div>

            {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-invborder p-12 text-center">
                    <p className="text-sm text-invmuted-foreground">Nenhuma categoria corresponde à busca.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((c, i) => (
                        <CategoryCard key={c.key} category={c} maxCount={maxCount} index={i} />
                    ))}
                </div>
            )}
        </section>
    );
};