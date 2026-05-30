const TEACHER_ROLE_NAMES = new Set([
  "editingteacher",
  "teacher",
  "manager",
  "coursecreator",
]);

export function normalizeIdentity(value) {
  return String(value || "").trim().toLowerCase();
}

export function parseParticipantRoles(participant) {
  if (!participant?.rolesJson) return [];
  try {
    const parsed = JSON.parse(participant.rolesJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isTeacherParticipant(participant) {
  const roles = parseParticipantRoles(participant);
  return roles.some((r) => {
    const name = typeof r === "string" ? r : r?.shortname;
    return name && TEACHER_ROLE_NAMES.has(String(name).toLowerCase());
  });
}

/** Correspond à l'utilisateur connecté (moodleUserId, username, email) */
export function isSessionParticipant(participant, sessionUser) {
  if (!sessionUser || !participant) return false;

  if (
    sessionUser.moodleUserId != null &&
    participant.moodleUserId === sessionUser.moodleUserId
  ) {
    return true;
  }

  const uName = normalizeIdentity(sessionUser.username);
  const uEmail = normalizeIdentity(sessionUser.email);
  const pEmail = normalizeIdentity(participant.email);
  const pFull = normalizeIdentity(participant.fullname);

  if (uEmail && pEmail && uEmail === pEmail) return true;
  if (uName && pEmail && uName === pEmail) return true;
  if (uName && uEmail && uName === uEmail) return true;
  if (uName && pFull && (pFull === uName || pFull.includes(uName))) return true;

  return false;
}

export function isSessionSubmission(submission, sessionUser) {
  if (!sessionUser || !submission) return false;
  return (
    sessionUser.moodleUserId != null &&
    submission.moodleUserId === sessionUser.moodleUserId
  );
}

/** Participants étudiants — exclut enseignants et l'utilisateur connecté */
export function filterStudentParticipants(participants = [], sessionUser = null) {
  return participants.filter((p) => {
    if (isTeacherParticipant(p)) return false;
    if (isSessionParticipant(p, sessionUser)) return false;
    return true;
  });
}

export function getTeacherMoodleUserIds(participants = []) {
  return participants.filter(isTeacherParticipant).map((p) => p.moodleUserId);
}

/** Exclut copies enseignants + copie de l'utilisateur connecté */
export function filterStudentSubmissions(
  submissions = [],
  participants = [],
  sessionUser = null
) {
  const teacherIds = new Set(getTeacherMoodleUserIds(participants));

  return submissions.filter((s) => {
    if (isSessionSubmission(s, sessionUser)) return false;
    if (s.moodleUserId != null && teacherIds.has(s.moodleUserId)) return false;
    return true;
  });
}
