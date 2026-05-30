import apiClient from "@/client/apiClient";
import { getAllLocalCourses, getAssignmentsByCourse } from "./courses.service";
import { API_CONFIG } from "@/config/api.config";
import { buildHeaders } from "@/utils/api.utils";

/** Retire les balises HTML pour les aperçus de cartes */
export function stripHtml(html) {
  if (!html || typeof html !== "string") return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Devoir remis par l'étudiant (SUBMITTED ou GRADED) */
export function isStudentSubmitted(assignment) {
  const state = assignment?.submission?.state;
  return state === "SUBMITTED" || state === "GRADED";
}

/** Regroupe les devoirs par cours inscrit */
export function groupAssignmentsByCourse(assignments) {
  const map = new Map();

  for (const assignment of assignments) {
    const courseId = assignment.course?.id;
    if (!courseId) continue;

    if (!map.has(courseId)) {
      map.set(courseId, {
        course: assignment.course,
        assignments: [],
      });
    }
    map.get(courseId).assignments.push(assignment);
  }

  return Array.from(map.values()).sort((a, b) =>
    (a.course.title || "").localeCompare(b.course.title || "", "fr")
  );
}

function normalizeAssignment(raw, course, { moodleUserId } = {}) {
  const submissions = raw.submissions || [];
  const userSubmission =
    submissions.find((s) => moodleUserId && s.moodleUserId === moodleUserId) ||
    submissions.find((s) => s.state === "DRAFT" || s.state === "SUBMITTED" || s.state === "GRADED") ||
    submissions[0] ||
    null;

  const submittedCount = submissions.filter(
    (s) => s.state === "SUBMITTED" || s.state === "GRADED"
  ).length;
  const gradedCount = submissions.filter((s) => s.state === "GRADED").length;

  return {
    ...raw,
    course,
    gradeMax: raw.maxGrade ?? raw.gradeMax ?? 20,
    submission: userSubmission
      ? {
          ...userSubmission,
          submittedFiles: userSubmission.submittedFiles || [],
        }
      : null,
    submittedCount,
    gradedCount,
    totalCount: submissions.length,
    allSubmissions: submissions,
  };
}

/**
 * Récupère tous les devoirs de l'utilisateur via les cours locaux synchronisés.
 */
export async function getAllAssignments({ moodleUserId } = {}) {
  try {
    const courses = await getAllLocalCourses();

    const promises = courses.map(async (course) => {
      try {
        const assignments = await getAssignmentsByCourse(course.id);
        if (!assignments?.length) return [];
        return assignments.map((a) => normalizeAssignment(a, course, { moodleUserId }));
      } catch (err) {
        console.warn(`Impossible de charger les devoirs pour le cours ${course.id}`, err);
        return [];
      }
    });

    const results = await Promise.all(promises);
    return results
      .flat()
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate - b.dueDate;
      });
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
 * Remise complète : enregistre le contenu puis passe en SUBMITTED (envoyé à l'enseignant).
 */
export async function submitAssignmentComplete(assignmentId, text, files = []) {
  await submitAssignmentDraft(assignmentId, text, files);
  return submitAssignmentFinal(assignmentId);
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
