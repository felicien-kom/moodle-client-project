import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, CheckCircle, ListTodo, ClipboardCheck, RefreshCw, ArrowLeft, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getAllAssignments,
  groupAssignmentsByCourse,
  isStudentSubmitted,
} from "@/services/assignments.service";
import { useUserRole } from "@/hooks/useUserRole";
import { AssignmentCard } from "./components/AssignmentCard";
import { AssignmentDetailsStudent } from "./components/AssignmentDetailsStudent";
import { AssignmentDetailsTeacher } from "./components/AssignmentDetailsTeacher";
import { StudentCourseList } from "./components/StudentCourseList";
import { StudentAssignmentListItem } from "./components/StudentAssignmentListItem";

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-slate-200 p-5 animate-pulse h-44" />
      ))}
    </div>
  );
}

export default function Assignment() {
  const { role, isTeacher, user } = useUserRole();

  const [activeTab, setActiveTab] = useState("a-faire");
  const [query, setQuery] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devoirActuel, setDevoirActuel] = useState(null);
  const [selectedCourseGroup, setSelectedCourseGroup] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllAssignments({ moodleUserId: user?.moodleUserId });
      setAssignments(data || []);
    } catch (err) {
      const isNetwork = err?.status === 0 || !navigator.onLine;
      setError(
        isNetwork
          ? "Impossible de joindre le serveur. Vérifiez votre connexion."
          : "Une erreur s'est produite lors de la récupération des devoirs."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.moodleUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isAFaire = (a) => !isStudentSubmitted(a);
  const isTermine = (a) => isStudentSubmitted(a);

  const isTeacherAFaire = (a) => {
    const subCount = a.submittedCount || 0;
    const gradCount = a.gradedCount || 0;
    return subCount > gradCount || subCount === 0;
  };
  const isTeacherTermine = (a) =>
    (a.submittedCount || 0) === (a.gradedCount || 0) && (a.submittedCount > 0);

  const currentList = useMemo(() => {
    if (isTeacher) {
      return activeTab === "a-faire"
        ? assignments.filter(isTeacherAFaire)
        : assignments.filter(isTeacherTermine);
    }
    return activeTab === "a-faire"
      ? assignments.filter(isAFaire)
      : assignments.filter(isTermine);
  }, [assignments, activeTab, isTeacher]);

  const filteredList = useMemo(
    () =>
      currentList.filter(
        (a) =>
          a.name?.toLowerCase().includes(query.toLowerCase()) ||
          a.course?.title?.toLowerCase().includes(query.toLowerCase()) ||
          a.course?.shortName?.toLowerCase().includes(query.toLowerCase())
      ),
    [currentList, query]
  );

  const studentCourseGroups = useMemo(() => {
    if (isTeacher) return [];
    return groupAssignmentsByCourse(filteredList).map((group) => ({
      ...group,
      assignments: group.assignments.filter((a) =>
        group.assignments.some((x) => x.id === a.id)
      ),
    }));
  }, [filteredList, isTeacher]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedCourseGroup(null);
    setDevoirActuel(null);
  };

  if (devoirActuel) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          {isTeacher ? (
            <AssignmentDetailsTeacher
              assignment={devoirActuel}
              onRetour={(reload) => {
                setDevoirActuel(null);
                if (reload) fetchData();
              }}
            />
          ) : (
            <AssignmentDetailsStudent
              assignment={devoirActuel}
              onRetour={(reload) => {
                setDevoirActuel(null);
                if (reload) fetchData();
              }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Évaluations</h1>
            <p className="text-sm text-slate-500 mt-1">
              {isTeacher
                ? "Suivez les remises et corrigez les copies de vos étudiants."
                : "Parcourez vos cours, consultez les consignes et remettez vos travaux."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-xl shrink-0"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="inline-flex bg-slate-100/80 p-1 rounded-xl max-w-fit border border-slate-200/50">
            <button
              onClick={() => handleTabChange("a-faire")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === "a-faire"
                  ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-900/5"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ListTodo className="w-4 h-4" />
              {isTeacher ? "À évaluer" : "À faire"}
            </button>
            <button
              onClick={() => handleTabChange("termines")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === "termines"
                  ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-900/5"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              {isTeacher ? "Terminés" : "Mes soumissions"}
            </button>
          </div>

          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isTeacher
                  ? "Rechercher par cours ou devoir..."
                  : selectedCourseGroup
                    ? "Rechercher dans ce cours..."
                    : "Rechercher un cours..."
              }
              className="pl-11 bg-white border-slate-200 h-11 text-sm rounded-xl"
            />
          </div>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <div className="text-center py-20 bg-white border border-red-100 rounded-2xl">
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline" className="rounded-xl">
              Réessayer
            </Button>
          </div>
        ) : !isTeacher && selectedCourseGroup ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button
              type="button"
              onClick={() => setSelectedCourseGroup(null)}
              className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux cours
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedCourseGroup.course.title}</h2>
                <p className="text-sm text-slate-500">
                  {selectedCourseGroup.assignments.length} devoir
                  {selectedCourseGroup.assignments.length > 1 ? "s" : ""} —{" "}
                  {activeTab === "a-faire" ? "À faire" : "Mes soumissions"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {selectedCourseGroup.assignments
                .filter(
                  (a) =>
                    a.name?.toLowerCase().includes(query.toLowerCase()) ||
                    a.course?.title?.toLowerCase().includes(query.toLowerCase())
                )
                .map((assignment) => (
                  <StudentAssignmentListItem
                    key={assignment.id}
                    assignment={assignment}
                    showGrade={activeTab === "termines"}
                    onClick={() => setDevoirActuel(assignment)}
                  />
                ))}
            </div>
          </div>
        ) : filteredList.length > 0 ? (
          <div className="animate-in fade-in duration-500">
            {isTeacher ? (
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
              <StudentCourseList
                courseGroups={studentCourseGroups}
                onSelectCourse={setSelectedCourseGroup}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-300 rounded-2xl">
            <CheckCircle className="w-10 h-10 text-emerald-400 mb-4" />
            <p className="text-slate-600 font-bold">Aucun résultat</p>
            <p className="text-slate-400 text-sm mt-1 text-center max-w-md">
              {activeTab === "a-faire"
                ? "Vous n'avez aucun devoir en attente pour le moment."
                : "Aucune soumission enregistrée pour le moment."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
