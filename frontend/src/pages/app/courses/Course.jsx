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
import CreateCourseModal from "@/components/courses/ModalFormCreationCours";
import { getCatalogueOnline } from "@/services/courses.service";
import { userRole } from "@/services/user.service";
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
    pdf: { icon: <FileText className="w-4 h-4" />, bg: "bg-red-100", text: "text-red-600" },
    video: { icon: <Video className="w-4 h-4" />, bg: "bg-blue-100", text: "text-blue-600" },
    quiz: { icon: <HelpCircle className="w-4 h-4" />, bg: "bg-amber-100", text: "text-amber-600" },
    link: { icon: <Link className="w-4 h-4" />, bg: "bg-[#2A78C2]/10", text: "text-[#2A78C2]" },
    assign: { icon: <ClipboardList className="w-4 h-4" />, bg: "bg-emerald-100", text: "text-emerald-600" },
  };
  const { icon, bg, text } = map[type] || map.link;
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg} ${text}`}>
      {icon}
    </div>
  );
}

// ───  dépliable ────────────────────────────────────────────────────────
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
            ${section.isFinal ? "bg-red-600" : "bg-[#2A78C2]"}`}>
            {section.isFinal ? "✦" : section.id}
          </span>
          <span className="text-sm font-semibold text-slate-800">{section.titre}</span>
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
                  <p className="text-sm font-medium text-gray-700 group-hover:text-[#2A78C2] transition-colors">
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
function CourseCard({ cours, onClick, isExplorer = false }) {
  const imageUrl = cours.imageUrl || null;
  const defaultImage = isExplorer ? "/src/assets/defaultCourseImage.jpg" : null;

  return (
    <Card
      onClick={onClick}
      className="border border-gray-200 shadow-none rounded-xl overflow-hidden cursor-pointer
        hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {imageUrl ? (
        <MathBackground imagePath={imageUrl} />
      ) : isExplorer ? (
        <MathBackground imagePath={defaultImage} />
      ) : (
        <div className="w-full h-32 bg-blue-100 flex items-center justify-center text-3xl">🖥️</div>
      )}
      <CardContent className="p-4">
        <p className="text-sm font-bold text-slate-800 mb-0.5">{cours.title}</p>
        <p className="text-xs text-gray-400 mb-2">{cours.categoryName}</p>
      </CardContent>
    </Card>
  );
}

// ─── VUE 1 : Espace Cours ────────────────────────────────────────────────────
function EspaceCours({ onOuvrirCours }) {
  const [query, setQuery] = useState("");
  const [coursInscrits, setCoursInscrits] = useState([]);
  const [coursExplorer, setCoursExplorer] = useState([]);
  const [coursCreés, setCoursCreés] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // ─── Charger les données au montage du composant ────────────────────
  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      setLoading(true);
      setError(null);

      let enrolledCourses = [];

      // 🔵 Appel 1: Récupérer les cours inscrits (BD locale) - critique
      try {
        const responseInscrits = await apiClient.get("/courses");
        enrolledCourses = responseInscrits.courses || [];
        setCoursInscrits(enrolledCourses);
      } catch (localError) {
        console.error("Erreur lors du chargement des cours locaux:", localError);
        setCoursInscrits([]);
        // Ne pas bloquer si les cours locaux échouent, mais c'est critique
        setError("Impossible de charger les cours depuis la base locale");
      }

      // 🟢 Appel 2: Récupérer le catalogue complet (Moodle) - optionnel (mode en ligne)
      try {
        const responseCatalogue = await getCatalogueOnline();
        const allCatalogueCourses = responseCatalogue.courses || [];

        // Filtrer les cours déjà inscrits par nom pour éviter les doublons
        const explorerCourses = filterCatalogueByName(allCatalogueCourses, enrolledCourses);

        setCoursExplorer(explorerCourses);
      } catch (onlineError) {
        console.warn("Catalogue non disponible (mode hors-ligne):", onlineError);
        setCoursExplorer([]);
        // Ne pas bloquer l'affichage si le catalogue échoue
      }

    } catch (err) {
      // Erreur critique seulement si les cours locaux échouent
      if (!coursInscrits || coursInscrits.length === 0) {
        setError(err.message || "Erreur lors du chargement des cours");
      }
      console.error("Erreur chargement cours:", err);
    } finally {
      setLoading(false);
    }
  }

  function filter(arr) {
    if (!query) return arr;
    return arr.filter(c =>
      (c.title && c.title.toLowerCase().includes(query.toLowerCase())) ||
      (c.categoryName && c.categoryName.toLowerCase().includes(query.toLowerCase()))
    );
  }

  // Fonction pour filtrer le catalogue par nom de cours (exclure les cours inscrits)
  function filterCatalogueByName(catalogueCourses, enrolledCourses) {
    const enrolledNames = new Set(
      enrolledCourses.map(c => c.title?.toLowerCase().trim())
    );
    return catalogueCourses.filter(c =>
      !enrolledNames.has(c.title?.toLowerCase().trim())
    );
  }

  // Fonction appelée quand un cours est créé via la modal
  const handleCourseCreated = (newCourse) => {
    setCoursCreés((prev) => [...prev, newCourse]);
  };

  // ─── Afficher spinner pendant chargement ────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#2A78C2] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Chargement des cours...</p>
        </div>
      </div>
    );
  }

  // ─── Afficher message d'erreur ──────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <Button
            onClick={() => loadCourses()}
            className="bg-[#2A78C2] hover:bg-[#1F69AE] text-white px-6 rounded-xl font-bold shadow-sm"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const crees = filter(coursCreés);
  const inscrits = filter(coursInscrits);
  const explorer = filter(coursExplorer);
  const role = userRole();
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1F69AE] tracking-tight">Espace Cours</h1>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Retrouvez l'ensemble de vos modules et accédez à vos leçons.
            </p>
          </div>

          {role === "teacher" &&(
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#2A78C2] hover:bg-[#1F69AE] text-white rounded-full h-11 px-6 font-bold gap-2 shadow-sm transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Créer un cours
            </Button>
          )}
        </div>

        {/* Barre recherche */}
        <Card className="border-0 rounded-2xl shadow-sm bg-white mb-8 overflow-hidden">
          <CardContent className="p-1 pl-4 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher par nom de cours ou catégorie..."
              className="border-none shadow-none focus-visible:ring-0 text-sm h-12"
            />
          </CardContent>
        </Card>

        {/* Vos cours créés */}
        {crees && crees.length > 0 && (
          <div className="mb-8">
            {role === "teacher" &&(<h2 className="text-xl font-bold text-slate-800 mb-3">Vos cours enseignés</h2>)}
            <Separator className="mb-5 bg-slate-200/60" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {crees.map((c, index) => (
                <CourseCard key={`created-${c.id || index}`} cours={c} onClick={() => onOuvrirCours(c)} />
              ))}
            </div>
          </div>
        )}

        {/* Cours inscrits */}
        {inscrits.length > 0 && (
          <div className="mb-8">
           <h2 className="text-xl font-bold text-slate-800 mb-3">Vos cours inscrits</h2>
            <Separator className="mb-5 bg-slate-200/60" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {inscrits.map((c, index) => (
                <CourseCard key={`enrolled-${c.id || index}`} cours={c} onClick={() => onOuvrirCours(c)} />
              ))}
            </div>
          </div>
        )}

        {/* Explorer */}
         
        {explorer.length > 0 && role === "student" && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-3">Explorer d'autres cours</h2>
            <Separator className="mb-5 bg-slate-200/60" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {explorer.map((c, index) => (
                <CourseCard key={`explorer-${c.id || index}`} cours={c} onClick={() => onOuvrirCours(c)} isExplorer={true} />
              ))}
            </div>
          </div>
        )}
        
      
      </main>

      {/* Modal de création de cours */}
      <CreateCourseModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCourseCreated={handleCourseCreated}
      />
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