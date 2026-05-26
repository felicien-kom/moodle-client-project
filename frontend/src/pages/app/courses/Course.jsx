import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Plus, Search, BookOpen, Calendar, User,
  Bell, Info, ChevronDown, ChevronUp, FileText,
  Video, Link, ClipboardList, HelpCircle,
} from "lucide-react";
import CourseDetail from "@/pages/app/courses/CourseDetail";
import apiClient from "@/client/apiClient";


// ─── Données mockées (alignées sur schema.prisma) ────────────────────────────
const coursData = {
  crees: [
    { id: 10, title: "Moodle", shortName: "MDL", categoryName: "Catégorie 1", startDate: 1736995200, visible: true },
  ],
  inscrits: [
    { id: 1, title: "Gestion de projet",    shortName: "GP", categoryName: "Catégorie 1", startDate: 1736995200, visible: true },
    { id: 2, title: "Machine Learning",      shortName: "ML", categoryName: "Catégorie 1", startDate: 1737081600, visible: true },
    { id: 3, title: "Analyse de données",    shortName: "AD", categoryName: "Catégorie 1", startDate: 1737168000, visible: true },
    { id: 4, title: "Programmation WEB",     shortName: "WEB", categoryName: "Catégorie 1", startDate: 1737676800, visible: true },
  ],
  explorer: [
    { id: 5, title: "test de cours",  shortName: "TEST", categoryName: "Catégorie 1", startDate: 1737590400, visible: true },
    { id: 6, title: "cours test2",    shortName: "T2", categoryName: "Catégorie 1", startDate: 1737590400, visible: true },
    { id: 7, title: "test cours 3",   shortName: "T3", categoryName: "Catégorie 1", startDate: 1737590400, visible: true },
    { id: 8, title: "test cours 4",   shortName: "T4", categoryName: "Catégorie 1", startDate: 1737763200, visible: true },
  ],
};

// Sections du cours (contenu style Moodle)
const sectionsData = [
  {
    id: 1, titre: "Introduction au cours",
    items: [
      { type: "pdf",    nom: "Syllabus du cours",           detail: "PDF · 1.2 Mo" },
      { type: "video",  nom: "Vidéo de présentation",       detail: "Vidéo · 8 min" },
      { type: "link",   nom: "Ressources complémentaires",  detail: "URL externe" },
    ],
  },
  {
    id: 2, titre: "Chapitre 1 — Fondamentaux",
    items: [
      { type: "pdf",    nom: "Cours — Chapitre 1",                  detail: "PDF · 3.4 Mo" },
      { type: "video",  nom: "Conférence 1 — Introduction",          detail: "Vidéo · 42 min" },
      { type: "quiz",   nom: "Quiz — Chapitre 1",                    detail: "Quiz · 10 questions" },
      { type: "assign", nom: "Devoir 1 — Exercices fondamentaux",    detail: "Échéance 25/01/2026" },
    ],
  },
  {
    id: 3, titre: "Chapitre 2 — Approfondissement",
    items: [
      { type: "pdf",    nom: "Cours — Chapitre 2",           detail: "PDF · 4.1 Mo" },
      { type: "video",  nom: "Conférence 2 — Algorithmes",   detail: "Vidéo · 55 min" },
      { type: "assign", nom: "TP Pratique — Implémentation", detail: "Échéance 05/02/2026" },
    ],
  },
  {
    id: 4, titre: "Évaluation finale", isFinal: true,
    items: [
      { type: "assign", nom: "Examen final",          detail: "Échéance 20/04/2026" },
      { type: "quiz",   nom: "Quiz de révision final", detail: "Quiz · 30 questions" },
    ],
  },
];

// ─── Image fond tableau math ──────────────────────────────────────────────────
function MathBackground({ imagePath }) {
  return (
    <div
      className="w-full h-32 relative overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: `url(${imagePath})`,
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
    </div>
  );
}




// ─── Icône type de contenu ────────────────────────────────────────────────────
function ContentIcon({ type }) {
  const map = {
    pdf:    { icon: <FileText className="w-4 h-4" />,      bg: "bg-red-100",    text: "text-red-600" },
    video:  { icon: <Video className="w-4 h-4" />,          bg: "bg-blue-100",   text: "text-blue-600" },
    quiz:   { icon: <HelpCircle className="w-4 h-4" />,     bg: "bg-amber-100",  text: "text-amber-600" },
    link:   { icon: <Link className="w-4 h-4" />,           bg: "bg-purple-100", text: "text-purple-600" },
    assign: { icon: <ClipboardList className="w-4 h-4" />,  bg: "bg-emerald-100",text: "text-emerald-600" },
  };
  const { icon, bg, text } = map[type] || map.link;
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
    <Card className="border border-gray-200 shadow-none rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
            ${section.isFinal ? "bg-red-600" : "bg-indigo-600"}`}>
            {section.isFinal ? "✦" : section.id}
          </span>
          <span className="text-sm font-semibold text-gray-900">{section.titre}</span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <CardContent className="px-5 pb-4 pt-0 border-t border-gray-100">
          <div className="flex flex-col divide-y divide-gray-100">
            {section.items.map((item, i) => (
              <div key={i}
                className="flex items-center gap-3 py-3 cursor-pointer group first:pt-2">
                <ContentIcon type={item.type} />
                <div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                    {item.nom}
                  </p>
                  <p className="text-xs text-gray-400">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Carte cours (dans la liste) ──────────────────────────────────────────────
function CourseCard({ cours, showMath, onClick }) {
  return (
    <Card
      onClick={onClick}
      className="border border-gray-200 shadow-none rounded-xl overflow-hidden cursor-pointer
        hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {showMath
        ? <MathBackground imagePath="C:\Users\Djou.A\Desktop\Moodle client Node\moodle-client-project\frontend\src\assets\img\img05.jpg" />
        : <div className="w-full h-32 bg-blue-100 flex items-center justify-center text-3xl">🖥️</div>}
      <CardContent className="p-4">
        <p className="text-sm font-bold text-gray-900 mb-0.5">{cours.title}</p>
        <p className="text-xs text-gray-400 mb-2">{cours.categoryName}</p>
        {/*
        {cours.debut && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Calendar className="w-3 h-3" />
            Début : {cours.startDate ? new Date(cours.startDate * 1000).toLocaleDateString('fr-FR') : 'Non définie'}
          </div>
        )}
        
        {cours.animateur && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
            <User className="w-3 h-3" />
            Animé par {cours.animateur}
          </div>
        )}
          */}
      </CardContent>
    </Card>
  );
}

// ─── VUE 1 : Espace Cours ────────────────────────────────────────────────────
function EspaceCours({ onOuvrirCours }) {
  const [query, setQuery] = useState("");
  const [coursInscrits, setCoursInscrits] = useState([]);
  const [coursExplorer, setCoursExplorer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Charger les données au montage du composant ────────────────────
  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      setLoading(true);
      setError(null);

      // 🔵 Appel 1: Récupérer les cours inscrits (BD locale)
      const responseInscrits = await apiClient.get("/courses");
      setCoursInscrits(responseInscrits.courses || []);

      // 🟢 Appel 2: Récupérer le catalogue complet (Moodle)
      const responseCatalogue = await apiClient.get("/courses/catalogue");
      setCoursExplorer(responseCatalogue.courses || []);

    } catch (err) {
      setError(err.message || "Erreur lors du chargement des cours");
      console.error("Erreur chargement cours:", err);
    } finally {
      setLoading(false);
    }
  }

  function filter(arr) {
    if (!query) return arr;
    return arr.filter(c =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.categoryName.toLowerCase().includes(query.toLowerCase())
    );
  }

  // ─── Afficher spinner pendant chargement ────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des cours...</p>
        </div>
      </div>
    );
  }

  // ─── Afficher message d'erreur ──────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-md">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <Button 
            onClick={() => loadCourses()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const crees    = [];
  const inscrits = filter(coursInscrits);
  const explorer = filter(coursExplorer);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Top bar */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2 cursor-pointer hover:text-indigo-600">
              <ArrowLeft className="w-4 h-4" />
              Retour au tableau de bord
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Espace Cours</h1>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-5 font-semibold gap-2">
            <Plus className="w-4 h-4" />
            Créer un nouveau cours
          </Button>
        </div>

        {/* Barre recherche */}
        <Card className="border border-gray-200 shadow-none rounded-xl mb-8">
          <CardContent className="p-1 pl-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un cours..."
              className="border-none shadow-none focus-visible:ring-0 text-sm"
            />
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-10 px-5">
              Rechercher
            </Button>
          </CardContent>
        </Card>

        {/* Vos cours créés */}
        {crees && crees.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-bold text-gray-900 mb-3">Vos cours créés</h2>
            <Separator className="mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {crees.map(c => (
                <CourseCard key={c.id} cours={c} showMath={false} onClick={() => onOuvrirCours(c)} />
              ))}
            </div>
          </div>
        )}

        {/* Cours inscrits */}
        {inscrits.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-bold text-gray-900 mb-3">Cours inscrits</h2>
            <Separator className="mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {inscrits.map(c => (
                <CourseCard key={c.id} cours={c} showMath={true} onClick={() => onOuvrirCours(c)} />
              ))}
            </div>
          </div>
        )}

        {/* Explorer */}
        {explorer.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-bold text-gray-900 mb-3">Explorer d'autres cours</h2>
            <Separator className="mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {explorer.map(c => (
                <CourseCard key={c.id} cours={c} showMath={true} onClick={() => onOuvrirCours(c)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── App principale ───────────────────────────────────────────────────────────
export default function Course() {
  const [vue, setVue] = useState("liste"); // "liste" | "detail"
  const [coursActuel, setCoursActuel] = useState(null);

  function ouvrirCours(c) {
    setCoursActuel(c);
    setVue("detail");
  }

  if (vue === "detail" && coursActuel) {
    return <CourseDetail cours={coursActuel} onRetour={() => setVue("liste")} />;
  }
  return <EspaceCours onOuvrirCours={ouvrirCours} />;
}