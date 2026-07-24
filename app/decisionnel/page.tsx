export const dynamic = "force-dynamic";
import DashboardShell from "@/components/DashboardShell";
import RequireAuth from "@/components/auth/RequireAuth";
import DecisionSupportDashboard from "@/components/decisionnel/DecisionSupportDashboard";
export default function Page(){return <RequireAuth><DashboardShell title="SIG décisionnel" subtitle="Géotraitements, impact des restaurations et scénarios d’aide à la décision"><DecisionSupportDashboard/></DashboardShell></RequireAuth>}
