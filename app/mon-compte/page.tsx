export const dynamic = "force-dynamic";
import DashboardShell from "@/components/DashboardShell";
import RequireAuth from "@/components/auth/RequireAuth";
import AccountPanel from "@/components/auth/AccountPanel";

export default function MonComptePage() {
  return <RequireAuth><DashboardShell title="Mon compte" subtitle="Sécurité, rôle et changement de mot de passe"><AccountPanel /></DashboardShell></RequireAuth>;
}
