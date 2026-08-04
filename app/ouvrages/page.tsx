import DashboardShell from "@/components/DashboardShell";
import OuvragesIntegratedDashboard from "@/components/ouvrages/OuvragesIntegratedDashboard";

export default function OuvragesPage() {
  return <DashboardShell title="Observatoire intégré des ouvrages" subtitle="Forages CRR et PM, piézomètres, essais de pompage et analyses d’eau">
    <OuvragesIntegratedDashboard />
  </DashboardShell>;
}
