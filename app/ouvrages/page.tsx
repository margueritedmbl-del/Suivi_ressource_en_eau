import DashboardShell from "@/components/DashboardShell";
import OuvragesIntegratedDashboard from "@/components/ouvrages/OuvragesIntegratedDashboard";

export default function OuvragesPage() {
  return <DashboardShell title="Observatoire intégré des ouvrages" subtitle="Forages CRR et PM, piézomètres, analyses d’eau et micro-barrages réhabilités — Version 4.2.1">
    <OuvragesIntegratedDashboard />
  </DashboardShell>;
}
