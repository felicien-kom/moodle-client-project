import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Download, BookOpen, Calendar, Users, Clock, FileText } from "lucide-react";

export function AssignmentDetailsTeacher({ assignment, onRetour }) {
  const [query, setQuery] = useState("");

  // Soumissions réelles depuis l'API
  const submissions = assignment.allSubmissions || [];

  const mappedSubmissions = submissions.map(sub => ({
    id: sub.id,
    studentName: sub.user?.name || sub.user?.email || `Étudiant #${sub.userId || sub.id}`,
    state: sub.state,
    submittedAt: sub.updatedAt || sub.createdAt || null,
    grade: sub.grade ?? null,
    submissionText: sub.submissionText || null
  }));

  const filtered = mappedSubmissions.filter(s =>
    s.studentName.toLowerCase().includes(query.toLowerCase())
  );

  // Statistiques réelles
  const totalSubmissions = submissions.length;
  const submittedCount = submissions.filter(s => s.state === "SUBMITTED" || s.state === "GRADED").length;
  const gradedCount = submissions.filter(s => s.state === "GRADED").length;
  const pendingCount = submittedCount - gradedCount;
  const draftCount = submissions.filter(s => s.state === "DRAFT").length;

  // Fichiers d'instructions
  const introFiles = assignment.introFiles || [];

  const handleGrade = (subId) => {
    alert("Ouverture de l'interface de notation pour la soumission " + subId);
  };

  // Formatage de la date d'échéance
  const formatDueDate = () => {
    if (!assignment.dueDate) return "Pas de date limite";
    return new Date(assignment.dueDate * 1000).toLocaleString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <button
            onClick={() => onRetour(false)}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Retour aux évaluations
          </button>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {assignment.name}
          </h1>
          <p className="mt-2 text-lg text-slate-500 font-medium">{assignment.course?.title || assignment.course?.shortName}</p>
        </div>
        <div className="shrink-0 pt-2 flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 text-slate-700">
            <Download className="w-4 h-4 mr-2" />
            Tout télécharger
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LISTE DES SOUMISSIONS */}
        <div className="lg:col-span-3 space-y-6">

          {/* Instructions du devoir */}
          {assignment.intro && (
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Consignes du devoir</h2>
              <div
                className="prose prose-slate prose-sm max-w-none text-slate-600"
                dangerouslySetInnerHTML={{ __html: assignment.intro }}
              />
              {introFiles.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Pièces jointes ({introFiles.length})
                  </p>
                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {introFiles.map((file) => (
                      <li key={file.id} className="flex items-center justify-between py-2.5 px-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-sm font-medium text-slate-700 truncate">{file.filename}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tableau des soumissions */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Travaux des étudiants</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher un étudiant..."
                  className="pl-9 bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-xl w-full">Étudiant</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Note</th>
                    <th className="px-4 py-3 rounded-tr-xl text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 font-bold text-slate-900">{sub.studentName}</td>
                      <td className="px-4 py-4">
                        {sub.state === "SUBMITTED" && <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold">À évaluer</span>}
                        {sub.state === "GRADED" && <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold">Évalué</span>}
                        {sub.state === "DRAFT" && <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-bold">Brouillon</span>}
                        {(sub.state === "NONE" || !sub.state) && <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded text-xs font-bold">Rien remis</span>}
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}
                      </td>
                      <td className="px-4 py-4 font-black">
                        {sub.grade !== null ? `${sub.grade}/${assignment.gradeMax || 20}` : "—"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {(sub.state === "SUBMITTED" || sub.state === "GRADED") && (
                          <Button size="sm" onClick={() => handleGrade(sub.id)} variant={sub.state === "GRADED" ? "outline" : "default"} className="rounded-lg h-8">
                            {sub.state === "GRADED" ? "Modifier note" : "Évaluer"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3">
                    <Search className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Aucune soumission trouvée</p>
                  <p className="text-xs font-medium text-slate-500 mt-1 max-w-xs">
                    {query
                      ? `Aucun étudiant ne correspond à la recherche "${query}".`
                      : "Aucun étudiant n'a encore rendu ce travail."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SIDEBAR STATS */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Aperçu</h2>

            <div className="space-y-5">
              {/* Taux de remise */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Soumissions reçues</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-black text-slate-900">{submittedCount}</p>
                  <p className="text-sm font-medium text-slate-500 mb-1">/ {totalSubmissions} étudiants</p>
                </div>
                {totalSubmissions > 0 && (
                  <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.round((submittedCount / totalSubmissions) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <Separator />

              {/* À évaluer */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">À évaluer</p>
                <p className="text-xl font-bold text-indigo-600">{pendingCount} copie{pendingCount !== 1 ? "s" : ""}</p>
              </div>
              <Separator />

              {/* Évalués */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Évalués</p>
                <p className="text-xl font-bold text-emerald-600">{gradedCount} copie{gradedCount !== 1 ? "s" : ""}</p>
              </div>
              <Separator />

              {/* Brouillons */}
              {draftCount > 0 && (
                <>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Brouillons</p>
                    <p className="text-xl font-bold text-orange-600">{draftCount}</p>
                  </div>
                  <Separator />
                </>
              )}

              {/* Note max */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Note maximale</p>
                <p className="text-sm font-bold text-slate-900">{assignment.gradeMax || 20} points</p>
              </div>
              <Separator />

              {/* Échéance */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Échéance</p>
                <p className="text-sm font-bold text-slate-900">{formatDueDate()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
