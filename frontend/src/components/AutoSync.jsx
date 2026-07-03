import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { startSync } from "@/services/sync.service";

/**
 * Composant autonome dédié à la synchronisation automatique en arrière-plan.
 * Optimisé pour réduire l'usage réseau, CPU et batterie.
 */
export function AutoSync({ 
  intervalMs = 60000, 
  inactivityLimitMs = 600000 // 10 minutes par défaut avant de passer en veille
}) {
  const { user, isMoodleOnline } = useAuth();
  const isSyncingRef = useRef(false);
  const syncIntervalRef = useRef(null);
  const lastActivityTimeRef = useRef(Date.now());
  const isInactiveRef = useRef(false);

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté ou si Moodle est hors ligne, on ne fait rien
    if (!user || !isMoodleOnline) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    // Enregistrer l'activité utilisateur
    const recordActivity = () => {
      lastActivityTimeRef.current = Date.now();
      if (isInactiveRef.current) {
        console.log("[AutoSync] Activité utilisateur détectée, sortie de veille.");
        isInactiveRef.current = false;
        // Déclencher une synchronisation immédiate après reprise d'activité
        runAutoSync();
      }
    };

    // Écouter les interactions pour détecter l'activité
    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, recordActivity, { passive: true });
    });

    const runAutoSync = async () => {
      if (isSyncingRef.current) return;

      // 1. Optimisation Visibilité : Ne pas syncer si l'onglet est masqué
      if (document.visibilityState !== "visible") {
        console.log("[AutoSync] Onglet invisible. Synchronisation ignorée.");
        return;
      }

      // 2. Optimisation Inactivité : Ne pas syncer si l'utilisateur est inactif depuis longtemps
      const timeSinceLastActivity = Date.now() - lastActivityTimeRef.current;
      if (timeSinceLastActivity >= inactivityLimitMs) {
        if (!isInactiveRef.current) {
          console.log("[AutoSync] Utilisateur inactif. Passage de la synchronisation automatique en veille.");
          isInactiveRef.current = true;
        }
        return;
      }

      console.log("[AutoSync] Lancement de la synchronisation automatique...");
      isSyncingRef.current = true;

      try {
        const result = await startSync();
        console.log("[AutoSync] Synchronisation réussie :", result);
        if (result?.syncId) {
          window.dispatchEvent(new CustomEvent("sync:started", { detail: { syncId: result.syncId } }));
        }
      } catch (error) {
        // En cas de conflit ou de synchronisation déjà en cours (409)
        if (error.status === 409) {
          console.log("[AutoSync] Une synchronisation est déjà en cours d'exécution.");
        } else {
          console.error("[AutoSync] Erreur lors de la synchronisation automatique :", error);
        }
      } finally {
        isSyncingRef.current = false;
      }
    };

    // Lancer la première synchronisation au montage/connexion après un court délai de 5s
    const initialTimeout = setTimeout(() => {
      runAutoSync();
    }, 5000);

    // Mettre en place l'intervalle périodique
    syncIntervalRef.current = setInterval(runAutoSync, intervalMs);

    return () => {
      clearTimeout(initialTimeout);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      activityEvents.forEach((event) => {
        window.removeEventListener(event, recordActivity);
      });
    };
  }, [user, isMoodleOnline, intervalMs, inactivityLimitMs]);

  // Ce composant ne rend aucun élément visuel puisqu'il s'exécute en arrière-plan
  return null;
}

export default AutoSync;
