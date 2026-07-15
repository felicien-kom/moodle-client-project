/**
 * Référence API étudiant — devoirs (lecture backend, sans modification serveur).
 * Utiliser ces constantes pour brancher l’interface.
 */

/** Champs Assignment renvoyés par GET /courses/:courseId/assignments */
export const ASSIGNMENT_FIELDS = {
  id: "number — ID local du devoir (utiliser pour draft/submit)",
  courseId: "number",
  name: "string",
  intro: "string | null — HTML consignes",
  activity: "string | null — instructions complémentaires",
  dueDate: "number | null — timestamp Unix (secondes)",
  allowSubmissionsFromDate: "number | null",
  cutoffDate: "number | null",
  requiresText: "boolean — réponse textuelle obligatoire",
  requiresFile: "boolean — fichier(s) obligatoire(s)",
  wordLimit: "number | null — max mots si texte",
  maxFiles: "number | null",
  maxFileSize: "number | null — octets",
  maxGrade: "number | null — note sur (afficher comme gradeMax)",
  introFiles: "LocalFile[] — pièces jointes professeur",
  submissions: "AssignmentSubmission[]",
};

/** Champs soumission (filtrer par moodleUserId côté front) */
export const SUBMISSION_FIELDS = {
  id: "number",
  assignmentId: "number",
  moodleUserId: "number | null",
  submissionText: "string | null — seul champ texte accepté par l’API",
  state: "DRAFT | SUBMITTED | GRADED",
  grade: "number | null",
  feedback: "string | null — commentaire enseignant",
  submittedFiles: "LocalFile[] — fichiers déposés",
};

/** États affichés côté UI (3 statuts + corrigé) */
export const STUDENT_SUBMISSION_UI = {
  notSent: [null, undefined, "NOT_SENT"],
  /** Brouillon = state DRAFT après PUT /draft (reprise possible) */
  draft: ["DRAFT"],
  sent: ["SUBMITTED"],
  graded: ["GRADED"],
  tabTodo: ["NOT_SENT", "DRAFT"],
  tabDone: ["SUBMITTED", "GRADED"],
};

export const ASSIGNMENT_STUDENT_ENDPOINTS = {
  listByCourse: {
    method: "GET",
    path: "/courses/:courseId/assignments",
    response: "{ assignments: Assignment[] }",
  },
  saveDraft: {
    method: "PUT",
    path: "/assignments/:assignmentId/draft",
    contentType: "multipart/form-data",
    body: {
      text: "string — mappé sur submissionText (réponse + remarque combinées côté front)",
    },
    files: "files[] — max selon assignment.maxFiles, taille maxFileSize",
    response: "{ message, submission }",
  },
  submitFinal: {
    method: "POST",
    path: "/assignments/:assignmentId/submit",
    body: "aucun — verrouille la soumission DRAFT existante en SUBMITTED",
    response: "{ message, submission }",
  },
  fileDownload: {
    method: "POST",
    path: "/files/:fileId/download",
  },
  fileServe: {
    method: "GET",
    path: "/files/:fileId/serve",
    usage: "URL blob pour aperçu PDF/image dans le panneau split",
  },
};

/** Séparateur interne front pour joindre réponse + remarque dans `text` */
export const STUDENT_REMARK_SEPARATOR = "\n\n--- Remarque de l'étudiant ---\n";
