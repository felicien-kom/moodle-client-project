import apiClient from "@/client/apiClient";
import { getAllLocalCourses, getAssignmentsByCourse } from "./courses.service";
import { API_CONFIG } from "@/config/api.config";
import { buildHeaders } from "@/utils/api.utils";

/**
 * Récupère tous les devoirs de l'étudiant en interrogeant les devoirs 
 * de tous les cours auxquels il est inscrit localement.
 */
export async function getAllAssignments() {
  try {
    const courses = await getAllLocalCourses();
    
    // Récupération en parallèle pour optimiser
    const promises = courses.map(async (course) => {
      try {
        const assignments = await getAssignmentsByCourse(course.id);
        if (assignments && assignments.length > 0) {
          return assignments.map(a => {
            // Le backend renvoie 'submissions' (tableau) pour les devoirs locaux
            // Pour l'étudiant, on prend généralement la première soumission qui lui appartient
            const submissions = a.submissions || [];
            const userSubmission = submissions.length > 0 ? submissions[0] : null;

            return { 
              ...a, 
              course,
              submission: userSubmission, // Pour la logique étudiante
              // Statistiques calculées pour la vue professeur
              submittedCount: submissions.filter(sub => sub.state === "SUBMITTED" || sub.state === "GRADED").length,
              gradedCount: submissions.filter(sub => sub.state === "GRADED").length,
              totalCount: submissions.length,
              allSubmissions: submissions
            };
          });
        }
      } catch (err) {
        console.warn(`Impossible de charger les devoirs pour le cours ${course.id}`, err);
      }
      return [];
    });
    
    const results = await Promise.all(promises);
    return results.flat();
  } catch (error) {
    console.error("Erreur lors de la récupération de tous les devoirs:", error);
    throw error;
  }
}

/**
 * Sauvegarde un brouillon (Draft) ou soumet les fichiers et texte
 * On utilise fetch natif pour gérer correctement le multipart/form-data
 */
export async function submitAssignmentDraft(assignmentId, text, files = []) {
  const formData = new FormData();
  if (text) formData.append("text", text);
  
  files.forEach(f => {
    formData.append("files", f);
  });
  
  const url = new URL(`${API_CONFIG.baseURL}/assignments/${assignmentId}/draft`);
  
  // On récupère les headers génériques (dont l'auth)
  const headers = buildHeaders(true);
  // Important : Ne PAS définir Content-Type pour laisser le navigateur 
  // injecter le bon boundary boundary=----WebKitFormBoundary...
  delete headers["Content-Type"];

  try {
    const response = await fetch(url.toString(), {
      method: "PUT",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw {
        message: errorData?.message || `Erreur serveur ${response.status}`,
        status: response.status
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error("Erreur d'envoi du devoir:", error);
    throw error;
  }
}

/**
 * Valide et verrouille la soumission définitive au backend
 */
export async function submitAssignmentFinal(assignmentId) {
  try {
    const response = await apiClient.post(`/assignments/${assignmentId}/submit`);
    return response;
  } catch (error) {
    console.error("Erreur de soumission finale:", error);
    throw error;
  }
}
