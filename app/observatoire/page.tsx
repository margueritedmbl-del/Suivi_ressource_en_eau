export const dynamic="force-dynamic";
import DashboardShell from "@/components/DashboardShell";import ObservatoireDashboard from "@/components/observatoire/ObservatoireDashboard";import RequireAuth from "@/components/auth/RequireAuth";import{ROLE_DNH,ROLE_ADMIN,ROLE_SUPER_ADMIN}from"@/lib/permissions";
export default function Page(){return <RequireAuth allowedRoles={[ROLE_DNH,ROLE_ADMIN,ROLE_SUPER_ADMIN]}><DashboardShell title="Observatoire" subtitle="Indicateurs dynamiques des ressources en eau"><ObservatoireDashboard/></DashboardShell></RequireAuth>}
