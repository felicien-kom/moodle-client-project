import apiClient from "@/client/apiClient";

/**
 * Service pour gérer les événements du calendrier
 * Communique avec l'API backend pour récupérer les événements des cours
 */

/**
 * Récupère tous les événements d'un cours spécifique
 * @param {number} courseId - L'ID local du cours
 * @returns {Promise<Array>} Liste des événements formatés
 */
export async function getEventsByCourse(courseId) {
  if (!courseId) {
    throw new Error("courseId est requis");
  }

  try {
    const response = await apiClient.get(`/courses/${courseId}/events`);
    return response.events || [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des événements du cours ${courseId}:`, error);
    throw error;
  }
}

/**
 * Formate les événements du backend pour le calendrier
 * Convertit les timestamps Unix en objets Date et prépare les données
 * @param {Array} backendEvents - Événements bruts du backend
 * @returns {Array} Événements formatés pour le calendrier
 */
export function formatEventsForCalendar(backendEvents) {
  if (!Array.isArray(backendEvents)) {
    return [];
  }

  return backendEvents.map((event) => ({
    id: event.id,
    name: event.name,
    label: event.name, // Pour compatibilité avec Calender.jsx
    description: event.description || "",
    eventType: event.eventType || "course", // "user" | "course" | "site" | "group"
    timeStart: event.timeStart, // Unix timestamp en secondes
    timeDuration: event.timeDuration || 0,
    date: new Date(event.timeStart * 1000), // Convertir en Date JavaScript
    color: event.color || 0, // Index de couleur (0-8)
    courseId: event.courseId,
    serverId: event.server_id,
    syncStatus: event.sync_status,
  }));
}

/**
 * Récupère et formate les événements d'un cours
 * @param {number} courseId - L'ID local du cours
 * @returns {Promise<Array>} Événements formatés
 */
export async function getFormattedEventsByCourse(courseId) {
  const events = await getEventsByCourse(courseId);
  return formatEventsForCalendar(events);
}

/**
 * Regroupe les événements par date (format YYYY-MM-DD)
 * Format attendu par Calender.jsx
 * @param {Array} events - Événements formatés
 * @returns {Object} Objet avec clés YYYY-MM-DD et tableau d'événements
 */
export function groupEventsByDate(events) {
  const grouped = {};

  events.forEach((event) => {
    const date = new Date(event.timeStart * 1000);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push({
      id: event.id,
      label: event.name,
      color: event.color || 0,
      type: event.eventType,
      description: event.description,
    });
  });

  return grouped;
}
