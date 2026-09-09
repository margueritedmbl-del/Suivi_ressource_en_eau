"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";

export default function FormsManager() {
  const [forms, setForms] = useState<any[]>([]);
  const [source, setSource] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    authFetch("/api/admin/forms")
      .then((r) => r.json())
      .then((j) => { if (j.ok) { setForms(j.data || []); setSource(j.source || ""); } else setMsg("Erreur : " + j.error); })
      .catch(() => setMsg("Impossible de charger les formulaires."));
  }, []);
  return <div className="panel"><h2>Formulaires Epicollect5</h2><p style={{ color: "#64748b" }}>Source : {source || "—"}. Les liens restent disponibles même avant synchronisation.</p>{msg && <p><strong>{msg}</strong></p>}<table className="table"><thead><tr><th>Module</th><th>Formulaire</th><th>Type</th><th>Accès</th></tr></thead><tbody>{forms.map((f, i) => <tr key={i}><td>{f.module}</td><td>{f.libelle}</td><td>{f.type_source}</td><td><a className="btn btn-soft" href={f.form_url} target="_blank">Ouvrir</a></td></tr>)}</tbody></table></div>;
}
