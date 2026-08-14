"use client";
import Link from "next/link";
import { useRole } from "@/components/auth/useRole";
import { BUILD_LABEL, PUBLIC_MODULE_ITEMS, INTERNAL_ANALYSIS_ITEMS } from "@/lib/navigation";

export default function DashboardShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const { loading, authenticated, canAccessDashboard, canAccessObservatoire, canAccessReports, canManage } = useRole();
  const items: string[][] = [];

  if (!loading && authenticated && canAccessDashboard) items.push(["/dashboard", "🏠 Dashboard"]);
  items.push(...PUBLIC_MODULE_ITEMS.map(([href,label]) => [href,label]));
  if (!loading && authenticated && canAccessDashboard) items.push(...INTERNAL_ANALYSIS_ITEMS.map(([href,label]) => [href,label]));
  if (!loading && authenticated && canAccessObservatoire) items.push(["/observatoire", "📈 Observatoire"]);
  if (!loading && authenticated && canAccessReports) items.push(["/rapports", "📄 Rapports"]);
  if (!loading && authenticated) items.push(["/mon-compte", "👤 Mon compte"]);
  if (!loading && authenticated && canManage) items.push(["/admin", "⚙️ Administration"]);

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="side-logo">
          <img src="/logos/psore.png" alt="PSORE" />
          <div><strong>PSORE</strong><br /><small>PTCS – Enabel – DNH/DRHK</small></div>
        </div>
        <nav className="side-nav">{items.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}</nav><div className="side-build-version">{BUILD_LABEL}</div>
      </aside>
      <main className="main">
        <div className="main-head">
          <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
          <div className="quick-actions">
            <Link className="btn btn-soft" href="/">Accueil</Link>
            {!authenticated && <Link className="btn btn-primary" href="/login">Connexion</Link>}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
