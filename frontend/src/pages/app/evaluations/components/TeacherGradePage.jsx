import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Save,
  User,
  BookOpen,
} from "lucide-react";
import { gradeSubmission } from "@/services/grading.service";
import { parseSubmissionText } from "@/services/assignments.service";
import { downloadFile, serveFile } from "@/services/files.service";
import { toast } from "sonner";

function formatSubmissionDate(submission) {
  const ts = submission?.gradedAt || submission?.local_updated_at;
  if (!ts) return "—";
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
  return d.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TeacherGradePage({
  assignment,
  submission,
  studentName,
  gradableQueue = [],
  onRetour,
  onSaved,
  onNavigate,
}) {
  const maxGrade = assignment?.gradeMax ?? assignment?.maxGrade ?? 20;
  const parsed = parseSubmissionText(submission?.submissionText || "");
  const files = submission?.submittedFiles || [];

  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);

  const currentIndex = gradableQueue.findIndex((q) => q.submission?.id === submission?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < gradableQueue.length - 1;

  useEffect(() => {
    if (!submission) return;
    setGrade(submission.grade != null ? String(submission.grade) : "");
    setFeedback(submission.feedback || "");
    setPreview(null);
  }, [submission?.id]);

  useEffect(() => {
    return () => {
      if (preview?.revoke) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const openFile = async (file) => {
    try {
      setLoadingFile(true);
      if (preview?.revoke) URL.revokeObjectURL(preview.url);
      try {
        await downloadFile(file.id);
      } catch {
        /* cache */
      }
      const url = await serveFile(file.id);
      const isPdf =
        file.mimeType?.includes("pdf") || file.filename?.toLowerCase().endsWith(".pdf");
      const isImage = file.mimeType?.startsWith("image/");
      setPreview({
        url,
        filename: file.filename,
        embeddable: isPdf || isImage,
        revoke: false,
      });
    } catch (err) {
      toast.error("Impossible d'ouvrir le fichier", { description: err.message });
    } finally {
      setLoadingFile(false);
    }
  };

  const handleSave = async () => {
    const parsedGrade = parseFloat(grade);
    if (Number.isNaN(parsedGrade)) {
      toast.error("Note invalide");
      return;
    }
    if (parsedGrade < 0 || parsedGrade > maxGrade) {
      toast.error(`La note doit être entre 0 et ${maxGrade}`);
      return;
    }

    try {
      setSaving(true);
      const data = await gradeSubmission(submission.id, {
        grade: parsedGrade,
        feedback: feedback.trim(),
      });
      toast.success("Note enregistrée", { description: data.message });
      onSaved?.(data.submission);
    } catch (err) {
      toast.error("Échec de la notation", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const goSibling = useCallback(
    (delta) => {
      if (currentIndex < 0 || !onNavigate) return;
      const next = gradableQueue[currentIndex + delta];
      if (next) onNavigate(next);
    },
    [currentIndex, gradableQueue, onNavigate]
  );

  const statusLabel =
    submission?.state === "GRADED" ? "Déjà évalué" : "À évaluer";
  const statusClass =
    submission?.state === "GRADED"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-[#2A78C2]/20 text-[#1F69AE]";

  return (
    <div className="min-h-screen bg-slate-50/80 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Fil d'Ariane */}
        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mb-6">
          <button
            type="button"
            onClick={onRetour}
            className="inline-flex items-center gap-1.5 hover:text-[#2A78C2] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au devoir
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium truncate max-w-[200px]">
            {assignment?.name}
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-semibold truncate max-w-[180px]">
            {studentName}
          </span>
        </nav>

        {/* En-tête élève */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                  {studentName}
                </h1>
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {assignment?.course?.title}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-600">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusClass}`}>
                {statusLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                Remis le {formatSubmissionDate(submission)}
              </span>
              {gradableQueue.length > 1 && currentIndex >= 0 && (
                <span className="text-slate-400">
                  Copie {currentIndex + 1} / {gradableQueue.length}
                </span>
              )}
            </div>
          </div>

          {gradableQueue.length > 1 && (
            <div className="flex gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasPrev}
                onClick={() => goSibling(-1)}
                className="rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasNext}
                onClick={() => goSibling(1)}
                className="rounded-xl"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Copie étudiant — lecture confortable */}
          <div className="lg:col-span-7 space-y-5">
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-800 mb-4">
                Travail remis
              </h2>

              {parsed.body ? (
                <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-5 mb-4">
                  <p className="text-xs font-medium text-slate-500 mb-2">Réponse</p>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-[15px]">
                    {parsed.body}
                  </p>
                </div>
              ) : null}

              {parsed.remark ? (
                <div className="rounded-xl bg-amber-50/60 border border-amber-100/80 p-5 mb-4">
                  <p className="text-xs font-medium text-amber-800 mb-2">
                    Remarque de l&apos;étudiant
                  </p>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-[15px]">
                    {parsed.remark}
                  </p>
                </div>
              ) : null}

              {!parsed.body && !parsed.remark && files.length === 0 && (
                <p className="text-slate-500 text-sm py-4">Aucun contenu textuel.</p>
              )}

              {files.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-3">
                    Fichiers ({files.length})
                  </p>
                  <ul className="space-y-2 mb-4">
                    {files.map((file) => (
                      <li key={file.id}>
                        <button
                          type="button"
                          disabled={loadingFile}
                          onClick={() => openFile(file)}
                          className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                            preview?.filename === file.filename
                              ? "border-[#2A78C2]/30 bg-[#2A78C2]/10/50"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <FileText className="w-4 h-4 text-[#2A78C2] shrink-0" />
                          <span className="text-sm font-medium text-slate-800 truncate flex-1">
                            {file.filename}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  {preview && (
                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900/5">
                      <p className="text-xs px-4 py-2 bg-slate-100 text-slate-600 font-medium truncate">
                        {preview.filename}
                      </p>
                      <div className="min-h-[320px] max-h-[480px] relative">
                        {preview.embeddable ? (
                          preview.url && preview.filename?.match(/\.(png|jpe?g|gif|webp)$/i) ? (
                            <img
                              src={preview.url}
                              alt={preview.filename}
                              className="w-full max-h-[480px] object-contain p-4"
                            />
                          ) : (
                            <iframe
                              src={preview.url}
                              title={preview.filename}
                              className="w-full h-[480px] border-0"
                            />
                          )
                        ) : (
                          <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                            Aperçu non disponible — ouvrez depuis la liste des fichiers.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Panneau notation — fixe, aéré */}
          <div className="lg:col-span-5 lg:sticky lg:top-8">
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 mb-1">Notation</h2>
                <p className="text-xs text-slate-500">
                  Barème sur {maxGrade} points — {assignment?.name}
                </p>
              </div>

              <Separator className="bg-slate-100" />

              <div>
                <label
                  htmlFor="grade-input"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Note
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    id="grade-input"
                    type="number"
                    min={0}
                    max={maxGrade}
                    step="0.5"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="rounded-xl h-12 text-lg font-semibold text-center max-w-[120px]"
                  />
                  <span className="text-slate-400 text-sm font-medium">/ {maxGrade}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[0, maxGrade / 2, maxGrade * 0.75, maxGrade].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setGrade(String(val % 1 === 0 ? val : val.toFixed(1)))}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                      {val % 1 === 0 ? val : val.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="feedback-input"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Commentaire pour l&apos;étudiant
                </label>
                <Textarea
                  id="feedback-input"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Points forts, axes d'amélioration..."
                  className="min-h-[140px] rounded-xl border-slate-200 resize-y text-[15px] leading-relaxed"
                />
              </div>

              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 rounded-xl font-semibold bg-[#2A78C2] hover:bg-[#1F69AE] shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer la note
                  </>
                )}
              </Button>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                La note sera synchronisée avec Moodle lors de la prochaine sync.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
