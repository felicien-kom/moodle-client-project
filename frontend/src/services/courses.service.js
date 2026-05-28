
import apiClient from "@/client/apiClient";

/**
 * Service pour gérer les cours
 * Communique avec l'API backend pour récupérer, créer et gérer les cours
 * Pas de mock data — données réelles du backend uniquement
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CRÉATION DE COURS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Crée un nouveau cours localement
 * @param {Object} courseData - Données du cours
 * @param {string} courseData.title - Nom complet du cours
 * @param {string} courseData.shortName - Nom abrégé du cours
 * @param {Array<string>} courseData.categories - Catégories du cours
 * @param {string} courseData.visibilite - Visibilité (Afficher/Masquer)
 * @param {Object} courseData.dateDebut - Date de début { jour, mois, annee, hh, mm }
 * @param {Object} courseData.dateFin - Date de fin { actif, jour, mois, annee, hh, mm }
 * @param {string} courseData.numeroId - N° d'identification
 * @param {string} courseData.resume - Résumé du cours
 * @param {File} courseData.image - Image du cours (optionnel)
 * @returns {Promise<Object>} { course, message }
 */
export async function createLocalCourse(courseData) {
  try {
    // Transformer les données du formulaire en format API
    const formData = new FormData();
    
    // Ajouter les champs texte
    formData.append('title', courseData.nomComplet || courseData.title);
    formData.append('shortName', courseData.nomAbrege || courseData.shortName);
    formData.append('summary', courseData.resume || courseData.summary);
    formData.append('visible', courseData.visibilite === 'Afficher');
    
    // Transformer la date de début
    if (courseData.dateDebut) {
      const startDate = new Date(
        courseData.dateDebut.annee,
        getMonthIndex(courseData.dateDebut.mois),
        parseInt(courseData.dateDebut.jour),
        parseInt(courseData.dateDebut.hh),
        parseInt(courseData.dateDebut.mm)
      );
      formData.append('startDate', Math.floor(startDate.getTime() / 1000));
    }
    
    // Transformer la date de fin si activée
    if (courseData.dateFin && courseData.dateFin.actif) {
      const endDate = new Date(
        courseData.dateFin.annee,
        getMonthIndex(courseData.dateFin.mois),
        parseInt(courseData.dateFin.jour),
        parseInt(courseData.dateFin.hh),
        parseInt(courseData.dateFin.mm)
      );
      formData.append('endDate', Math.floor(endDate.getTime() / 1000));
    }
    
    // Ajouter l'image si présente
    if (courseData.image) {
      formData.append('image', courseData.image);
    }
    
    // Appeler l'endpoint de création
    const response = await apiClient.post('/courses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return {
      course: response.course,
      message: response.message || 'Cours créé avec succès',
    };
  } catch (error) {
    console.error("Erreur lors de la création du cours:", error);
    throw error;
  }
}

/**
 * Convertit le nom du mois en français en index (0-11)
 */
function getMonthIndex(monthName) {
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
  return months.indexOf(monthName.toLowerCase());
}

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

/**
 * Formate les sections du cours pour l'affichage dans l'interface
 * Transforme la structure backend (sections → modules → ressources) en structure UI (sections → items)
 * @param {Array} sections - Sections retournées par le backend avec modules imbriqués
 * @returns {Array} Sections formatées pour l'interface
 */
export function formatSectionsForUI(sections) {
  if (!sections || !Array.isArray(sections)) {
    return [];
  }

  return sections.map((section, idx) => {
    const items = [];

    // Parcourir les modules de la section
    if (section.modules && Array.isArray(section.modules)) {
      section.modules.forEach((module) => {
        // FileResource (fichiers individuels)
        if (module.fileResources && Array.isArray(module.fileResources)) {
          module.fileResources.forEach((fileResource) => {
            if (fileResource.files && Array.isArray(fileResource.files)) {
              fileResource.files.forEach((file) => {
                items.push({
                  type: "file",
                  nom: fileResource.name || file.filename || "Fichier",
                  detail: file.fileSize 
                    ? `${(file.fileSize / 1024 / 1024).toFixed(1)} Mo` 
                    : "Fichier",
                  fileData: file,
                  resourceId: fileResource.id,
                });
              });
            }
          });
        }

        // FolderResource (dossiers avec fichiers) - Traité comme un item distinct
        if (module.folderResources && Array.isArray(module.folderResources)) {
          module.folderResources.forEach((folderResource) => {
            items.push({
              type: "folder",
              nom: folderResource.name || "Dossier",
              detail: folderResource.intro ? folderResource.intro.substring(0, 60) + "..." : `${folderResource.files?.length || 0} fichiers`,
              folderData: folderResource,
              folderId: folderResource.id,
              files: folderResource.files || [],
            });
          });
        }

        // ExternalUrl (liens externes)
        if (module.externalUrls && Array.isArray(module.externalUrls)) {
          module.externalUrls.forEach((externalUrl) => {
            items.push({
              type: "link",
              nom: externalUrl.name || "Lien externe",
              detail: "URL externe",
              urlData: externalUrl,
              url: externalUrl.externalUrl || externalUrl.url,
            });
          });
        }

        // Assignment (devoirs)
        if (module.assignments && Array.isArray(module.assignments)) {
          module.assignments.forEach((assignment) => {
            const dueDate = assignment.dueDate
              ? new Date(assignment.dueDate * 1000).toLocaleDateString('fr-FR')
              : "Sans date";
            items.push({
              type: "assign",
              nom: assignment.name || "Devoir",
              detail: `Échéance: ${dueDate}`,
              assignmentData: assignment,
            });
          });
        }
      });
    }

    return {
      id: section.id || `section-${idx}`,
      titre: section.name || section.title || `Section ${idx + 1}`,
      items: items.length > 0 ? items : [{
        type: "link",
        nom: "Pas de contenu",
        detail: "Aucune ressource pour cette section"
      }],
      isFinal: section.name?.toLowerCase().includes("évaluation") || 
               section.name?.toLowerCase().includes("final") ||
               section.name?.toLowerCase().includes("exam"),
    };
  });
}

/**
 * Récupère les fichiers téléchargés en cache local
 * @returns {Promise<Set<string>>} Set d'URLs de fichiers téléchargés
 */
export async function getDownloadedFiles() {
  try {
    const dbName = "downloaded_files";
    const request = indexedDB.open(dbName, 1);
    
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("files", "readonly");
        const store = transaction.objectStore("files");
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const urls = new Set(getAllRequest.result.map(item => item.url));
          resolve(urls);
        };
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
    });
  } catch {
    return new Set();
  }
}

/**
 * Vérifie si un fichier est téléchargé
 * @param {string} fileUrl - URL du fichier
 * @returns {Promise<boolean>} true si téléchargé
 */
export async function isFileDownloaded(fileUrl) {
  const downloadedFiles = await getDownloadedFiles();
  return downloadedFiles.has(fileUrl);
}

/**
 * Crée une nouvelle section pour un cours
 * @param {number} courseId - L'ID local du cours
 * @param {string} sectionName - Le nom de la section
 * @returns {Promise<Object>} La section créée
 */
export async function createSection(courseId, sectionName) {
  if (!courseId) {
    throw new Error("courseId est requis");
  }
  if (!sectionName) {
    throw new Error("sectionName est requis");
  }

  try {
    const response = await apiClient.post(`/courses/${courseId}/sections`, {
      name: sectionName,
    });
    return response.section;
  } catch (error) {
    console.error(`Erreur lors de la création de la section pour le cours ${courseId}:`, error);
    throw error;
  }
}

// LEGACY MOCK DATA (DEPRECATED - DO NOT USE)
// Tous les appels à la base de données doivent utiliser les fonctions ci-dessus
// qui communiquent avec l'API backend
