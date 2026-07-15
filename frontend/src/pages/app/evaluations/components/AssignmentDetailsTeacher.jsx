import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Search,
  Download,
  FileText,
  Loader2,
  PenLine,
} from "lucide-react";
import {
  filterStudentParticipants,
  filterStudentSubmissions,
} from "@/utils/assignmentParticipants.utils";
import { fetchTeacherAssignment } from "@/services/assignments.service";
import { getParticipantsByCourse } from "@/services/courses.service";
import { bulkDownloadFiles } from "@/services/files.service";
import { toast } from "sonner";

function formatDueDate(dueDate) {
  if (!dueDate) return "Pas de date limite";
  return new Date(dueDate * 1000).toLocaleString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRowDate(submission) {
  if (!submission) return "—";
  const ts = submission.gradedAt || submission.local_updated_at;
  if (!ts) return "—";
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
  return d.toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveStudentName(participant, submission) {
  if (participant?.fullname) return participant.fullname;
  if (participant?.email) return participant.email;
  if (submission?.moodleUserId) return `Étudiant #${submission.moodleUserId}`;
  return `Copie #${submission?.id ?? "?"}`;
}

function buildTeacherRows(participants, submissions) {
  const subByUser = new Map();
  for (const sub of submissions) {
    if (sub.moodleUserId != null) {
      const existing = subByUser.get(sub.moodleUserId);
      if (!existing || sub.id > existing.id) {
        subByUser.set(sub.moodleUserId, sub);
      }
    }
  }

  const rows = [];
  const usedSubIds = new Set();

  for (const p of participants) {
    const sub = subByUser.get(p.moodleUserId) || null;
    if (sub) usedSubIds.add(sub.id);
    rows.push({
      key: `p-${p.moodleUserId}`,
      studentName: resolveStudentName(p, sub),
      participant: p,
      submission: sub,
      state: sub?.state || "NONE",
    });
  }

  for (const sub of submissions) {
    if (usedSubIds.has(sub.id)) continue;
    rows.push({
      key: `s-${sub.id}`,
      studentName: resolveStudentName(null, sub),
      participant: null,
      submission: sub,
      state: sub.state || "NONE",
    });
  }

  return rows.sort((a, b) => a.studentName.localeCompare(b.studentName, "fr"));
}

function TeacherStatusBadge({ state }) {
  const styles = {
    SUBMITTED: "text-blue-700 bg-blue-50",
    GRADED: "text-emerald-700 bg-emerald-50",
    DRAFT: "text-amber-700 bg-amber-50",
    NONE: "text-slate-500 bg-slate-100",
  };
  const labels = {
    SUBMITTED: "À évaluer",
    GRADED: "Évalué",
    DRAFT: "Brouillon",
    NONE: "Non rendu",
  };
  const s = state in styles ? state : "NONE";
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold ${styles[s]}`}>{labels[s]}</span>
  );
}

export function AssignmentDetailsTeacher({
  assignment: initialAssignment,
  sessionUser,
  onRetour,
  onOpenGrade,
}) {
  const [assignment, setAssignment] = useState(initialAssignment);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  const maxGrade = assignment.gradeMax ?? assignment.maxGrade ?? 20;
  const allSubmissions = assignment.allSubmissions || [];
  const studentParticipants = useMemo(
    () => filterStudentParticipants(participants, sessionUser),
    [participants, sessionUser]
  );
  const submissions = useMemo(
    () => filterStudentSubmissions(allSubmissions, participants, sessionUser),
    [allSubmissions, participants, sessionUser]
  );
  const introFiles = assignment.introFiles || [];

  const reload = useCallback(async () => {
    if (!assignment.course?.id) return;
    try {
      setLoading(true);
      const [fresh, parts] = await Promise.all([
        fetchTeacherAssignment(assignment.course.id, assignment.id, {
          course: assignment.course,
          sessionUser,
        }),
        getParticipantsByCourse(assignment.course.id).catch(() => []),
      ]);
      if (fresh) setAssignment(fresh);
      setParticipants(parts || []);
    } catch (err) {
      console.error(err);
      toast.error("Erreur de chargement", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [assignment.course, assignment.id, sessionUser]);

  useEffect(() => {
    reload();
  }, [reload]);

  const rows = useMemo(
    () => buildTeacherRows(studentParticipants, submissions),
    [studentParticipants, submissions]
  );

  const gradableQueue = useMemo(
    () =>
      rows.filter((r) => r.state === "SUBMITTED" || r.state === "GRADED"),
    [rows]
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) => r.studentName.toLowerCase().includes(query.toLowerCase())),
    [rows, query]
  );

  const enrolledCount = studentParticipants.length || submissions.length;
  const submittedCount = submissions.filter(
    (s) => s.state === "SUBMITTED" || s.state === "GRADED"
  ).length;
  const gradedCount = submissions.filter((s) => s.state === "GRADED").length;
  const pendingCount = submissions.filter((s) => s.state === "SUBMITTED").length;
  const draftCount = submissions.filter((s) => s.state === "DRAFT").length;
  const notSubmittedCount = rows.filter((r) => r.state === "NONE").length;

  const handleBulkDownload = async () => {
    const fileIds = submissions.flatMap((s) =>
      (s.submittedFiles || []).map((f) => f.id)
    );
    if (!fileIds.length) {
      toast.info("Aucun fichier à télécharger");
      return;
    }
    try {
      setBulkLoading(true);
      await bulkDownloadFiles(fileIds);
      toast.success("Téléchargement lancé", {
        description: `${fileIds.length} fichier(s) en cours de récupération.`,
      });
    } catch (err) {
      toast.error("Échec du téléchargement", { description: err.message });
    } finally {
      setBulkLoading(false);
    }
  };

  const openGrade = (row) => {
    if (!row.submission || row.state === "DRAFT" || row.state === "NONE") return;
    onOpenGrade?.({
      submission: row.submission,
      studentName: row.studentName,
      participant: row.participant,
      gradableQueue,
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => onRetour()}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Retour aux évaluations
          </button>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {assignment.name}
          </h1>
          <p className="mt-2 text-lg text-slate-500 font-medium">
            {assignment.course?.title || assignment.course?.shortName}
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-xl border-slate-200 shrink-0"
          disabled={bulkLoading || loading}
          onClick={handleBulkDownload}
        >
          {bulkLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Tout télécharger
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Loader2 className="w-4 h-4 animate-spin" />
          Actualisation des copies...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {(assignment.intro || assignment.activity) && (
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">
                Consignes du devoir
              </h2>
              <div
                className="prose prose-slate prose-sm max-w-none text-slate-600"
                dangerouslySetInnerHTML={{
                  __html: assignment.intro || assignment.activity || "",
                }}
              />
              {introFiles.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Pièces jointes ({introFiles.length})
                  </p>
                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {introFiles.map((file) => (
                      <li
                        key={file.id}
                        className="flex items-center gap-2 py-2.5 px-4 hover:bg-slate-50"
                      >
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-sm font-medium text-slate-700 truncate">
                          {file.filename}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                Travaux des étudiants
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un étudiant..."
                  className="pl-9 bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-xl">Étudiant</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Dernière activité</th>
                    <th className="px-4 py-3">Fichiers</th>
                    <th className="px-4 py-3">Note</th>
                    <th className="px-4 py-3 rounded-tr-xl text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((row) => {
                    const fileCount = row.submission?.submittedFiles?.length || 0;
                    const grade = row.submission?.grade;
                    const canGrade =
                      row.state === "SUBMITTED" || row.state === "GRADED";

                    return (
                      <tr key={row.key} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4 font-bold text-slate-900 max-w-[200px]">
                          <span className="line-clamp-1">{row.studentName}</span>
                          {row.participant?.email && (
                            <p className="text-xs font-normal text-slate-400 truncate">
                              {row.participant.email}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <TeacherStatusBadge state={row.state} />
                        </td>
                        <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                          {formatRowDate(row.submission)}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {fileCount > 0 ? `${fileCount} fichier(s)` : "—"}
                        </td>
                        <td className="px-4 py-4 font-black text-slate-900">
                          {grade != null ? `${grade}/${maxGrade}` : "—"}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {canGrade ? (
                            <Button
                              size="sm"
                              variant={row.state === "GRADED" ? "outline" : "default"}
                              className="rounded-lg h-8"
                              onClick={() => openGrade(row)}
                            >
                              <PenLine className="w-3.5 h-3.5 mr-1" />
                              {row.state === "GRADED" ? "Modifier" : "Corriger"}
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length === 0 && !loading && (
                <div className="py-12 text-center">
                  <p className="text-sm font-bold text-slate-700">Aucun résultat</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {query
                      ? `Aucun étudiant pour « ${query} ».`
                      : "Aucun étudiant à afficher pour ce devoir."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">
              Aperçu
            </h2>
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Étudiants inscrits
                </p>
                <p className="text-2xl font-black text-slate-900">{enrolledCount}</p>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Remises définitives
                </p>
                <p className="text-2xl font-black text-slate-900">{submittedCount}</p>
                {enrolledCount > 0 && (
                  <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round((submittedCount / enrolledCount) * 100))}%`,
                      }}
                    />
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  À évaluer
                </p>
                <p className="text-xl font-bold text-indigo-600">
                  {pendingCount} copie{pendingCount !== 1 ? "s" : ""}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Évalués
                </p>
                <p className="text-xl font-bold text-emerald-600">
                  {gradedCount} copie{gradedCount !== 1 ? "s" : ""}
                </p>
              </div>
              {draftCount > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Brouillons
                    </p>
                    <p className="text-xl font-bold text-amber-600">{draftCount}</p>
                  </div>
                </>
              )}
              {notSubmittedCount > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Non rendus
                    </p>
                    <p className="text-xl font-bold text-slate-500">{notSubmittedCount}</p>
                  </div>
                </>
              )}
              <Separator />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Note maximale
                </p>
                <p className="text-sm font-bold text-slate-900">{maxGrade} pts</p>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Échéance
                </p>
                <p className="text-sm font-bold text-slate-900">{formatDueDate(assignment.dueDate)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
