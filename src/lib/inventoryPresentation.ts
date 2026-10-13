// src/lib/inventoryPresentation.ts
//
// Adapta o InventoryResult real (vindo do svc-inventory) para a mesma
// estrutura de dados que os componentes visuais (DashboardHeader, KpiCards,
// CompositionChart, GovernancePanel, CategoryGrid) esperam — assim os
// componentes ficam quase idênticos ao protótipo original, só passam a
// receber os dados via props em vez de importar um mock estático.
//
// ⚠️ Curadoria: mostramos aqui apenas 21 categorias (as mesmas do desenho
// original) organizadas em 4 domínios. O backend coleta ~30 categorias no
// total (API Tokens, Extensions, ActiveGates, Network Zones, SLO, etc.) —
// essas não aparecem nesta visão executiva. Para incluir mais, basta
// adicionar entradas em CATEGORY_DEFS abaixo.

import type { LucideIcon } from "lucide-react";
import {
    Server, Cpu, Network, Globe, Boxes, Container, HardDrive, Cable,
    Activity, Radio, MonitorPlay, LayoutDashboard, Bell, Tags,
    Shield, CalendarClock, MessageSquare, Database, Layers,
} from "lucide-react";
import type { InventoryResult } from "@/services/dynaInventoryService";

export type Domain = "infra" | "workload" | "observe" | "govern";

export interface InventoryCategory {
    key: string;
    label: string;
    count: number;
    samples: string[];
    icon: LucideIcon;
    domain: Domain;
    description: string;
}

export const DOMAIN_META: Record<Domain, { label: string; color: string; description: string }> = {
    infra: { label: "Infraestrutura", color: "domain-infra", description: "Hosts, redes, discos e nós que sustentam o ambiente." },
    workload: { label: "Cargas de trabalho", color: "domain-workload", description: "Processos, serviços e aplicações em execução." },
    observe: { label: "Observabilidade", color: "domain-observe", description: "Dashboards, sintéticos e monitores de experiência." },
    govern: { label: "Governança", color: "domain-govern", description: "Tags, perfis, zonas e políticas de gestão." },
};

// Cada tipo de entidade/config do Dynatrace usa um campo diferente pro nome
// de exibição — tenta na ordem mais provável antes de cair pro id bruto.
function displayNameOf(item: any): string {
    return item?.displayName ?? item?.name ?? item?.entityId ?? item?.id ?? "—";
}

function samplesOf(items: any[] | undefined, limit = 5): string[] {
    return (items ?? []).slice(0, limit).map(displayNameOf);
}

interface CategoryDef {
    key: string;
    label: string;
    domain: Domain;
    icon: LucideIcon;
    description: string;
    // uma ou mais chaves de result.inventory[...] a combinar num único card
    // (ex: os 3 tipos de dashboard do backend viram 1 card "Dashboards" aqui)
    sourceKeys: string[];
}

const CATEGORY_DEFS: CategoryDef[] = [
    { key: "HOST", label: "Hosts", domain: "infra", icon: Server, description: "Servidores físicos e virtuais monitorados", sourceKeys: ["HOST"] },
    { key: "PROCESS_GROUP", label: "Process Groups", domain: "workload", icon: Cpu, description: "Agrupamentos de processos detectados", sourceKeys: ["PROCESS_GROUP"] },
    { key: "SERVICE", label: "Serviços", domain: "workload", icon: Layers, description: "Serviços lógicos instrumentados", sourceKeys: ["SERVICE"] },
    { key: "APPLICATION", label: "Aplicações Web", domain: "workload", icon: Globe, description: "Aplicações Real User Monitoring (RUM)", sourceKeys: ["APPLICATION"] },
    { key: "KUBERNETES_CLUSTER", label: "Clusters Kubernetes", domain: "infra", icon: Boxes, description: "Clusters OpenShift / Kubernetes", sourceKeys: ["KUBERNETES_CLUSTER"] },
    { key: "KUBERNETES_NODE", label: "Nós Kubernetes", domain: "infra", icon: Server, description: "Nós workers e masters dos clusters", sourceKeys: ["KUBERNETES_NODE"] },
    { key: "CLOUD_APPLICATION", label: "Cloud Applications", domain: "workload", icon: Container, description: "Workloads em containers (pods/deployments)", sourceKeys: ["CLOUD_APPLICATION"] },
    { key: "CLOUD_APPLICATION_NAMESPACE", label: "Namespaces", domain: "workload", icon: Boxes, description: "Namespaces Kubernetes monitorados", sourceKeys: ["CLOUD_APPLICATION_NAMESPACE"] },
    { key: "DISK", label: "Discos", domain: "infra", icon: HardDrive, description: "Volumes e montagens detectadas", sourceKeys: ["DISK"] },
    { key: "NETWORK_INTERFACE", label: "Interfaces de rede", domain: "infra", icon: Network, description: "Interfaces de rede dos hosts", sourceKeys: ["NETWORK_INTERFACE"] },
    { key: "SYNTHETIC_TEST", label: "Testes sintéticos", domain: "observe", icon: Activity, description: "Verificações automatizadas de disponibilidade", sourceKeys: ["SYNTHETIC_TEST"] },
    { key: "CUSTOM_DEVICE", label: "Custom Devices", domain: "infra", icon: Radio, description: "Dispositivos customizados via API", sourceKeys: ["CUSTOM_DEVICE"] },
    { key: "DATABASE_SERVICE", label: "Database Services", domain: "workload", icon: Database, description: "Serviços de banco de dados detectados", sourceKeys: ["DATABASE_SERVICE"] },
    { key: "DASHBOARDS", label: "Dashboards", domain: "observe", icon: LayoutDashboard, description: "Painéis criados no tenant", sourceKeys: ["DASHBOARDS_CLASSIC", "DASHBOARDS_GEN3", "NOTEBOOKS"] },
    { key: "SYNTHETIC_MONITORS", label: "Monitores sintéticos", domain: "observe", icon: MonitorPlay, description: "Monitores de jornada e disponibilidade", sourceKeys: ["SYNTHETIC_MONITORS"] },
    { key: "ALERTING_PROFILES", label: "Perfis de alerta", domain: "govern", icon: Bell, description: "Perfis de roteamento de alertas", sourceKeys: ["ALERTING_PROFILES"] },
    { key: "AUTO_TAG_RULES", label: "Regras de Auto-Tag", domain: "govern", icon: Tags, description: "Regras de tagueamento automático", sourceKeys: ["AUTO_TAG_RULES"] },
    { key: "MANAGEMENT_ZONES", label: "Management Zones", domain: "govern", icon: Shield, description: "Zonas de segregação de acesso e visão", sourceKeys: ["MANAGEMENT_ZONES"] },
    { key: "MAINTENANCE_WINDOWS", label: "Janelas de manutenção", domain: "govern", icon: CalendarClock, description: "Janelas planejadas de manutenção", sourceKeys: ["MAINTENANCE_WINDOWS"] },
    { key: "NOTIFICATIONS", label: "Notificações", domain: "govern", icon: MessageSquare, description: "Integrações de notificação ativas", sourceKeys: ["NOTIFICATIONS"] },
    // ⚠️ CABLE ainda não é coletado pelo backend (não está em ENTITY_TYPES do
    // dynaInventoryService.js do svc-inventory) — sempre virá com count 0 até
    // ser adicionado lá. Mantido aqui para bater com o desenho original.
    { key: "CABLE", label: "Cabos lógicos", domain: "infra", icon: Cable, description: "Conexões físicas modeladas", sourceKeys: ["CABLE"] },
];

export function buildCategories(result: InventoryResult): InventoryCategory[] {
    const inv = result.inventory ?? {};
    return CATEGORY_DEFS.map((def) => {
        const items = def.sourceKeys.flatMap((k) => inv[k] ?? []);
        return {
            key: def.key,
            label: def.label,
            domain: def.domain,
            icon: def.icon,
            description: def.description,
            count: items.length,
            samples: samplesOf(items),
        };
    });
}

export function byDomain(categories: InventoryCategory[], d: Domain) {
    return categories.filter((c) => c.domain === d);
}

export function domainTotal(categories: InventoryCategory[], d: Domain) {
    return byDomain(categories, d).reduce((s, c) => s + c.count, 0);
}

export function formatNumber(n: number) {
    return n.toLocaleString("pt-BR");
}

export interface TenantMeta {
    url: string;
    name: string;
    collectedAt: string;
}

export function buildTenantMeta(result: InventoryResult): TenantMeta {
    return {
        url: result.resolvedUrl ?? "",
        name: result.tenant?.label ?? result.tenant?.nome ?? "tenant",
        collectedAt: result.cachedAt ?? result.executedAt,
    };
}