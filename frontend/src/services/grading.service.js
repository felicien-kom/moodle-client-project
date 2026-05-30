import apiClient from "@/client/apiClient";

function parseApiError(errorData, status) {
  if (!errorData) return `Erreur serveur ${status}`;
  if (typeof errorData.message === "string") return errorData.message;
  if (typeof errorData.error === "string") return errorData.error;
  if (Array.isArray(errorData.errors)) return errorData.errors.join(" ");
  return `Erreur serveur ${status}`;
}

export async function getGradedSubmissions() {
  try {
    const data = await apiClient.get("/submissions");
    return data?.grades || [];
  } catch (error) {
    console.warn("Impossible de charger les notes:", error);
    return [];
  }
}

/**
 * PUT /submissions/:submissionId/grade
 * Rôle requis : TEACHER ou ADMIN
 */
export async function gradeSubmission(submissionId, { grade, feedback = "" }) {
  try {
    const data = await apiClient.put(`/submissions/${submissionId}/grade`, {
      body: { grade, feedback },
    });
    const message =
      data?.message && /enregistrée|saved|grade/i.test(data.message)
        ? "Note enregistrée. Elle sera synchronisée avec Moodle."
        : data?.message || "Note enregistrée.";
    return { ...data, message };
  } catch (error) {
    const msg =
      error?.data?.errors?.join?.(" ") ||
      parseApiError(error?.data, error?.status) ||
      error?.message ||
      "Impossible d'enregistrer la note.";
    throw new Error(msg);
  }
}
