import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UploadCloud, File, Trash2, Calendar, BookOpen, FileText, Clock, Download } from "lucide-react";
import { submitAssignmentDraft, submitAssignmentFinal } from "@/services/assignments.service";
import { StudentStatusBadge } from "./StudentStatusBadge";

export function AssignmentDetailsStudent({ assignment, onRetour }) {
  const [textResponse, setTextResponse] = useState(assignment.submission?.submissionText || "");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState(null);
  const fileInputRef = useRef(null);

  const isSubmitted = assignment.submission?.state === "SUBMITTED" || assignment.submission?.state === "GRADED";
  const isDraft = assignment.submission?.state === "DRAFT";
  const allowsText = assignment.allowedTypes === "text" || assignment.allowedTypes === "both" || !assignment.allowedTypes;
  const allowsFiles = assignment.allowedTypes === "file" || assignment.allowedTypes === "both" || !assignment.allowedTypes;

  // Fichiers d'instructions du professeur (introFiles)
  const introFiles = assignment.introFiles || [];

  const handleFileSelect = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveDraft = async () => {
    try {
      setIsSubmitting(true);
      setErrorSubmit(null);
      await submitAssignmentDraft(assignment.id, textResponse, selectedFiles);
      alert("Brouillon sauvegardé avec succès.");
      onRetour(true);
    } catch (err) {
      setErrorSubmit(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (!confirm("Êtes-vous sûr de vouloir remettre ce devoir définitivement ? Vous ne pourrez plus le modifier.")) return;
    try {
      setIsSubmitting(true);
      setErrorSubmit(null);
      await submitAssignmentFinal(assignment.id);
      alert("Devoir remis définitivement.");
      onRetour(true);
    } catch (err) {
      setErrorSubmit(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatage de la date d'échéance
  const formatDueDate = () => {
    if (!assignment.dueDate) return "Pas de date limite";
    return new Date(assignment.dueDate * 1000).toLocaleString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Calcul du temps restant
  const getTimeRemaining = () => {
    if (!assignment.dueDate) return null;
    const now = Math.floor(Date.now() / 1000);
    const diff = assignment.dueDate - now;
    if (diff < 0) return "Délai dépassé";
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    if (days > 0) return `${days} jour${days > 1 ? "s" : ""} et ${hours}h restants`;
    return `${hours}h restantes`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <button
            onClick={() => onRetour(false)}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Retour aux évaluations
          </button>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {assignment.name}
          </h1>
          <p className="mt-2 text-lg text-slate-500 font-medium">{assignment.course?.title || assignment.course?.shortName}</p>
        </div>
        <div className="shrink-0 pt-2">
          <StudentStatusBadge assignment={assignment} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLONNE GAUCHE */}
        <div className="lg:col-span-2 space-y-6">

          {/* Instructions du professeur */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Instructions</h2>
            <div
              className="prose prose-slate max-w-none text-slate-600 prose-p:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: assignment.intro || "Aucune instruction n'a été définie pour ce devoir." }}
            />

            {/* Fichiers joints du professeur */}
            {introFiles.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Fichiers joints ({introFiles.length})
                </p>
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {introFiles.map((file) => (
                    <li key={file.id} className="flex items-center justify-between py-3 px-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-sm font-medium text-slate-700 truncate">{file.filename}</span>
                        {file.filesize && (
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {Math.round(file.filesize / 1024)} Ko
                          </span>
                        )}
                      </div>
                      <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Zone de soumission (visible uniquement si pas encore soumis) */}
          {!isSubmitted && (
            <div className="bg-white rounded-3xl border border-blue-100 p-6 md:p-8 shadow-sm shadow-blue-50">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Votre travail</h2>

              {errorSubmit && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100">
                  {errorSubmit}
                </div>
              )}

              {allowsText && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Texte en ligne</label>
                  <Textarea
                    placeholder="Saisissez votre réponse ici..."
                    className="min-h-[150px] resize-y rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    value={textResponse}
                    onChange={(e) => setTextResponse(e.target.value)}
                  />
                </div>
              )}

              {allowsFiles && (
                <div className="mb-8">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fichiers joints</label>

                  <div className="mt-2 flex justify-center rounded-2xl border border-dashed border-slate-300 px-6 py-10 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="text-center">
                      <UploadCloud className="mx-auto h-10 w-10 text-blue-500" aria-hidden="true" />
                      <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                        <label className="relative cursor-pointer rounded-md font-semibold text-blue-600 focus-within:outline-none hover:text-blue-500">
                          <span>Sélectionner des fichiers</span>
                          <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={handleFileSelect} />
                        </label>
                        <p className="pl-1">ou glissez-déposez</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">PDF, DOC, ZIP (Max {assignment.maxFileSize ? Math.round(assignment.maxFileSize / 1024 / 1024) : 10}MB)</p>
                    </div>
                  </div>

                  {selectedFiles.length > 0 && (
                    <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
                      {selectedFiles.map((file, idx) => (
                        <li key={idx} className="flex items-center justify-between py-3 pl-4 pr-3 text-sm">
                          <div className="flex w-0 flex-1 items-center">
                            <File className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                            <span className="ml-2 w-0 flex-1 truncate font-medium">{file.name}</span>
                          </div>
                          <div className="ml-4 flex shrink-0">
                            <button type="button" onClick={(e) => { e.stopPropagation(); clearFiles(); }} className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100">
                <Button
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  variant="outline"
                  className="w-full sm:w-auto rounded-xl h-12 font-bold text-slate-700 border-slate-200"
                >
                  Enregistrer un brouillon
                </Button>
                <Button
                  onClick={handleSubmitFinal}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto rounded-xl h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? "Envoi en cours..." : "Remettre le devoir"}
                </Button>
              </div>
            </div>
          )}

          {/* Confirmation de soumission */}
          {isSubmitted && (
            <div className="bg-emerald-50 rounded-3xl border border-emerald-100 p-6 md:p-8 shadow-sm">
              <h2 className="text-sm font-bold text-emerald-900 uppercase tracking-widest mb-2">Devoir remis</h2>
              <p className="text-emerald-700 font-medium">Vous avez soumis ce travail. Il n'est plus modifiable.</p>
              {assignment.submission?.grade != null && (
                <div className="mt-6 p-4 bg-white rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="font-bold text-slate-600">Note obtenue :</span>
                  <span className="text-2xl font-black text-emerald-600">{assignment.submission.grade} / {assignment.gradeMax || 20}</span>
                </div>
              )}
              {assignment.submission?.feedback && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-emerald-200">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Feedback du professeur</span>
                  <p className="text-sm text-slate-700">{assignment.submission.feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLONNE DROITE : Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Détails de remise</h2>

            <div className="space-y-5">
              {/* Statut */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Statut</p>
                <p className="text-sm font-bold text-slate-900">
                  {isSubmitted
                    ? "Remis pour évaluation"
                    : isDraft
                      ? "Brouillon enregistré"
                      : "Aucune tentative"}
                </p>
              </div>
              <Separator />

              {/* Échéance */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Échéance</p>
                <p className="text-sm font-bold text-slate-900">{formatDueDate()}</p>
                {!isSubmitted && getTimeRemaining() && (
                  <p className="text-xs font-medium text-slate-500 mt-1">{getTimeRemaining()}</p>
                )}
              </div>
              <Separator />

              {/* Cours */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cours</p>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-sm font-bold text-slate-900">{assignment.course?.title || "—"}</p>
                </div>
                {assignment.course?.shortName && (
                  <p className="text-xs text-slate-500 mt-0.5 ml-5.5">{assignment.course.shortName}</p>
                )}
              </div>
              <Separator />

              {/* Note max */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Note maximale</p>
                <p className="text-sm font-bold text-slate-900">{assignment.gradeMax || 20} points</p>
              </div>

              {/* Dernière modification de la soumission */}
              {assignment.submission?.updatedAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dernière modification</p>
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(assignment.submission.updatedAt).toLocaleString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
