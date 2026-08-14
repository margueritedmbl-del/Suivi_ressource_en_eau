"use client";
import { useEffect } from "react";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("PSORE route error", error); }, [error]);
  async function recover(){
    try {
      if ("serviceWorker" in navigator) (await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister());
      if ("caches" in window) for (const n of await caches.keys()) await caches.delete(n);
    } catch {}
    reset();
  }
  return <div className="auth-gate"><div className="panel"><h2>Erreur d’affichage PSORE</h2><p>Une ressource locale du navigateur peut être obsolète après le déploiement.</p><button className="btn btn-primary" onClick={recover}>Nettoyer le cache et réessayer</button><p className="muted"><small>{error?.message}</small></p></div></div>;
}
