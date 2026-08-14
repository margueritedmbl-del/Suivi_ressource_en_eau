"use client";

import { useEffect } from "react";
import { BUILD_VERSION } from "@/lib/navigation";

/**
 * Neutralise les anciens service workers/caches PWA qui peuvent servir des
 * bundles Next.js obsolètes après un déploiement Render.
 */
export default function StartupRecovery() {
  useEffect(() => {
    const key = "psore_runtime_version";
    const previous = window.localStorage.getItem(key);
    window.localStorage.setItem(key, BUILD_VERSION);

    (async () => {
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
        if ("caches" in window) {
          const names = await caches.keys();
          await Promise.all(names.filter((n) => /psore|next|workbox|pwa/i.test(n)).map((n) => caches.delete(n)));
        }
        // Une seule recharge contrôlée lors d'un changement de version.
        if (previous && previous !== BUILD_VERSION && !sessionStorage.getItem("psore_version_reloaded")) {
          sessionStorage.setItem("psore_version_reloaded", "1");
          window.location.reload();
        }
      } catch (e) {
        console.warn("PSORE cache recovery:", e);
      }
    })();
  }, []);

  return null;
}
