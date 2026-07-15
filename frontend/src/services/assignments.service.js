import apiClient from "@/client/apiClient";
import { getAllLocalCourses, getAssignmentsByCourse, getParticipantsByCourse } from "./courses.service";
import { filterStudentParticipants, filterStudentSubmissions } from "@/utils/assignmentParticipants.utils";
import { getGradedSubmissions } from "./grading.service";
import { STUDENT_REMARK_SEPARATOR } from "@/constants/assignmentStudentApi";
import { API_CONFIG } from "@/config/api.config";
import { buildHeaders } from "@/utils/api.utils";

function parseApiError(errorData, status) {
  if (!errorData) return `Erreur serveur ${status}`;
  if (typeof errorData.message === "string") return errorData.message;
  if (typeof errorData.error === "string") return errorData.error;
  if (Array.isArray(errorData.errors)) return errorData.errors.join(" ");
  return `Erreur serveur ${status}`;
}

/** Combine réponse principale + remarque pour le champ API `text` (submissionText). */
export function buildSubmissionText(mainText = "", remark = "") {
  const body = mainText?.trim() || "";
  const note = remark?.trim() || "";
  if (body && note) return `${body}${STUDENT_REMARK_SEPARATOR}${note}`;
  if (body) return body;
  if (note) return note;
  return "";
}

/** Sépare réponse et remarque après lecture de submissionText. */
export function parseSubmissionText(raw = "") {
  if (!raw) return { body: "", remark: "" };
  const idx = raw.indexOf(STUDENT_REMARK_SEPARATOR);
  if (idx === -1) return { body: raw.trim(), remark: "" };
  return {
    body: raw.slice(0, idx).trim(),
    remark: raw.slice(idx + STUDENT_REMARK_SEPARATOR.length).trim(),
  };
}

/** Retire les balises HTML pour les aperçus de cartes */
export function stripHtml(html) {
  if (!html || typeof html !== "string") return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Statuts UI étudiant */
export const STUDENT_SUBMISSION_STATUS = {
  NOT_SENT: "NOT_SENT",
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  GRADED: "GRADED",
};

export function getStudentSubmissionStatus(assignment) {
  const sub = assignment?.submission;
  if (!sub) return STUDENT_SUBMISSION_STATUS.NOT_SENT;

  const state = sub.state;
  if (state === "GRADED" || sub.grade != null) {
    return STUDENT_SUBMISSION_STATUS.GRADED;
  }
  if (state === "SUBMITTED") return STUDENT_SUBMISSION_STATUS.SUBMITTED;
  if (state === "DRAFT") return STUDENT_SUBMISSION_STATUS.DRAFT;
  return STUDENT_SUBMISSION_STATUS.NOT_SENT;
}

/** Onglet « À faire » : non envoyé + brouillon */
export function isStudentTodo(assignment) {
  const status = getStudentSubmissionStatus(assignment);
  return (
    status === STUDENT_SUBMISSION_STATUS.NOT_SENT ||
    status === STUDENT_SUBMISSION_STATUS.DRAFT
  );
}

/** Onglet « Mes soumissions » : envoyé + corrigé */
export function isStudentInSubmissionsTab(assignment) {
  const status = getStudentSubmissionStatus(assignment);
  return (
    status === STUDENT_SUBMISSION_STATUS.SUBMITTED ||
    status === STUDENT_SUBMISSION_STATUS.GRADED
  );
}

/** Date limite dépassée (cutoffDate ou dueDate) */
export function isAssignmentEvaluationExpired(assignment) {
  const cutoff = assignment?.cutoffDate || assignment?.dueDate;
  if (!cutoff) return false;
  return Math.floor(Date.now() / 1000) > cutoff;
}

/**
 * Devoir enseignant « Terminé » : échéance passée ET toutes les remises corrigées.
 * Sans date d'échéance : terminé dès que toutes les remises reçues sont corrigées.
 */
export function isTeacherAssignmentTermine(assignment) {
  const submitted = assignment?.submittedCount || 0;
  const graded = assignment?.gradedCount || 0;
  const allSubmittedGraded = submitted === 0 ? graded === 0 : graded >= submitted;

  if (!assignment?.dueDate && !assignment?.cutoffDate) {
    return submitted > 0 && allSubmittedGraded;
  }
  return isAssignmentEvaluationExpired(assignment) && allSubmittedGraded;
}

export function isTeacherAssignmentAFaire(assignment) {
  return !isTeacherAssignmentTermine(assignment);
}

export function getStudentStatusLabel(status) {
  switch (status) {
    case STUDENT_SUBMISSION_STATUS.DRAFT:
      return "Brouillon";
    case STUDENT_SUBMISSION_STATUS.SUBMITTED:
      return "Envoyé";
    case STUDENT_SUBMISSION_STATUS.GRADED:
      return "Corrigé";
    default:
      return "Non envoyé";
  }
}

/** Sous-titre badge / panneau info */
export function getStudentStatusHint(status) {
  switch (status) {
    case STUDENT_SUBMISSION_STATUS.DRAFT:
      return "Enregistré — vous pouvez quitter et reprendre plus tard";
    case STUDENT_SUBMISSION_STATUS.SUBMITTED:
      return "Remise définitive — modification impossible";
    case STUDENT_SUBMISSION_STATUS.GRADED:
      return "Corrigé par l'enseignant";
    default:
      return "Aucune sauvegarde — utilisez « Enregistrer le brouillon »";
  }
}

/** Devoir remis ou corrigé (hors brouillon) */
export function isStudentSubmitted(assignment) {
  return isStudentInSubmissionsTab(assignment);
}

export function isStudentDraft(assignment) {
  return getStudentSubmissionStatus(assignment) === STUDENT_SUBMISSION_STATUS.DRAFT;
}

/** Messages utilisateur (API renvoie souvent l'anglais) */
export function getDraftSuccessMessage() {
  return "Brouillon enregistré. Vous pouvez encore modifier votre travail avant la remise définitive.";
}

export function getSubmitSuccessMessage() {
  return "Devoir remis avec succès. Retrouvez-le dans l'onglet « Mes soumissions ».";
}

function formatAssignmentApiMessage(apiMessage, kind) {
  if (kind === "draft") {
    if (apiMessage && /draft saved/i.test(apiMessage)) return getDraftSuccessMessage();
    return apiMessage || getDraftSuccessMessage();
  }
  if (kind === "submit") {
    if (apiMessage && /submitted|locked/i.test(apiMessage)) return getSubmitSuccessMessage();
    return apiMessage || getSubmitSuccessMessage();
  }
  return apiMessage || "";
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

function pickUserSubmission(submissions, moodleUserId) {
  if (!submissions?.length) return null;

  if (moodleUserId != null) {
    const exact = submissions.find((s) => s.moodleUserId === moodleUserId);
    if (exact) return exact;
  }

  const active = submissions.filter((s) =>
    ["DRAFT", "SUBMITTED", "GRADED"].includes(s.state)
  );
  if (active.length === 1) return active[0];
  if (submissions.length === 1) return submissions[0];

  return null;
}

/** Fusionne GET /submissions (notes) dans les devoirs étudiants */
export async function mergeGradesIntoAssignments(assignments) {
  const gradedList = await getGradedSubmissions();
  if (!gradedList.length) return assignments;

  const byAssignmentId = new Map();
  for (const row of gradedList) {
    const aid = row.assignmentId ?? row.assignment?.id;
    if (aid != null) byAssignmentId.set(aid, row);
  }

  return assignments.map((a) => {
    const gradedRow = byAssignmentId.get(a.id);
    if (!gradedRow) return a;

    const baseSub = a.submission || {
      assignmentId: a.id,
      moodleUserId: gradedRow.moodleUserId,
    };

    return {
      ...a,
      submission: {
        ...baseSub,
        grade: gradedRow.grade ?? baseSub.grade,
        feedback: gradedRow.feedback ?? baseSub.feedback,
        gradedAt: gradedRow.gradedAt ?? baseSub.gradedAt,
        state:
          gradedRow.grade != null || gradedRow.state === "GRADED"
            ? "GRADED"
            : baseSub.state,
      },
    };
  });
}

function applyTeacherSubmissionStats(assignment, participants = [], sessionUser = null) {
  const students = filterStudentParticipants(participants, sessionUser);
  const studentSubs = filterStudentSubmissions(
    assignment.allSubmissions || [],
    participants,
    sessionUser
  );
  const stats = {
    ...assignment,
    allSubmissions: studentSubs.map((s) => ({
      ...s,
      submittedFiles: s.submittedFiles || [],
    })),
    submittedCount: studentSubs.filter(
      (s) => s.state === "SUBMITTED" || s.state === "GRADED"
    ).length,
    gradedCount: studentSubs.filter(
      (s) => s.state === "GRADED" || s.grade != null
    ).length,
    pendingGradeCount: studentSubs.filter((s) => s.state === "SUBMITTED").length,
    evaluationExpired: isAssignmentEvaluationExpired(assignment),
    totalCount: students.length || studentSubs.length,
    studentParticipantCount: students.length,
  };
  stats.isTermine = isTeacherAssignmentTermine(stats);
  return stats;
}

function normalizeAssignment(raw, course, { moodleUserId, forTeacher = false } = {}) {
  const submissions = raw.submissions || [];
  const userSubmission = forTeacher
    ? null
    : pickUserSubmission(submissions, moodleUserId);

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
        return assignments.map((a) =>
          normalizeAssignment(a, course, { moodleUserId, forTeacher: false })
        );
      } catch (err) {
        console.warn(`Impossible de charger les devoirs pour le cours ${course.id}`, err);
        return [];
      }
    });

    const results = await Promise.all(promises);
    const flat = results
      .flat()
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate - b.dueDate;
      });
    return mergeGradesIntoAssignments(flat);
  } catch (error) {
    console.error("Erreur lors de la récupération de tous les devoirs:", error);
    throw error;
  }
}

/** Recharge un devoir (soumission + fichiers) après brouillon ou à l'ouverture du détail */
export async function fetchStudentAssignment(courseId, assignmentId, { moodleUserId, course } = {}) {
  const assignments = await getAssignmentsByCourse(courseId);
  const raw = assignments.find((a) => a.id === assignmentId);
  if (!raw) return null;
  const courseMeta = course || { id: courseId, title: raw.course?.title };
  const normalized = normalizeAssignment(raw, courseMeta, { moodleUserId });
  const [merged] = await mergeGradesIntoAssignments([normalized]);
  return merged;
}

/** Recharge un devoir enseignant (toutes les soumissions + fichiers) */
export async function fetchTeacherAssignment(courseId, assignmentId, { course, sessionUser } = {}) {
  const assignments = await getAssignmentsByCourse(courseId);
  const raw = assignments.find((a) => a.id === assignmentId);
  if (!raw) return null;
  const courseMeta = course || { id: courseId, title: raw.course?.title };
  const normalized = normalizeAssignment(raw, courseMeta, { forTeacher: true });
  let participants = [];
  try {
    participants = await getParticipantsByCourse(courseId);
  } catch {
    participants = [];
  }
  return applyTeacherSubmissionStats(normalized, participants, sessionUser);
}

/** Liste devoirs enseignant avec toutes les soumissions */
export async function getTeacherAssignments(sessionUser = null) {
  const courses = await getAllLocalCourses();
  const promises = courses.map(async (course) => {
    try {
      const [assignments, participants] = await Promise.all([
        getAssignmentsByCourse(course.id),
        getParticipantsByCourse(course.id).catch(() => []),
      ]);
      if (!assignments?.length) return [];
      return assignments.map((a) =>
        applyTeacherSubmissionStats(
          normalizeAssignment(a, course, { forTeacher: true }),
          participants,
          sessionUser
        )
      );
    } catch (err) {
      console.warn(`Devoirs cours ${course.id}:`, err);
      return [];
    }
  });
  const results = await Promise.all(promises);
  return results.flat().sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate - b.dueDate;
  });
}

/**
 * Sauvegarde un brouillon (Draft) ou soumet les fichiers et texte
 * On utilise fetch natif pour gérer correctement le multipart/form-data
 */
/**
 * PUT /assignments/:id/draft — body: text (string), files[] (multipart)
 */
export async function submitAssignmentDraft(assignmentId, text, files = []) {
  const formData = new FormData();
  formData.append("text", text != null ? String(text) : "");

  files.forEach((f) => {
    formData.append("files", f);
  });

  const url = new URL(`${API_CONFIG.baseURL}/assignments/${assignmentId}/draft`);
  const headers = buildHeaders(true);
  delete headers["Content-Type"];

  const response = await fetch(url.toString(), {
    method: "PUT",
    headers,
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(parseApiError(data, response.status));
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * POST /assignments/:id/submit — enchaîne draft + verrouillage SUBMITTED
 */
export async function saveStudentDraft(
  assignmentId,
  { text = "", remark = "", files = [] } = {}
) {
  const payloadText = buildSubmissionText(text, remark);
  const data = await submitAssignmentDraft(assignmentId, payloadText, files);
  return {
    ...data,
    message: formatAssignmentApiMessage(data?.message, "draft"),
  };
}

export async function submitAssignmentComplete(
  assignmentId,
  { text = "", remark = "", files = [] } = {}
) {
  const payloadText = buildSubmissionText(text, remark);
  await submitAssignmentDraft(assignmentId, payloadText, files);
  const data = await submitAssignmentFinal(assignmentId);
  return {
    ...data,
    message: formatAssignmentApiMessage(data?.message, "submit"),
  };
}

/**
 * Valide et verrouille la soumission définitive au backend
 */
export async function submitAssignmentFinal(assignmentId) {
  try {
    const data = await apiClient.post(`/assignments/${assignmentId}/submit`);
    return {
      ...data,
      message: formatAssignmentApiMessage(data?.message, "submit"),
    };
  } catch (error) {
    const msg =
      error?.data?.errors?.join?.(" ") ||
      error?.message ||
      "Erreur lors de la remise du devoir.";
    const err = new Error(msg);
    err.status = error?.status;
    throw err;
  }
}
