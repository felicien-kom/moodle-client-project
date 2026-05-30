import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  UploadCloud,
  File,
  Trash2,
  BookOpen,
  FileText,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  submitAssignmentComplete,
  saveStudentDraft,
  fetchStudentAssignment,
  getDraftSuccessMessage,
  isStudentSubmitted,
  getStudentSubmissionStatus,
  getStudentStatusHint,
  parseSubmissionText,
  STUDENT_SUBMISSION_STATUS,
} from "@/services/assignments.service";
import { downloadFile, serveFile } from "@/services/files.service";
import { DocumentSplitViewer } from "./DocumentSplitViewer";
import { StudentStatusBadge } from "./StudentStatusBadge";
import { toast } from "sonner";

function buildContentSnapshot(text, remark, existingFiles, selectedFiles) {
  return JSON.stringify({
    body: text.trim(),
    remark: remark.trim(),
    fileIds: [...existingFiles.map((f) => f.id)].sort((a, b) => a - b),
    pending: selectedFiles.map((f) => `${f.name}:${f.size}`).sort(),
  });
}

export function AssignmentDetailsStudent({ assignment, onRetour, moodleUserId: moodleUserIdProp }) {
  const { user } = useAuth();
  const moodleUserId = moodleUserIdProp ?? user?.moodleUserId;

  const [submissionLive, setSubmissionLive] = useState(assignment.submission);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const assignmentView = { ...assignment, submission: submissionLive };

  const initialParsed = parseSubmissionText(submissionLive?.submissionText || "");
  const [textResponse, setTextResponse] = useState(initialParsed.body);
  const [studentRemark, setStudentRemark] = useState(initialParsed.remark);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState(
    () => submissionLive?.submittedFiles || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const fileInputRef = useRef(null);
  const lastSavedSnapshot = useRef(
    buildContentSnapshot(initialParsed.body, initialParsed.remark, submissionLive?.submittedFiles || [], [])
  );

  const isSubmitted = isStudentSubmitted(assignmentView);
  const submissionStatus = getStudentSubmissionStatus(assignmentView);
  const isDraft = submissionStatus === STUDENT_SUBMISSION_STATUS.DRAFT;
  const maxGrade = assignment.gradeMax ?? assignment.maxGrade ?? 20;
  const requiresText = Boolean(Number(assignment.requiresText));
  const requiresFile = Boolean(Number(assignment.requiresFile));

  const wordCount = textResponse.trim() ? textResponse.trim().split(/\s+/).length : 0;
  const isWordLimitExceeded = Boolean(
    assignment.wordLimit && wordCount > assignment.wordLimit
  );
  const totalFilesCount = existingFiles.length + selectedFiles.length;
  const isMaxFilesExceeded = Boolean(
    assignment.maxFiles && totalFilesCount > assignment.maxFiles
  );
  const isMaxFileSizeExceeded = Boolean(
    assignment.maxFileSize &&
      selectedFiles.some((f) => f.size > assignment.maxFileSize)
  );

  const introFiles = assignment.introFiles || [];

  const submittedContent = useMemo(
    () => parseSubmissionText(submissionLive?.submissionText || ""),
    [submissionLive?.submissionText]
  );

  const applySubmissionFromApi = (submission, { keepPendingFiles = false } = {}) => {
    if (!submission) return;
    const merged = {
      ...submission,
      submittedFiles: submission.submittedFiles || [],
    };
    setSubmissionLive(merged);
    setExistingFiles(merged.submittedFiles);
    const parsed = parseSubmissionText(merged.submissionText || "");
    setTextResponse(parsed.body);
    setStudentRemark(parsed.remark);
    const pending = keepPendingFiles ? selectedFiles : [];
    if (!keepPendingFiles) setSelectedFiles([]);
    lastSavedSnapshot.current = buildContentSnapshot(
      parsed.body,
      parsed.remark,
      merged.submittedFiles,
      pending
    );
  };

  const isDirty = useCallback(() => {
    return (
      lastSavedSnapshot.current !==
      buildContentSnapshot(textResponse, studentRemark, existingFiles, selectedFiles)
    );
  }, [textResponse, studentRemark, existingFiles, selectedFiles]);

  const reloadFromServer = useCallback(async () => {
    if (!assignment.course?.id) return null;
    const fresh = await fetchStudentAssignment(assignment.course.id, assignment.id, {
      moodleUserId,
      course: assignment.course,
    });
    if (fresh?.submission) {
      applySubmissionFromApi(fresh.submission);
    } else if (fresh) {
      setSubmissionLive(null);
      setExistingFiles([]);
      lastSavedSnapshot.current = buildContentSnapshot("", "", [], []);
    }
    return fresh;
  }, [assignment.course, assignment.id, moodleUserId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingDraft(true);
        await reloadFromServer();
      } catch (err) {
        console.warn("Rechargement brouillon:", err);
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assignment.id, reloadFromServer]);

  const validateBeforeSave = (forFinalSubmit = false) => {
    const hasTextContent = Boolean(textResponse.trim() || studentRemark.trim());

    if (forFinalSubmit) {
      if (requiresText && !textResponse.trim()) {
        setErrorSubmit("Une réponse textuelle est requise pour remettre le devoir.");
        return false;
      }
      if (requiresFile && totalFilesCount === 0) {
        setErrorSubmit("Au moins un fichier est requis pour remettre le devoir.");
        return false;
      }
      if (!requiresText && !requiresFile && !hasTextContent && totalFilesCount === 0) {
        setErrorSubmit("Ajoutez une réponse, une remarque ou un fichier avant de remettre.");
        return false;
      }
    }

    if (isWordLimitExceeded || isMaxFilesExceeded || isMaxFileSizeExceeded) {
      setErrorSubmit("Vérifiez les contraintes du devoir.");
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateBeforeSave(false)) return;

    try {
      setIsSavingDraft(true);
      setErrorSubmit(null);
      setSuccessMessage(null);
      await saveStudentDraft(assignment.id, {
        text: textResponse,
        remark: studentRemark,
        files: selectedFiles,
      });
      await reloadFromServer();
      const msg = getDraftSuccessMessage();
      setSuccessMessage(msg);
      toast.success("Brouillon enregistré", { description: msg });
    } catch (err) {
      const msg = err.message || "Impossible d'enregistrer le brouillon.";
      setErrorSubmit(msg);
      toast.error("Échec du brouillon", { description: msg });
    } finally {
      setIsSavingDraft(false);
    }
  };

  useEffect(() => {
    return () => {
      if (preview?.revoke) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const closePreview = useCallback(() => {
    if (preview?.revoke) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }, [preview]);

  const openLocalFilePreview = (file) => {
    closePreview();
    const url = URL.createObjectURL(file);
    setPreview({
      url,
      filename: file.name,
      mimeType: file.type,
      revoke: true,
    });
  };

  const openServerFilePreview = async (file) => {
    try {
      setLoadingPreview(true);
      closePreview();
      try {
        await downloadFile(file.id);
      } catch {
        /* déjà en cache possible */
      }
      const url = await serveFile(file.id);
      setPreview({
        url,
        filename: file.filename,
        mimeType: file.mimeType || "",
        revoke: false,
      });
    } catch (err) {
      alert(err.message || "Impossible d'ouvrir ce fichier");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
    e.target.value = "";
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const persistDraftIfNeeded = async () => {
    if (isSubmitted || !isDirty()) return true;
    await saveStudentDraft(assignment.id, {
      text: textResponse,
      remark: studentRemark,
      files: selectedFiles,
    });
    await reloadFromServer();
    return true;
  };

  const handleBack = async () => {
    if (isSubmitted) {
      onRetour();
      return;
    }
    if (isDirty()) {
      try {
        setIsSavingDraft(true);
        await persistDraftIfNeeded();
        toast.success("Brouillon enregistré", {
          description: "Vos modifications ont été sauvegardées.",
        });
      } catch (err) {
        toast.error("Enregistrement impossible", {
          description: err.message || "Le brouillon n'a pas pu être sauvegardé.",
        });
        return;
      } finally {
        setIsSavingDraft(false);
      }
    }
    onRetour();
  };

  const handleSubmit = async () => {
    if (
      !confirm(
        "Confirmer la remise de ce devoir ? Vous ne pourrez plus le modifier après envoi."
      )
    ) {
      return;
    }

    if (!validateBeforeSave(true)) return;

    try {
      setIsSubmitting(true);
      setErrorSubmit(null);
      setSuccessMessage(null);
      const data = await submitAssignmentComplete(assignment.id, {
        text: textResponse,
        remark: studentRemark,
        files: selectedFiles,
      });
      const msg = data.message;
      toast.success("Devoir remis", { description: msg });
      onRetour();
    } catch (err) {
      const msg = err.message || "Erreur lors de la remise du devoir.";
      setErrorSubmit(msg);
      toast.error("Remise impossible", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDueDate = () => {
    if (!assignment.dueDate) return "Pas de date limite";
    return new Date(assignment.dueDate * 1000).toLocaleString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const maxFileSizeMb = assignment.maxFileSize
    ? Math.round(assignment.maxFileSize / 1024 / 1024)
    : 10;

  const detailContent = (
    <>
      <div className="mb-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={isSavingDraft || isSubmitting}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-4 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {assignment.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-slate-500">{assignment.course?.title}</p>
          <StudentStatusBadge assignment={assignmentView} />
        </div>
      </div>

      <div className={preview ? "space-y-4" : "grid grid-cols-1 xl:grid-cols-3 gap-6"}>
        <div className={preview ? "space-y-4" : "xl:col-span-2 space-y-5"}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Consignes
            </h2>
            <div
              className="prose prose-slate max-w-none text-slate-600 prose-p:leading-relaxed text-sm"
              dangerouslySetInnerHTML={{
                __html: assignment.intro || assignment.activity || "Aucune consigne définie.",
              }}
            />

            {introFiles.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Documents du professeur
                </p>
                <ul className="space-y-2">
                  {introFiles.map((file) => (
                    <li key={file.id}>
                      <button
                        type="button"
                        disabled={loadingPreview}
                        onClick={() => openServerFilePreview(file)}
                        className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="text-sm font-medium text-slate-800 truncate flex-1">
                          {file.filename}
                        </span>
                        <Eye className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {!isSubmitted ? (
            <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Votre remise
              </h2>

              {(requiresText || requiresFile) && (
                <div className="mb-5 p-3 rounded-xl bg-slate-50 text-xs text-slate-600 space-y-1">
                  {requiresText && (
                    <p>
                      Texte requis
                      {assignment.wordLimit ? ` — max ${assignment.wordLimit} mots` : ""}
                    </p>
                  )}
                  {requiresFile && (
                    <p>
                      Fichier(s) requis
                      {assignment.maxFiles ? ` — max ${assignment.maxFiles} fichier(s)` : ""}
                      {` — max ${maxFileSizeMb} Mo par fichier`}
                    </p>
                  )}
                </div>
              )}

              {isDraft && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 text-amber-900 text-sm border border-amber-100">
                  {getStudentStatusHint(STUDENT_SUBMISSION_STATUS.DRAFT)}
                </div>
              )}

              {loadingDraft && (
                <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Chargement de votre brouillon...
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm border border-emerald-100">
                  {successMessage}
                </div>
              )}

              {errorSubmit && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
                  {errorSubmit}
                </div>
              )}

              {(requiresText || !requiresFile) && (
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Réponse textuelle
                    {requiresText && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <Textarea
                    placeholder="Saisissez votre réponse..."
                    className="min-h-[140px] rounded-xl border-slate-200"
                    value={textResponse}
                    onChange={(e) => setTextResponse(e.target.value)}
                  />
                  {assignment.wordLimit && (
                    <p
                      className={`text-xs mt-1.5 ${
                        isWordLimitExceeded ? "text-red-600 font-semibold" : "text-slate-400"
                      }`}
                    >
                      {wordCount} / {assignment.wordLimit} mots
                    </p>
                  )}
                </div>
              )}

              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Remarque pour l&apos;enseignant
                  <span className="text-slate-400 font-normal normal-case ml-1">(optionnel)</span>
                </label>
                <Textarea
                  placeholder="Ex. : précision sur un point du devoir, difficulté rencontrée..."
                  className="min-h-[80px] rounded-xl border-slate-200 text-sm"
                  value={studentRemark}
                  onChange={(e) => setStudentRemark(e.target.value)}
                  maxLength={2000}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Cette note sera transmise à l&apos;enseignant avec votre devoir.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Fichiers
                  {requiresFile && <span className="text-red-500 ml-1">*</span>}
                  {!requiresFile && (
                    <span className="text-slate-400 font-normal normal-case ml-1">(optionnel)</span>
                  )}
                </label>

                  {existingFiles.length > 0 && (
                    <ul className="mb-3 space-y-2">
                      {existingFiles.map((file) => (
                        <li key={file.id}>
                          <button
                            type="button"
                            onClick={() => openServerFilePreview(file)}
                            className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5 text-left hover:bg-slate-50"
                          >
                            <File className="w-4 h-4 text-slate-400" />
                            <span className="text-sm truncate flex-1">{file.filename}</span>
                            <Eye className="w-4 h-4 text-slate-400" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div
                    className="rounded-xl border border-dashed border-slate-300 px-6 py-8 text-center hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="mx-auto h-8 w-8 text-indigo-500 mb-2" />
                    <p className="text-sm font-medium text-slate-600">
                      Cliquez pour ajouter des fichiers
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      PDF, DOC, images — max {maxFileSizeMb} Mo
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={handleFileSelect}
                    />
                  </div>

                  {selectedFiles.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {selectedFiles.map((file, idx) => (
                        <li
                          key={`${file.name}-${idx}`}
                          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2"
                        >
                          <File className="w-4 h-4 text-slate-400 shrink-0" />
                          <button
                            type="button"
                            onClick={() => openLocalFilePreview(file)}
                            className="text-sm font-medium text-slate-800 truncate flex-1 text-left hover:text-indigo-600"
                          >
                            {file.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {isMaxFilesExceeded && (
                    <p className="text-xs text-red-600 mt-2 font-medium">
                      Maximum {assignment.maxFiles} fichier(s) autorisé(s).
                    </p>
                  )}
                </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={
                    isSavingDraft ||
                    isSubmitting ||
                    isWordLimitExceeded ||
                    isMaxFilesExceeded ||
                    isMaxFileSizeExceeded
                  }
                  className="rounded-xl h-12 font-semibold border-slate-300"
                >
                  {isSavingDraft ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer le brouillon"
                  )}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    isSavingDraft ||
                    isWordLimitExceeded ||
                    isMaxFilesExceeded ||
                    isMaxFileSizeExceeded
                  }
                  className="rounded-xl h-12 font-bold bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Remise en cours...
                    </>
                  ) : (
                    "Remettre le devoir"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
              <h2 className="text-sm font-bold text-emerald-900 mb-2">Devoir remis</h2>
              <p className="text-emerald-800 text-sm">
                Votre travail a été transmis à l&apos;enseignant. Vous le retrouverez dans
                l&apos;onglet « Mes soumissions ».
              </p>
              {submittedContent.body && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-emerald-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Votre réponse</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{submittedContent.body}</p>
                </div>
              )}
              {submittedContent.remark && (
                <div className="mt-3 p-4 bg-white rounded-xl border border-emerald-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Votre remarque</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{submittedContent.remark}</p>
                </div>
              )}
              {existingFiles.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {existingFiles.map((file) => (
                    <li key={file.id}>
                      <button
                        type="button"
                        onClick={() => openServerFilePreview(file)}
                        className="w-full flex items-center gap-3 rounded-xl bg-white border border-emerald-100 px-4 py-2.5 text-left hover:bg-emerald-50"
                      >
                        <File className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm truncate">{file.filename}</span>
                        <Eye className="w-4 h-4 text-slate-400 ml-auto" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {assignment.submission?.grade != null && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-emerald-200 flex justify-between items-center">
                  <span className="font-semibold text-slate-600">Note</span>
                  <span className="text-2xl font-black text-emerald-600">
                    {assignment.submission.grade} / {maxGrade}
                  </span>
                </div>
              )}
              {assignment.submission?.feedback && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-emerald-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Commentaire</p>
                  <p className="text-sm text-slate-700">{assignment.submission.feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`space-y-5 ${preview ? "hidden lg:block" : ""}`}>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Informations
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Statut</p>
                <StudentStatusBadge assignment={assignmentView} showGrade={false} />
                <p className="text-xs text-slate-500 mt-2">{getStudentStatusHint(submissionStatus)}</p>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Échéance</p>
                <p className="font-semibold text-slate-900">{formatDueDate()}</p>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cours</p>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <p className="font-semibold text-slate-900">{assignment.course?.title}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Note max</p>
                <p className="font-semibold text-slate-900">{maxGrade} pts</p>
              </div>
            </div>
          </div>

          {assignment.submission?.sync_status === "CONFLICT" && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">
                Une version plus récente existe sur le serveur. La version officielle a été
                conservée.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <DocumentSplitViewer preview={preview} onClose={closePreview}>
      {detailContent}
    </DocumentSplitViewer>
  );
}
