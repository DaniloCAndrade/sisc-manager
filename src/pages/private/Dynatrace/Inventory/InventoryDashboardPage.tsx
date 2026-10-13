// pages/private/Dynatrace/Inventory/InventoryDashboardPage.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  exportApplicationsWord,
  exportDashboardsWord,
  exportInfrastructureWord,
  exportInventoryWord,
  runInventoryAndWait,
  type InventoryProgress,
  type InventoryResult,
} from "../../../../services/dynaInventoryService";
import { message } from "antd";
import {
  buildCategories,
  buildTenantMeta,
  domainTotal,
  type Domain,
} from "@/lib/inventoryPresentation";
import { DashboardHeader } from "@/components/inventory/DashboardHeader";
import { KpiCards } from "@/components/inventory/KpiCards";
import { CompositionChart } from "@/components/inventory/CompositionChart";
import { GovernancePanel } from "@/components/inventory/GovernancePanel";
import { CategoryGrid } from "@/components/inventory/CategoryGrid";
import "@/components/inventory/inventory-theme.css";

export default function InventoryDashboardPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [result, setResult] = useState<InventoryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRerun, setIsRerun] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<InventoryProgress | undefined>(undefined);

  const tenantState = (location.state as any)?.tenant;

  const loadInventory = useCallback(async (force = false) => {
    if (!tenantId) return;
    force ? setIsRerun(true) : setLoading(true);
    setError(null);
    setProgress(undefined);
    try {
      const data = await runInventoryAndWait(tenantId, force, (p) => setProgress(p));
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar inventário.");
    } finally {
      setLoading(false);
      setIsRerun(false);
      setProgress(undefined);
    }
  }, [tenantId]);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  const categories = useMemo(() => (result ? buildCategories(result) : []), [result]);
  const tenantMeta = useMemo(
    () => (result ? buildTenantMeta(result) : { url: "", name: tenantState?.nome ?? "tenant", collectedAt: "" }),
    [result, tenantState]
  );
  // Total exibido nos cards/percentuais das categorias curadas (as 21 que
  // aparecem detalhadas na tela)
  const curatedTotal = useMemo(() => {
    const domains: Domain[] = ["infra", "workload", "observe", "govern"];
    return domains.reduce((s, d) => s + domainTotal(categories, d), 0);
  }, [categories]);

  // ⚠️ Total REAL e completo do tenant (todas as ~44 categorias coletadas,
  // o mesmo número que sai no export .docx) — usado no "Total geral" do
  // cabeçalho para nunca divergir do que foi de fato entregue ao cliente.
  const grandTotal = result?.summary?.total ?? curatedTotal;
  const othersTotal = Math.max(grandTotal - curatedTotal, 0);

  async function handleExport(kind: "geral" | "dashboards" | "applications" | "infrastructure") {
    if (!tenantId) return;
    setIsExporting(true);
    const labels = {
      geral: "Inventário Geral",
      dashboards: "Dashboards & Notebooks",
      applications: "Aplicações",
      infrastructure: "Infraestrutura",
    };
    try {
      if (kind === "geral") await exportInventoryWord(tenantId);
      if (kind === "dashboards") await exportDashboardsWord(tenantId);
      if (kind === "applications") await exportApplicationsWord(tenantId);
      if (kind === "infrastructure") await exportInfrastructureWord(tenantId);
      message.success(`Relatório de ${labels[kind]} exportado com sucesso.`);
    } catch (e: any) {
      message.error(`Erro ao exportar: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="inv-theme min-h-screen bg-invbackground text-invforeground">
      {loading ? (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
          <Loader2 className="h-8 w-8 text-invprimary animate-spin" />
          <p className="text-invforeground/90 font-medium">
            {progress?.label ? `Coletando ${progress.label}...` : "Executando inventário completo..."}
          </p>
          <p className="text-sm text-invmuted-foreground max-w-sm">
            Isso pode levar alguns minutos em ambientes grandes. Não é preciso ficar nesta tela — pode navegar e voltar depois.
          </p>
          {progress && progress.total > 0 && (
            <div className="w-full max-w-xs h-1.5 rounded-full bg-invmuted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.round((progress.step / progress.total) * 100)}%`, backgroundImage: 'var(--inv-gradient-primary)' }}
              />
            </div>
          )}
        </div>
      ) : error ? (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="h-12 w-12 rounded-full bg-invdestructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-invdestructive" />
          </div>
          <div>
            <p className="font-medium text-invforeground">Falha ao carregar inventário</p>
            <p className="text-sm text-invmuted-foreground mt-1 max-w-sm">{error}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/inventory")}
              className="text-sm text-invmuted-foreground hover:text-invforeground transition-colors"
            >
              Voltar aos tenants
            </button>
            <button
              onClick={() => loadInventory(true)}
              className="text-sm font-medium text-invprimary hover:text-invprimary-glow transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      ) : (
        <>
          <DashboardHeader
            tenant={tenantMeta}
            total={grandTotal}
            onBack={() => navigate("/inventory")}
            onRefresh={() => loadInventory(true)}
            isRefreshing={isRerun}
            onExportGeral={() => handleExport("geral")}
            onExportDashboards={() => handleExport("dashboards")}
            onExportApplications={() => handleExport("applications")}
            onExportInfrastructure={() => handleExport("infrastructure")}
            isExporting={isExporting}
          />

          <main className="max-w-350 mx-auto px-6 py-8 md:py-10 space-y-8 md:space-y-10">
            <KpiCards categories={categories} total={grandTotal} />

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              <div className="xl:col-span-3">
                <CompositionChart categories={categories} total={curatedTotal} othersTotal={othersTotal} />
              </div>
              <div className="xl:col-span-2">
                <GovernancePanel categories={categories} />
              </div>
            </div>

            <CategoryGrid categories={categories} />

            <footer className="pt-6 mt-6 border-t border-invborder flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-invmuted-foreground inv-font-mono">
              <span>Dynatrace Inventory Console — SISC Manager</span>
              <span>© {new Date().getFullYear()} • Painel gerencial</span>
            </footer>
          </main>
        </>
      )}
    </div>
  );
}