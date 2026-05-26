import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  Link,
  ClipboardList,
  HelpCircle,
  User,
} from "lucide-react";
import apiClient from "@/client/apiClient";

// ─── Données du cours (mock) ──────────────────────────────────────────────────
const sectionsData = [
  {
    id: "generalites",
    titre: "Généralités",
    items: [
      { type: "pdf",    nom: "Syllabus du cours",          detail: "PDF · 1.2 Mo" },
      { type: "video",  nom: "Vidéo de présentation",      detail: "Vidéo · 8 min" },
      { type: "link",   nom: "Ressources complémentaires", detail: "URL externe" },
    ],
  },
  {
    id: "chapitre1",
    titre: "Chapitre 1 — Fondamentaux",
    items: [
      { type: "pdf",    nom: "Cours — Chapitre 1",                detail: "PDF · 3.4 Mo" },
      { type: "video",  nom: "Conférence 1 — Introduction",       detail: "Vidéo · 42 min" },
      { type: "quiz",   nom: "Quiz — Chapitre 1",                 detail: "Quiz · 10 questions" },
      { type: "assign", nom: "Devoir 1 — Exercices fondamentaux", detail: "Échéance 25/01/2026" },
    ],
  },
  {
    id: "chapitre2",
    titre: "Chapitre 2 — Approfondissement",
    items: [
      { type: "pdf",    nom: "Cours — Chapitre 2",          detail: "PDF · 4.1 Mo" },
      { type: "video",  nom: "Conférence 2 — Algorithmes",  detail: "Vidéo · 55 min" },
      { type: "assign", nom: "TP Pratique — Implémentation", detail: "Échéance 05/02/2026" },
    ],
  },
  {
    id: "resume",
    titre: "Résumé",
    items: [
      { type: "pdf",  nom: "Fiche de synthèse",        detail: "PDF · 0.8 Mo" },
      { type: "link", nom: "Références bibliographiques", detail: "URL externe" },
    ],
  },
  {
    id: "evaluation",
    titre: "Évaluation finale",
    items: [
      { type: "assign", nom: "Examen final",           detail: "Échéance 20/04/2026" },
      { type: "quiz",   nom: "Quiz de révision final", detail: "Quiz · 30 questions" },
    ],
  },
];

// ─── Icône colorée selon le type de ressource ─────────────────────────────────
function ContentIcon({ type }) {
  const config = {
    pdf:    { icon: <FileText    className="w-3.5 h-3.5" />, bg: "bg-red-100",    text: "text-red-600" },
    video:  { icon: <Video       className="w-3.5 h-3.5" />, bg: "bg-blue-100",   text: "text-blue-600" },
    quiz:   { icon: <HelpCircle  className="w-3.5 h-3.5" />, bg: "bg-amber-100",  text: "text-amber-600" },
    link:   { icon: <Link        className="w-3.5 h-3.5" />, bg: "bg-purple-100", text: "text-purple-600" },
    assign: { icon: <ClipboardList className="w-3.5 h-3.5" />, bg: "bg-emerald-100", text: "text-emerald-600" },
  };
  const { icon, bg, text } = config[type] ?? config.link;
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg} ${text}`}>
      {icon}
    </div>
  );
}

// ─── Section dépliable ────────────────────────────────────────────────────────
function CourseSection({ section }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-gray-200 shadow-none rounded-xl overflow-hidden"
    >
      {/* En-tête cliquable */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4
          hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <Layers className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-[15px] font-bold text-gray-900">{section.titre}</span>
        </div>
        {open
          ? <ChevronUp   className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {/* Corps */}
      {open && (
        <div className="px-6 pb-4 pt-0 border-t border-gray-100">
          <div className="flex flex-col divide-y divide-gray-100">
            {section.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-3 cursor-pointer group first:pt-3"
              >
                <ContentIcon type={item.type} />
                <div>
                  <p className="text-sm font-medium text-gray-700
                    group-hover:text-indigo-600 transition-colors">
                    {item.nom}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Élément de navigation latérale ──────────────────────────────────────────
function NavItem({ label, active, onClick, isDetails }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
        transition-all text-left
        ${active
          ? "bg-indigo-50 text-indigo-700"
          : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
        }`}
    >
      {isDetails
        ? <Info    className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "text-indigo-600" : "text-gray-400"}`} />
        : <Layers  className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "text-indigo-600" : "text-gray-400"}`} />
      }
      {label}
    </button>
  );
}

// ─── VUE : Détail d'un cours ──────────────────────────────────────────────────
export default function CourseDetail({ cours = defaultCours, onRetour }) {
  const [activeNav, setActiveNav] = useState("details");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coursData, setCoursData] = useState(cours);
  const [sections, setSections] = useState([]);
  const [files, setFiles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [events, setEvents] = useState([]);

  // Refs pour le scroll vers chaque section
  const detailsRef = useRef(null);
  const sectionRefs = useRef({});

  // ─── Charger les données du backend au montage ─────────────────────────────
  useEffect(() => {
    loadCourseData();
  }, [cours?.id]);

  async function loadCourseData() {
    try {
      setLoading(true);
      setError(null);

      if (!cours?.id) {
        setLoading(false);
        return;
      }

      // 🔵 Appel 1: Détails du cours
      const courseResponse = await apiClient.get(`/courses/${cours.id}`);
      setCoursData(courseResponse.course || cours);

      // 🟢 Appel 2: Sections du cours
      const sectionsResponse = await apiClient.get(`/courses/${cours.id}/sections`);
      const backendSections = sectionsResponse.sections || [];

      // 🟡 Appel 3: Fichiers du cours
      const filesResponse = await apiClient.get(`/courses/${cours.id}/files`);
      const backendFiles = filesResponse.files || [];
      setFiles(backendFiles);

      // 🟣 Appel 4: Assignments
      const assignResponse = await apiClient.get(`/courses/${cours.id}/assignments`);
      const backendAssignments = assignResponse.assignments || [];
      setAssignments(backendAssignments);

      // Transformer les sections en structure pour l'interface
      const transformedSections = backendSections.map((section, idx) => {
        const items = [];

        // Ajouter les fichiers de cette section
        backendFiles.forEach(file => {
          items.push({
            type: "pdf",
            nom: file.name || file.title || "Fichier",
            detail: file.size ? `${(file.size / 1024 / 1024).toFixed(1)} Mo` : "Fichier"
          });
        });

        // Ajouter les assignments de cette section
        backendAssignments.forEach(assign => {
          const dueDate = assign.dueDate
            ? new Date(assign.dueDate * 1000).toLocaleDateString('fr-FR')
            : "Sans date";
          items.push({
            type: "assign",
            nom: assign.name || assign.title || "Devoir",
            detail: `Échéance: ${dueDate}`
          });
        });

        return {
          id: `section-${idx}`,
          titre: section.name || section.title || `Section ${idx + 1}`,
          items: items.length > 0 ? items : [{
            type: "link",
            nom: "Pas de contenu",
            detail: "Aucune ressource pour cette section"
          }]
        };
      });

      setSections(transformedSections);

      // 🟠 Appel 5: Grades
      const gradesResponse = await apiClient.get(`/courses/${cours.id}/grades`);
      setGrades(gradesResponse.grades || []);

      // ⚫ Appel 6: Events
      const eventsResponse = await apiClient.get(`/courses/${cours.id}/events`);
      setEvents(eventsResponse.events || []);

    } catch (err) {
      setError(err.message || "Erreur lors du chargement des détails du cours");
      console.error("Erreur chargement détails cours:", err);
    } finally {
      setLoading(false);
    }
  }

  function scrollTo(id) {
    setActiveNav(id);
    const ref = id === "details" ? detailsRef : sectionRefs.current[id];
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ─── État de chargement ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du cours...</p>
        </div>
      </div>
    );
  }

  // ─── État d'erreur ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-md">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <Button
            onClick={() => loadCourseData()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // Utiliser les sections du backend, sinon les mockées
  const displaySections = sections.length > 0 ? sections : sectionsData;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ── Header sombre avec nom du cours + enseignant ── */}
      {/*--<div className="bg-slate-800 text-white px-8 py-5">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={onRetour}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white
              text-sm mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'espace cours
          </button>
          <h1 className="text-xl font-extrabold mb-1.5">{cours.title}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <User className="w-3.5 h-3.5" />
            <span>Enseignant : {cours.animateur ?? "ledoux segning"}</span>
          </div>
        </div>
      </div>
      */}
      <Tabs defaultValue="cours" className="justify-center pt-10 w-full max-w-5xl mx-auto ">
  <TabsList className=" justify-center">
    <TabsTrigger value="cours">Contenu</TabsTrigger>
    <TabsTrigger value="participants">Participants</TabsTrigger>
    <TabsTrigger value="notes">Notes</TabsTrigger>
  </TabsList>
  <TabsContent value="cours">
        <button
            onClick={onRetour}
            className="flex items-center gap-1.5 "
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'espace cours
          </button>
      {/* ── Layout principal : sidebar + contenu ── */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-8 py-6 flex gap-6">
        
        {/* Sidebar navigation */}
        <aside className="w-52 flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">
            Navigation
          </p>
          <nav className="flex flex-col gap-0.5">
            <NavItem
              label="Détails"
              active={activeNav === "details"}
              onClick={() => scrollTo("details")}
              isDetails
            />
            {displaySections.map((s) => (
              <NavItem
                key={s.id}
                label={s.titre.split("—")[0].trim()}
                active={activeNav === s.id}
                onClick={() => scrollTo(s.id)}
              />
            ))}
          </nav>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 min-w-0 flex flex-col gap-4">

          {/* ── Carte Détails du cours ── */}
          <Card
            ref={detailsRef}
            className="border border-gray-200 shadow-none rounded-xl"
          >
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Détails du cours</h2>

              {/* Grille 2 colonnes */}
              <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Nom court</p>
                  <p className="text-[15px] font-semibold text-gray-900">
                    {coursData.shortName ?? coursData.title?.slice(0, 8)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Sections</p>
                  <p className="text-[15px] font-semibold text-gray-900">
                    {displaySections.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Début</p>
                  <p className="text-[15px] font-semibold text-gray-900">
                    {coursData.startDate ? new Date(coursData.startDate * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : "Non définie"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Fin</p>
                  <p className="text-[15px] font-semibold text-gray-900">
                    {coursData.endDate ? new Date(coursData.endDate * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : "Non définie"}
                  </p>
                </div>
              </div>

              <Separator className="my-5" />

              <div>
                <p className="text-xs text-gray-400 mb-1.5">Description</p>
                <p className="text-sm text-gray-500 italic leading-relaxed">
                  {coursData.summary ?? "Aucune description disponible."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ── Sections dépliables ── */}
          {displaySections.map((section) => {
            const ref = (el) => {
              if (el && !sectionRefs.current[section.id]) {
                sectionRefs.current[section.id] = { current: el };
              }
            };
            return (
              <Card
                key={section.id}
                ref={ref}
                className="border border-gray-200 shadow-none rounded-xl overflow-hidden"
              >
                <CourseSection section={section} />
              </Card>
            );
          })}

        </main>
      </div>
      </TabsContent>
      <TabsContent value="participants">Change your password here.</TabsContent>
  <TabsContent value="notes">Change your password here.</TabsContent>
</Tabs>

    </div>
  );
}

// ─── Valeur par défaut si cours non fourni (alignée sur schema.prisma) ────────
const defaultCours = {
  title:       "Machine Learning",
  shortName:   "ML",
  categoryName: "Catégorie 1",
  summary:     "Cours complet de Machine Learning couvrant les fondamentaux, les algorithmes classiques et les réseaux de neurones.",
  startDate:   1737081600, // 16/01/2026
  endDate:     null,
  visible:     true,
};