"use client";
import { useRole } from "@/components/auth/useRole";

export default function ProtectedActions({ formUrl, syncUrl, exportModule }: { formUrl: string; syncUrl: string; exportModule: string }) {
  const { role, loading, canSync, canExportCsvXlsx, canExportAdvanced } = useRole();
  const operateCls = canSync ? "btn btn-primary" : "btn btn-primary disabled-action";
  const exportCls = canExportCsvXlsx ? "btn btn-soft" : "btn btn-soft disabled-action";
  const advancedCls = canExportAdvanced ? "btn btn-soft" : "btn btn-soft disabled-action";

  return <div>
    <p><span className="role-badge">Rôle : {loading ? "chargement..." : role}</span></p>
    {!loading && !canSync && <div className="notice-empty">Accès public/consultation : les formulaires, synchronisations et exports sont réservés aux rôles Administrateur PTCS et DNH/DRHK.</div>}
    <div className="quick-actions">
      {canSync && <a className={operateCls} href={formUrl} target="_blank">Ouvrir formulaire</a>}
      {canSync && <a className="btn btn-soft" href={syncUrl} target="_blank">Synchroniser</a>}
      {canExportCsvXlsx && ["csv", "xlsx"].map(f => <a key={f} className={exportCls} href={`/api/reports/export?module=${exportModule}&format=${f}`} target="_blank">{f.toUpperCase()}</a>)}
      {canExportAdvanced && ["docx", "pdf"].map(f => <a key={f} className={advancedCls} href={`/api/reports/export?module=${exportModule}&format=${f}`} target="_blank">{f.toUpperCase()}</a>)}
    </div>
  </div>;
}
