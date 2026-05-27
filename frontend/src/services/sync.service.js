import apiClient from "@/client/apiClient";

/**
 * Service pour gérer la synchronisation des cours
 * Communique avec les endpoints /sync du backend
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SYNCHRONISATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Lance une synchronisation manuelle
 * @param {Object} options - Options de sync
 * @param {boolean} [options.fullSync=false] - Faire une sync complète
 * @param {Array<number>} [options.courseIds] - IDs des cours à syncer (sinon tous)
 * @returns {Promise<Object>} { syncId, message, startedAt }
 */
export async function startSync(options = {}) {
  try {
    const response = await apiClient.post("/sync/start", options);
    return {
      syncId: response.syncId,
      message: response.message || "Synchronisation lancée",
      startedAt: response.startedAt,
    };
  } catch (error) {
    console.error("Erreur lors du lancement de la synchronisation:", error);
    throw error;
  }
}

/**
 * Récupère le statut des synchronisations en cours
 * @returns {Promise<Array>} Liste des syncs en cours
 */
export async function getSyncStatus() {
  try {
    const response = await apiClient.get("/sync/status");
    return response.syncs || [];
  } catch (error) {
    console.error("Erreur lors de la récupération du statut de sync:", error);
    throw error;
  }
}

/**
 * Récupère l'historique des synchronisations
 * @param {Object} options - Options de pagination/filtrage
 * @param {number} [options.limit=50] - Nombre de logs à récupérer
 * @param {number} [options.offset=0] - Décalage pour la pagination
 * @param {string} [options.status] - Filtrer par statut (PENDING, SUCCESS, FAILED)
 * @returns {Promise<Array>} Liste des logs de synchronisation
 */
export async function getSyncLogs(options = {}) {
  try {
    const { limit = 50, offset = 0, status } = options;
    
    const response = await apiClient.get("/sync/logs", {
      params: {
        limit,
        offset,
        ...(status && { status }),
      },
    });
    
    return response.logs || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des logs de sync:", error);
    throw error;
  }
}

/**
 * Souscrit aux mises à jour de progrès d'une synchronisation (SSE)
 * @param {string|number} syncId - L'ID de la synchronisation
 * @param {Object} callbacks - Callbacks pour les événements
 * @param {Function} [callbacks.onProgress] - Appelé à chaque mise à jour de progrès
 * @param {Function} [callbacks.onComplete] - Appelé à la fin de la sync
 * @param {Function} [callbacks.onError] - Appelé en cas d'erreur
 * @param {Function} [callbacks.onMessage] - Appelé pour tout message SSE
 * @returns {Function} Fonction pour fermer la connexion SSE
 */
export function subscribeSyncProgress(syncId, callbacks = {}) {
  const {
    onProgress = () => {},
    onComplete = () => {},
    onError = () => {},
    onMessage = () => {},
  } = callbacks;

  if (!syncId) {
    const error = new Error("syncId est requis");
    onError(error);
    throw error;
  }

  const token = localStorage.getItem("access_token");
  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
  const url = `${baseURL}/sync/${syncId}/progress`;

  let eventSource = null;

  try {
    // Créer une EventSource avec les headers d'authentification
    eventSource = new EventSource(url, {
      withCredentials: true,
    });

    // Ajouter le token dans les headers (EventSource ne les supporte pas directement)
    // Donc on doit utiliser fetch avec ReadableStream à la place
    const controller = new AbortController();

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");

              // Garder la dernière ligne incomplète dans le buffer
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    onMessage(data);

                    if (data.type === "progress") {
                      onProgress(data);
                    } else if (data.type === "complete") {
                      onComplete(data);
                      controller.abort();
                      return;
                    }
                  } catch (err) {
                    console.warn("Erreur parsing SSE:", err);
                  }
                }
              }
            }
          } catch (error) {
            if (error.name !== "AbortError") {
              onError(error);
            }
          }
        };

        processStream();
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          onError(error);
        }
      });

    // Retourner une fonction pour fermer la connexion
    return () => {
      controller.abort();
      if (eventSource) {
        eventSource.close();
      }
    };
  } catch (error) {
    onError(error);
    throw error;
  }
}

/**
 * Récupère l'historique complet des synchronisations avec pagination
 * @param {Object} options - Options
 * @param {number} [options.page=0] - Numéro de page
 * @param {number} [options.perPage=20] - Éléments par page
 * @param {string} [options.status] - Filtrer par statut
 * @returns {Promise<Object>} { logs, total, page, perPage }
 */
export async function getSyncHistoryPaginated(options = {}) {
  try {
    const { page = 0, perPage = 20, status } = options;
    const limit = perPage;
    const offset = page * perPage;

    const logs = await getSyncLogs({ limit, offset, status });

    return {
      logs,
      page,
      perPage,
      total: logs.length, // Note: Le backend devrait retourner le total
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    throw error;
  }
}

/**
 * Récupère le statut de synchronisation plus détaillé
 * @returns {Promise<Object>} Statut détaillé
 */
export async function getSyncStatusDetailed() {
  try {
    const [syncs, logs] = await Promise.all([
      getSyncStatus(),
      getSyncLogs({ limit: 10 }),
    ]);

    const activeSyncs = syncs.filter((s) => s.status === "RUNNING");
    const pendingSyncs = syncs.filter((s) => s.status === "PENDING");
    const lastSync = logs[0];

    return {
      activeSyncs,
      pendingSyncs,
      isRunning: activeSyncs.length > 0,
      lastSync,
      syncs,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du statut détaillé:", error);
    throw error;
  }
}

/**
 * Lance une synchronisation et attend sa fin
 * @param {Object} options - Options de sync
 * @returns {Promise<Object>} Résultat final de la sync
 */
export async function startSyncAndWait(options = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      // Lancer la sync
      const { syncId } = await startSync(options);

      // S'abonner au progrès
      const unsubscribe = subscribeSyncProgress(syncId, {
        onProgress: (data) => {
          console.log("Progrès sync:", data);
        },
        onComplete: (data) => {
          unsubscribe();
          resolve(data);
        },
        onError: (error) => {
          unsubscribe();
          reject(error);
        },
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Récupère les statistiques de synchronisation
 * @returns {Promise<Object>} Stats des syncs
 */
export async function getSyncStatistics() {
  try {
    const logs = await getSyncLogs({ limit: 100 });

    if (!logs || logs.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        successRate: 0,
      };
    }

    const successful = logs.filter((l) => l.status === "SUCCESS").length;
    const failed = logs.filter((l) => l.status === "FAILED").length;
    const pending = logs.filter((l) => l.status === "PENDING").length;

    return {
      total: logs.length,
      successful,
      failed,
      pending,
      successRate: logs.length > 0 ? (successful / logs.length) * 100 : 0,
      averageTime: calculateAverageTime(logs),
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return {
      total: 0,
      successful: 0,
      failed: 0,
      pending: 0,
      successRate: 0,
    };
  }
}

/**
 * Récupère les détails d'une synchronisation spécifique
 * @param {string|number} syncId - L'ID de la synchronisation
 * @returns {Promise<Object>} Détails de la sync
 */
export async function getSyncDetails(syncId) {
  if (!syncId) {
    throw new Error("syncId est requis");
  }

  try {
    const logs = await getSyncLogs();
    const syncLog = logs.find((l) => l.id === syncId);

    if (!syncLog) {
      throw new Error("Synchronisation non trouvée");
    }

    return syncLog;
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails de la sync ${syncId}:`, error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calcule le temps moyen de synchronisation
 * @param {Array} logs - Logs de synchronisation
 * @returns {number} Temps moyen en secondes
 */
function calculateAverageTime(logs) {
  const completedLogs = logs.filter((l) => l.completedAt && l.createdAt);

  if (completedLogs.length === 0) return 0;

  const totalTime = completedLogs.reduce((sum, log) => {
    const start = new Date(log.createdAt).getTime();
    const end = new Date(log.completedAt).getTime();
    return sum + (end - start);
  }, 0);

  return Math.round(totalTime / completedLogs.length / 1000); // Convertir en secondes
}

/**
 * Formate un log de synchronisation pour l'affichage
 * @param {Object} log - Log brut
 * @returns {Object} Log formaté
 */
export function formatSyncLog(log) {
  return {
    id: log.id,
    status: log.status,
    message: log.message,
    createdAt: new Date(log.createdAt).toLocaleString("fr-FR"),
    completedAt: log.completedAt ? new Date(log.completedAt).toLocaleString("fr-FR") : null,
    duration: log.completedAt ? calculateDuration(log.createdAt, log.completedAt) : null,
    pulled: log.pulled || 0,
    pushed: log.pushed || 0,
    conflicts: log.conflicts || 0,
  };
}

/**
 * Calcule la durée entre deux dates
 * @param {string} startDate - Date de début
 * @param {string} endDate - Date de fin
 * @returns {string} Durée formatée
 */
function calculateDuration(startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const seconds = Math.round((end - start) / 1000);

  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

/**
 * Détermine la couleur d'un statut de sync
 * @param {string} status - Statut
 * @returns {string} Classe Tailwind
 */
export function getStatusColor(status) {
  const colors = {
    SUCCESS: "text-green-600 bg-green-50 border-green-200",
    FAILED: "text-red-600 bg-red-50 border-red-200",
    PENDING: "text-yellow-600 bg-yellow-50 border-yellow-200",
    RUNNING: "text-blue-600 bg-blue-50 border-blue-200",
  };
  return colors[status] || colors.PENDING;
}

/**
 * Crée un EventSource pour la connexion SSE (alternative avec EventSource)
 * @param {string} syncId - L'ID de la synchronisation
 * @param {Function} onMessage - Callback pour chaque message
 * @param {Function} onError - Callback pour les erreurs
 * @returns {Object} { close: Function, source: EventSource }
 */
export function createEventSourceConnection(syncId, onMessage = () => {}, onError = () => {}) {
  if (!syncId) {
    throw new Error("syncId est requis");
  }

  const token = localStorage.getItem("access_token");
  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
  const url = `${baseURL}/sync/${syncId}/progress?token=${token}`;

  try {
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.warn("Erreur parsing message SSE:", err);
      }
    };

    eventSource.onerror = (error) => {
      onError(error);
      eventSource.close();
    };

    return {
      close: () => eventSource.close(),
      source: eventSource,
    };
  } catch (error) {
    onError(error);
    throw error;
  }
}
