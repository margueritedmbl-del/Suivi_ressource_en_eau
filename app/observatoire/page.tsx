export const dynamic = "force-dynamic";
import DashboardShell from "@/components/DashboardShell";import ObservatoireDashboard from "@/components/observatoire/ObservatoireDashboard";
export default function Page(){return <DashboardShell title="Observatoire" subtitle="Indicateurs dynamiques des ressources en eau"><ObservatoireDashboard/></DashboardShell>}
