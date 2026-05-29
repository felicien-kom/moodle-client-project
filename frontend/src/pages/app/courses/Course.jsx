import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, Search, BookOpen, User,
  ChevronDown, ChevronUp, FileText,
  Video, Link, ClipboardList, HelpCircle,
} from "lucide-react";
import image01 from "@/assets/img/img01.jpg";
import image02 from "@/assets/img/img02.jpg";
import image03 from "@/assets/img/img03.avif";
import image04 from "@/assets/img/img04.avif";
import image05 from "@/assets/img/img05.jpg";
import image06 from "@/assets/img/img06.jpg";
import image07 from "@/assets/img/img07.avif";
import CourseDetail from "@/pages/app/courses/CourseDetail";
import apiClient from "@/client/apiClient";
import CreateCourseModal from "@/components/courses/ModalFormCreationCours";
import { EmptyState } from "@/components/courses/EmptyState";
import { getCatalogueOnline } from "@/services/courses.service";
import { useUserRole } from "@/hooks/useUserRole";

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
    link: { icon: <Link className="w-4 h-4" />, bg: "bg-purple-100", text: "text-purple-600" },
    assign: { icon: <ClipboardList className="w-4 h-4" />, bg: "bg-emerald-100", text: "text-emerald-600" },
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

const EXPLORER_PLACEHOLDER_IMAGES = [
  image01,
  image02,
  image03,
  image04,
  image05,
  image06,
  image07,
];

const getExplorerPlaceholderImage = (seed) => {
  const key = seed || "default";
  const hash = Array.from(String(key)).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return EXPLORER_PLACEHOLDER_IMAGES[Math.abs(hash) % EXPLORER_PLACEHOLDER_IMAGES.length];
};

// ─── Carte cours (dans la liste) ──────────────────────────────────────────────
function CourseCard({ cours, onClick, isExplorer = false }) {
  const hasActualImage = cours.imageUrl || cours.image;
  const imageUrl = hasActualImage ? (cours.imageUrl || cours.image) : isExplorer ? getExplorerPlaceholderImage(cours.id || cours.title) : null;

  return (
    <Card
      onClick={onClick}
      className="border border-gray-200 shadow-none rounded-3xl overflow-hidden cursor-pointer bg-white
        hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {imageUrl ? (
        <MathBackground imagePath={imageUrl} />
      ) : (
        <div className="w-full h-32 bg-blue-100 flex items-center justify-center text-3xl">🖥️</div>
      )}
      <CardContent className="p-4">
        <p className="text-sm font-semibold text-slate-900 mb-0.5 line-clamp-2">{cours.title}</p>
        {cours.categoryName && (
          <p className="text-xs text-slate-500 line-clamp-1">{cours.categoryName}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── VUE 1 : Espace Cours ────────────────────────────────────────────────────
function EspaceCours({ onOuvrirCours }) {
  const { isTeacher } = useUserRole();
  const [query, setQuery] = useState("");
  const [coursInscrits, setCoursInscrits] = useState([]);
  const [coursExplorer, setCoursExplorer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showAllExplorer, setShowAllExplorer] = useState(false);

  // ─── Charger les données au montage du composant ────────────────────
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
      if (!enrolledCourses || enrolledCourses.length === 0) {
        setError(err.message || "Erreur lors du chargement des cours");
      }
      console.error("Erreur chargement cours:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setCoursInscrits((prev) => [newCourse, ...prev]);
  };

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

  const createdCourses = isTeacher ? filter(coursInscrits) : [];
  const enrolledCourses = isTeacher ? [] : filter(coursInscrits);
  const explorer = filter(coursExplorer);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Espace Cours
            </h1>
            <p className="text-sm text-slate-600 max-w-xl">
              {isTeacher
                ? "Gérez vos cours créés et suivez vos parcours pédagogiques."
                : "Retrouvez les cours où vous êtes inscrit et découvrez de nouvelles formations."}
            </p>
          </div>

          {isTeacher && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-5 font-semibold gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Créer un nouveau cours
            </Button>
          )}
        </div>

        <Card className="border border-slate-200/80 shadow-sm rounded-2xl mb-10 bg-white">
          <CardContent className="p-2 pl-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un cours..."
              className="border-none shadow-none focus-visible:ring-0 text-sm bg-transparent"
            />
          </CardContent>
        </Card>

        {isTeacher ? (
          <div>
            {createdCourses.length > 0 ? (
              <>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
                  Vos cours créés
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {createdCourses.map((c, index) => (
                    <CourseCard key={`created-${c.id || index}`} cours={c} onClick={() => onOuvrirCours(c)} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="Aucun cours créé pour le moment"
                description="Vous pouvez créer un nouveau cours immédiatement. Tous vos cours créés apparaîtront ici." 
                actionLabel="Créer un cours"
                onAction={() => setIsCreateModalOpen(true)}
              />
            )}
          </div>
        ) : (
          <>
            {/* Cours inscrits */}
            {enrolledCourses.length > 0 ? (
              <div className="mb-10">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
                  Cours inscrits
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {enrolledCourses.map((c, index) => (
                    <CourseCard key={`enrolled-${c.id || index}`} cours={c} onClick={() => onOuvrirCours(c)} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={User}
                title="Vous n'êtes inscrit à aucun cours"
                description="Explorez le catalogue pour découvrir de nouvelles formations et vous inscrire à votre premier cours."
                actionLabel="Explorer les cours"
                onAction={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              />
            )}

            {/* Explorer */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
                Explorer d&apos;autres cours
              </h2>
              {explorer.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {(showAllExplorer ? explorer : explorer.slice(0, 8)).map((c, index) => (
                      <CourseCard
                        key={`explorer-${c.id || index}`}
                        cours={c}
                        onClick={() => onOuvrirCours({ ...c, isExplorer: true })}
                        isExplorer={true}
                      />
                    ))}
                  </div>
                  {explorer.length > 8 && (
                    <div className="mt-6 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowAllExplorer((prev) => !prev)}
                        className="rounded-full px-6 py-2 text-sm"
                      >
                        {showAllExplorer ? "Réduire" : `Afficher ${explorer.length - 8} cours supplémentaires`}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  icon={Search}
                  title="Aucun cours trouvé"
                  description="Le catalogue n'est pas disponible pour le moment. Essayez de revenir plus tard."
                />
              )}
            </div>
          </>
        )}
      </div>

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
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  if (vue === "detail" && coursActuel) {
    return <CourseDetail cours={coursActuel} onRetour={() => setVue("liste")} />;
  }
  return <EspaceCours onOuvrirCours={ouvrirCours} />;
}