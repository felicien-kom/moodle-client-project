
import apiClient from "@/client/apiClient";

/**
 * Service pour gérer les cours
 * Communique avec l'API backend pour récupérer, créer et gérer les cours
 * Pas de mock data — données réelles du backend uniquement
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ONLINE (Connexion Moodle requise)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Récupère le catalogue de tous les cours disponibles sur le serveur Moodle
 * Permet la recherche, filtrage par catégorie et pagination
 * @param {Object} options - Options de recherche et pagination
 * @param {string} [options.search=""] - Terme de recherche
 * @param {number} [options.categoryId] - ID de la catégorie pour filtrer
 * @param {number} [options.page=0] - Numéro de page
 * @param {number} [options.perPage=20] - Nombre de cours par page
 * @returns {Promise<Object>} { total, courses }
 */
export async function getCatalogueOnline(options = {}) {
  const { search = "", categoryId, page = 0, perPage = 20 } = options;

  try {
    const response = await apiClient.get("/courses/catalogue", {
      params: {
        search,
        ...(categoryId && { categoryId }),
        page,
        perPage,
      },
    });

    return {
      total: response.total || 0,
      courses: response.courses || [],
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du catalogue:", error);
    throw error;
  }
}

/**
 * S'inscrire à un cours sur le serveur Moodle
 * @param {number} courseServerId - L'ID du cours sur le serveur Moodle
 * @returns {Promise<Object>} { enrollment, message }
 */
export async function enrollCourseOnline(courseServerId) {
  if (!courseServerId) {
    throw new Error("courseServerId est requis");
  }

  try {
    const response = await apiClient.post(`/courses/${courseServerId}/enroll`);
    return response;
  } catch (error) {
    console.error(`Erreur lors de l'inscription au cours ${courseServerId}:`, error);
    throw error;
  }
}

/**
 * Se désinscrire d'un cours sur le serveur Moodle
 * @param {number} courseServerId - L'ID du cours sur le serveur Moodle
 * @returns {Promise<Object>} { message }
 */
export async function unenrollCourseOnline(courseServerId) {
  if (!courseServerId) {
    throw new Error("courseServerId est requis");
  }

  try {
    const response = await apiClient.delete(`/courses/${courseServerId}/enroll`);
    return response;
  } catch (error) {
    console.error(`Erreur lors de la désinscription au cours ${courseServerId}:`, error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OFFLINE (Données locales synchronisées)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Récupère tous les cours locaux disponibles (synchronisés)
 * @returns {Promise<Array>} Liste des cours
 */
export async function getAllLocalCourses() {
  try {
    const response = await apiClient.get("/courses");
    return response.courses || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des cours:", error);
    throw error;
  }
}

/**
 * Récupère un cours spécifique par son ID local
 * @param {number} courseId - L'ID local du cours
 * @returns {Promise<Object>} Les détails du cours
 */
export async function getCourseById(courseId) {
  if (!courseId) {
    throw new Error("courseId est requis");
  }

  try {
    const response = await apiClient.get(`/courses/${courseId}`);
    return response.course;
  } catch (error) {
    console.error(`Erreur lors de la récupération du cours ${courseId}:`, error);
    throw error;
  }
}

/**
 * Récupère tous les devoirs d'un cours
 * @param {number} courseId - L'ID local du cours
 * @returns {Promise<Array>} Liste des devoirs avec leurs soumissions
 */
export async function getAssignmentsByCourse(courseId) {
  if (!courseId) {
    throw new Error("courseId est requis");
  }

  try {
    const response = await apiClient.get(`/courses/${courseId}/assignments`);
    return response.assignments || [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des devoirs du cours ${courseId}:`, error);
    throw error;
  }
}

/**
 * Récupère tous les fichiers et ressources d'un cours
 * @param {number} courseId - L'ID local du cours
 * @returns {Promise<Array>} Liste des fichiers et ressources
 */
export async function getFilesByCourse(courseId) {
  if (!courseId) {
    throw new Error("courseId est requis");
  }

  try {
    const response = await apiClient.get(`/courses/${courseId}/files`);
    return response.files || [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des fichiers du cours ${courseId}:`, error);
    throw error;
  }
}

/**
 * Récupère tous les événements d'un cours
 * @param {number} courseId - L'ID local du cours
 * @returns {Promise<Array>} Liste des événements du calendrier
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
 * Récupère toutes les sections d'un cours (super-endpoint)
 * L'arborescence complète : sections → modules → ressources
 * @param {number} courseId - L'ID local du cours
 * @returns {Promise<Array>} Liste des sections avec modules et ressources imbriqués
 */
export async function getSectionsByCourse(courseId) {
  if (!courseId) {
    throw new Error("courseId est requis");
  }

  try {
    const response = await apiClient.get(`/courses/${courseId}/sections`);
    return response.sections || [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des sections du cours ${courseId}:`, error);
    throw error;
  }
}

/**
 * Récupère toutes les notes d'un cours
 * @param {number} courseId - L'ID local du cours
 * @returns {Promise<Array>} Liste des grades/notes
 */
export async function getGradesByCourse(courseId) {
  if (!courseId) {
    throw new Error("courseId est requis");
  }

  try {
    const response = await apiClient.get(`/courses/${courseId}/grades`);
    return response.grades || [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des notes du cours ${courseId}:`, error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS - Récupération de données complètes
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Récupère toutes les données d'un cours (complet)
 * Inclut : cours, sections, devoirs, fichiers, événements, notes
 * @param {number} courseId - L'ID local du cours
 * @returns {Promise<Object>} Objet contenant toutes les données du cours
 */
export async function getCompleteCourseData(courseId) {
  if (!courseId) {
    throw new Error("courseId est requis");
  }

  try {
    const [course, sections, assignments, files, events, grades] = await Promise.all([
      getCourseById(courseId),
      getSectionsByCourse(courseId),
      getAssignmentsByCourse(courseId),
      getFilesByCourse(courseId),
      getEventsByCourse(courseId),
      getGradesByCourse(courseId),
    ]);

    return {
      course,
      sections,
      assignments,
      files,
      events,
      grades,
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération des données complètes du cours ${courseId}:`, error);
    throw error;
  }
}

/**
 * Récupère tous les cours avec leurs événements
 * @returns {Promise<Array>} Cours avec événements
 */
export async function getAllCoursesWithEvents() {
  try {
    const courses = await getAllLocalCourses();

    const coursesWithEvents = await Promise.all(
      courses.map(async (course) => {
        try {
          const events = await getEventsByCourse(course.id);
          return { ...course, events };
        } catch {
          // Si erreur, retourner le cours sans événements
          return { ...course, events: [] };
        }
      })
    );

    return coursesWithEvents;
  } catch (error) {
    console.error("Erreur lors de la récupération des cours avec événements:", error);
    throw error;
  }
}

// LEGACY MOCK DATA (DEPRECATED - DO NOT USE)
// Tous les appels à la base de données doivent utiliser les fonctions ci-dessus
// qui communiquent avec l'API backend
