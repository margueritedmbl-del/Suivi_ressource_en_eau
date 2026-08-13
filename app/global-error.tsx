"use client";
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  async function recover(){
    try {
      if ("serviceWorker" in navigator) (await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister());
      if ("caches" in window) for (const n of await caches.keys()) await caches.delete(n);
    } catch {}
    window.location.href = "/?recovered=1";
  }
  return <html lang="fr"><body><div style={{maxWidth:720,margin:"80px auto",padding:28,fontFamily:"Arial"}}><h1>PSORE</h1><h2>Erreur temporaire de l’application</h2><p>Nettoyez les anciennes ressources de navigation puis rechargez la plateforme.</p><button onClick={recover} style={{padding:"12px 18px",fontWeight:700}}>Nettoyer et recharger</button><button onClick={reset} style={{padding:"12px 18px",marginLeft:10}}>Réessayer</button></div></body></html>;
}
