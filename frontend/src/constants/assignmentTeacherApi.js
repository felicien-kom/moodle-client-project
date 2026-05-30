/**
 * Référence API enseignant — devoirs & évaluations (lecture backend uniquement).
 * Base : {API_CONFIG.baseURL} ex. http://localhost:5000/api/v1
 * Toutes les routes nécessitent Authorization: Bearer <token> sauf mention contraire.
 */

// ─── Cours (contexte devoirs) ───────────────────────────────────────────────

export const TEACHER_COURSE_ENDPOINTS = {
  listLocal: {
    method: "GET",
    path: "/courses",
    role: "authentifié",
    response: "Course[] — cours synchronisés localement",
    usage: "Liste des cours pour accéder aux devoirs",
  },
  createLocal: {
    method: "POST",
    path: "/courses",
    role: "enseignant",
    contentType: "multipart/form-data",
    body: { image: "file optionnel + champs cours" },
    usage: "Création cours local (hors sync Moodle catalogue)",
  },
  detail: {
    method: "GET",
    path: "/courses/:courseId",
    response: "Course",
  },
  participants: {
    method: "GET",
    path: "/courses/:courseId/participants",
    response: "CourseParticipant[] — fullname, email, role…",
    usage: "Croiser avec les soumissions (noms étudiants)",
  },
  sections: {
    method: "GET",
    path: "/courses/:courseId/sections",
    response: "Section[] avec modules (devoirs, fichiers, URLs)",
    usage: "Édition structure cours (page CourseDetail)",
  },
  grades: {
    method: "GET",
    path: "/courses/:courseId/grades",
    response: "Grade[] — notes globales cours",
    usage: "Vue notes (complément devoirs)",
  },
  files: {
    method: "GET",
    path: "/courses/:courseId/files",
    response: "LocalFile[] — tous fichiers du cours",
  },
  events: {
    method: "GET",
    path: "/courses/:courseId/events",
    response: "CalendarEvent[]",
  },
};

// ─── Devoirs (liste + détail enseignant) ─────────────────────────────────────

export const TEACHER_ASSIGNMENT_ENDPOINTS = {
  listByCourse: {
    method: "GET",
    path: "/courses/:courseId/assignments",
    response: "{ assignments: Assignment[] }",
    include: [
      "introFiles",
      "submissions[]",
      "submissions.submittedFiles[]",
    ],
    usage:
      "Écran Évaluations : cartes devoirs, compteurs remis/à corriger, tableau copies",
  },
};

/** Champs Assignment utiles côté UI enseignant */
export const TEACHER_ASSIGNMENT_FIELDS = {
  id: "number — ID local",
  courseId: "number",
  name: "string",
  intro: "string HTML — consignes",
  activity: "string | null",
  dueDate: "number | null — Unix secondes",
  allowSubmissionsFromDate: "number | null",
  cutoffDate: "number | null",
  requiresText: "boolean",
  requiresFile: "boolean",
  wordLimit: "number | null",
  maxFiles: "number | null",
  maxFileSize: "number | null — octets",
  maxGrade: "number | null — barème (afficher gradeMax)",
  introFiles: "LocalFile[] — pièces jointes consignes",
  submissions: "AssignmentSubmission[] — TOUTES les copies du cours",
};

/** Champs soumission (ligne tableau enseignant) */
export const TEACHER_SUBMISSION_FIELDS = {
  id: "number — utiliser pour PUT /submissions/:id/grade",
  assignmentId: "number",
  moodleUserId: "number | null",
  submissionText: "string | null",
  state: "DRAFT | SUBMITTED | GRADED",
  grade: "number | null",
  feedback: "string | null",
  gradedAt: "number | null",
  submittedFiles: "LocalFile[]",
  sync_status: "string — ne pas afficher en UI si politique sync masquée",
};

/** Statuts affichage enseignant (tableau copies) */
export const TEACHER_SUBMISSION_UI = {
  none: "Pas de soumission / non commencé",
  draft: "Brouillon étudiant (non visible comme remise finale)",
  submitted: "À évaluer",
  graded: "Évalué",
};

// ─── Notation (action principale enseignant) ───────────────────────────────

export const TEACHER_GRADING_ENDPOINTS = {
  gradeSubmission: {
    method: "PUT",
    path: "/submissions/:submissionId/grade",
    role: "TEACHER | ADMIN",
    body: {
      grade: "number — obligatoire, entre 0 et assignment.maxGrade",
      feedback: "string | null — commentaire enseignant",
    },
    response: "{ message, submission } — submission.state passe à GRADED",
    errors: "400 { errors: string[] } — note invalide, hors barème",
    usage: "Bouton « Évaluer » / modal notation dans AssignmentDetailsTeacher",
  },
};

// ─── Fichiers (consignes + copies étudiants) ───────────────────────────────

export const TEACHER_FILE_ENDPOINTS = {
  download: {
    method: "POST",
    path: "/files/:fileId/download",
    usage: "Télécharger en cache local avant lecture",
  },
  serve: {
    method: "GET",
    path: "/files/:fileId/serve",
    usage: "Aperçu PDF/image (split viewer comme étudiant)",
  },
  downloadBulk: {
    method: "POST",
    path: "/files/download-bulk",
    body: "{ fileIds: number[] }",
    usage: "Bouton « Tout télécharger » sur un devoir",
  },
};

// ─── Sync (hors écran détail mais utile) ───────────────────────────────────

export const TEACHER_SYNC_NOTE = {
  pushGrades:
    "Après gradeSubmission, sync_status PENDING_PUSH — synchronisation Moodle via moteur sync global (Navbar)",
  pullSubmissions:
    "Les copies arrivent via sync pull assignmentSubmissions",
};

/**
 * Plan d'intégration frontend (enseignant)
 *
 * 1. Assignment.jsx — si isTeacher : getTeacherAssignments() au lieu de getAllAssignments()
 * 2. AssignmentDetailsTeacher — gradeSubmission() + toast + refresh liste
 * 3. Modal notation : grade (0..maxGrade), feedback, aperçu submissionText + fichiers (serveFile)
 * 4. Participants : GET /courses/:id/participants pour nom/email si user absent sur submission
 * 5. Compteurs : submittedCount = SUBMITTED+GRADED, pending = SUBMITTED, gradedCount = GRADED
 * 6. Ne pas exposer DRAFT comme « remis » dans les stats de remise
 */
