import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Plus, Search, BookOpen, Calendar, User,
  Bell, Info, ChevronDown, ChevronUp, FileText,
  Video, Link, ClipboardList, HelpCircle,
} from "lucide-react";
import CourseDetail from "@/components/content/CourseDetail";

// ─── Données mockées ──────────────────────────────────────────────────────────
const coursData = {
  crees: [
    { id: 10, nom: "Moodle", cat: "Catégorie 1", animateur: "ledoux segning", debut: null },
  ],
  inscrits: [
    { id: 1, nom: "Gestion de projet",    cat: "Catégorie 1", debut: "15/01/2026" },
    { id: 2, nom: "Machine Learning",      cat: "Catégorie 1", debut: "16/01/2026" },
    { id: 3, nom: "Analyse de données",    cat: "Catégorie 1", debut: "17/01/2026" },
    { id: 4, nom: "Programmation WEB",     cat: "Catégorie 1", debut: "23/01/2026" },
  ],
  explorer: [
    { id: 5, nom: "test de cours",  cat: "Catégorie 1", debut: "22/01/2026" },
    { id: 6, nom: "cours test2",    cat: "Catégorie 1", debut: "22/01/2026" },
    { id: 7, nom: "test cours 3",   cat: "Catégorie 1", debut: "22/01/2026" },
    { id: 8, nom: "test cours 4",   cat: "Catégorie 1", debut: "24/01/2026" },
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
function MathBackground() {
  return (
    <div className="w-full h-32 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#1a4731,#2d6a4f)" }}>
      <svg width="100%" height="100%" viewBox="0 0 300 130"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 opacity-30">
        <text x="10" y="18" fontSize="9" fill="white" fontFamily="serif">E=mc²  ∑n²  √16  sin30°  x+y</text>
        <text x="10" y="34" fontSize="9" fill="white" fontFamily="serif">∫f(x)dx  lim→∞  ∂/∂x  (1+1)²</text>
        <text x="10" y="50" fontSize="9" fill="white" fontFamily="serif">(a+b)²=a²+2ab+b²  XY=√6  ABC</text>
        <text x="10" y="66" fontSize="9" fill="white" fontFamily="serif">x=(-b±√Δ)/2a  AB=√(x²+y²)</text>
        <text x="10" y="82" fontSize="9" fill="white" fontFamily="serif">f'(x)=lim(h→0)[f(x+h)-f(x)]/h</text>
        <text x="10" y="98" fontSize="9" fill="white" fontFamily="serif">π≈3.14159  e≈2.71828  cos²+sin²=1</text>
        <text x="10" y="114" fontSize="9" fill="white" fontFamily="serif">det(M)=ad-bc  A·B=|A||B|cosθ</text>
      </svg>
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
        ? <MathBackground />
        : <div className="w-full h-32 bg-blue-100 flex items-center justify-center text-3xl">🖥️</div>}
      <CardContent className="p-4">
        <p className="text-sm font-bold text-gray-900 mb-0.5">{cours.nom}</p>
        <p className="text-xs text-gray-400 mb-2">{cours.cat}</p>
        {/*
        {cours.debut && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Calendar className="w-3 h-3" />
            Début : {cours.debut}
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

  function filter(arr) {
    if (!query) return arr;
    return arr.filter(c =>
      c.nom.toLowerCase().includes(query.toLowerCase()) ||
      c.cat.toLowerCase().includes(query.toLowerCase())
    );
  }

  const crees    = filter(coursData.crees);
  const inscrits = filter(coursData.inscrits);
  const explorer = filter(coursData.explorer);

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
        {crees.length > 0 && (
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