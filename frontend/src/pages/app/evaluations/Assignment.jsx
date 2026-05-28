import { useEffect, useState } from "react";
import { Search, CheckCircle, ListTodo, ClipboardCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllAssignments } from "@/services/assignments.service";
import { AssignmentCard } from "./components/AssignmentCard";
import { AssignmentDetailsStudent } from "./components/AssignmentDetailsStudent";
import { AssignmentDetailsTeacher } from "./components/AssignmentDetailsTeacher";

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-slate-200/60 p-6 animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="h-4 w-1/3 bg-slate-100 rounded-lg" />
            <div className="h-6 w-20 bg-slate-100 rounded-full" />
          </div>
          <div className="h-6 w-3/4 bg-slate-100 rounded-lg mb-4" />
          <div className="h-4 w-full bg-slate-100 rounded-lg mb-2" />
          <div className="h-4 w-2/3 bg-slate-100 rounded-lg" />
        </div>
      ))}
    </div>
  );
}


export default function Assignment() {
  // TODO: Remplacer par le vrai rôle issu du contexte (AuthContext)
  const role = "teacher"; // Modifier ici pour tester "student" ou "teacher"

  const [activeTab, setActiveTab] = useState("a-faire"); // "a-faire" | "termines"
  const [query, setQuery] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devoirActuel, setDevoirActuel] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllAssignments();
      setAssignments(data || []);
    } catch (err) {
      setError("Moodle est injoignable ou une erreur s'est produite lors de la récupération des devoirs.");
      console.error(err);
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role]);

  // STUDENT FILTER LOGIC
  const isAFaire = (a) => !a.submission || (a.submission.state !== "SUBMITTED" && a.submission.state !== "GRADED");
  const isTermine = (a) => a.submission && (a.submission.state === "SUBMITTED" || a.submission.state === "GRADED");

  // TEACHER FILTER LOGIC
  const isTeacherAFaire = (a) => {
    const subCount = a.submittedCount || 0;
    const gradCount = a.gradedCount || 0;
    // À évaluer : soit il y a plus de copies soumises que corrigées, soit personne n'a encore rendu (c'est en attent)
    return subCount > gradCount || subCount === 0;
  };
  const isTeacherTermine = (a) => (a.submittedCount || 0) === (a.gradedCount || 0) && (a.submittedCount > 0);

  let currentList = [];
  if (role === "teacher") {
    currentList = activeTab === "a-faire" ? assignments.filter(isTeacherAFaire) : assignments.filter(isTeacherTermine);
  } else {
    currentList = activeTab === "a-faire" ? assignments.filter(isAFaire) : assignments.filter(isTermine);
  }

  const filteredList = currentList.filter(a =>
    a.name?.toLowerCase().includes(query.toLowerCase()) ||
    a.course?.title?.toLowerCase().includes(query.toLowerCase()) ||
    a.course?.shortName?.toLowerCase().includes(query.toLowerCase())
  );

  if (devoirActuel) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {role === "teacher" ? (
            <AssignmentDetailsTeacher assignment={devoirActuel} onRetour={(reload) => { setDevoirActuel(null); if (reload) fetchData(); }} />
          ) : (
            <AssignmentDetailsStudent assignment={devoirActuel} onRetour={(reload) => { setDevoirActuel(null); if (reload) fetchData(); }} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100 selection:text-blue-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">

        {/* EN-TÊTE MINIMALISTE */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Segments Explicites */}
            <div className="inline-flex bg-slate-100/80 p-1 rounded-xl shadow-inner max-w-fit border border-slate-200/50">
              <button
                onClick={() => setActiveTab("a-faire")}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === "a-faire" ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
              >
                <ListTodo className="w-4 h-4" />
                {role === "teacher" ? "À évaluer" : "Mes devoirs"}
              </button>
              <button
                onClick={() => setActiveTab("termines")}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === "termines" ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                {role === "teacher" ? "Terminés" : "Mes soumissions"}
              </button>
            </div>

            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={role === "teacher" ? "Rechercher par classe ou par devoir..." : "Rechercher un devoir..."}
                className="pl-11 bg-white border-0 ring-1 ring-inset ring-slate-200 h-12 text-sm font-medium focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl w-full shadow-sm"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <div className="text-center py-20 bg-white border border-red-100 rounded-3xl shadow-sm">
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline" className="rounded-xl">Réessayer</Button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {filteredList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredList.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    role={role}
                    onClick={() => setDevoirActuel(assignment)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-slate-600 font-bold text-base">Aucun résultat trouvé !</p>
                {query ? (
                  <p className="text-slate-400 font-medium text-sm mt-1 text-center max-w-sm">
                    Aucune correspondance pour "<strong>{query}</strong>". Essayez de changer vos mots clés.
                  </p>
                ) : (
                  <p className="text-slate-400 font-medium text-sm mt-1 text-center max-w-md">
                    {role === "teacher"
                      ? activeTab === "a-faire"
                        ? "Vous êtes à jour ! Aucune copie n'est actuellement en attente d'évaluation de votre côté."
                        : "Vous n'avez pas encore évalué de copies pour cette sélection."
                      : activeTab === "a-faire"
                        ? "Excellent ! Vous n'avez aucun devoir en attente."
                        : "Aucun devoir terminé n'est disponible."}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}