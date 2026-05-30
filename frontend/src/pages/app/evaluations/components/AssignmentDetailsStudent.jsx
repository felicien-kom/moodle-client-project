import { useState, useRef, useEffect, useCallback } from "react";
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
  isStudentSubmitted,
} from "@/services/assignments.service";
import { downloadFile, serveFile } from "@/services/files.service";
import { DocumentSplitViewer } from "./DocumentSplitViewer";

export function AssignmentDetailsStudent({ assignment, onRetour }) {
  const [textResponse, setTextResponse] = useState(assignment.submission?.submissionText || "");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFiles] = useState(() => assignment.submission?.submittedFiles || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const fileInputRef = useRef(null);

  const isSubmitted = isStudentSubmitted(assignment);
  const maxGrade = assignment.gradeMax ?? assignment.maxGrade ?? 20;
  const requiresText = Boolean(assignment.requiresText);
  const requiresFile = Boolean(assignment.requiresFile);

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

  const handleSubmit = async () => {
    if (
      !confirm(
        "Confirmer la remise de ce devoir ? Vous ne pourrez plus le modifier après envoi."
      )
    ) {
      return;
    }

    if (requiresText && !textResponse.trim()) {
      setErrorSubmit("Une réponse textuelle est requise.");
      return;
    }
    if (requiresFile && totalFilesCount === 0) {
      setErrorSubmit("Au moins un fichier est requis.");
      return;
    }
    if (isWordLimitExceeded || isMaxFilesExceeded || isMaxFileSizeExceeded) {
      setErrorSubmit("Vérifiez les contraintes du devoir avant de remettre.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorSubmit(null);
      await submitAssignmentComplete(assignment.id, textResponse, selectedFiles);
      onRetour(true);
    } catch (err) {
      setErrorSubmit(err.message || "Erreur lors de la remise du devoir.");
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
          onClick={() => onRetour(false)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {assignment.name}
        </h1>
        <p className="mt-1 text-slate-500">{assignment.course?.title}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">
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

              {(requiresFile || selectedFiles.length > 0 || existingFiles.length > 0) && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Fichiers
                    {requiresFile && <span className="text-red-500 ml-1">*</span>}
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
              )}

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isWordLimitExceeded || isMaxFilesExceeded || isMaxFileSizeExceeded}
                className="w-full sm:w-auto rounded-xl h-12 font-bold bg-indigo-600 hover:bg-indigo-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Remettre le devoir"
                )}
              </Button>
            </div>
          ) : (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
              <h2 className="text-sm font-bold text-emerald-900 mb-2">Devoir remis</h2>
              <p className="text-emerald-800 text-sm">
                Votre travail a été transmis à l&apos;enseignant. Vous le retrouverez dans
                l&apos;onglet « Mes soumissions ».
              </p>
              {assignment.submission?.submissionText && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-emerald-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Votre texte</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {assignment.submission.submissionText}
                  </p>
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

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Informations
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Statut</p>
                <p className="font-semibold text-slate-900">
                  {isSubmitted ? "Envoyé" : "Non envoyé"}
                </p>
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
