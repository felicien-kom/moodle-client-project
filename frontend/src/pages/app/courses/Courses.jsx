import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CoursesGrid } from "@/components/courses/CoursesGrid";
import {
  deleteCourse,
  enrollInCourse,
  fetchAllCourses,
  fetchDiscoverCourses,
  fetchEnrolledCourses,
  fetchUserCourses,
} from "@/services/courses.service";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { PATHS } from "@/router/paths";
import {
  BookOpen,
  BookPlus,
  Compass,
  GraduationCap,
  LibraryBig,
  PlusCircle,
  Search,
  SearchX,
  BookMarked,
  LayoutGrid,
  Trophy,
  TrendingUp,
} from "lucide-react";

const FILTER_CATEGORIES = [
  { id: "all",          label: "Tous" },
  { id: "Developpement",label: "Développement" },
  { id: "Design",       label: "Design & UX" },
  { id: "Data Science", label: "Data Science" },
  { id: "Architecture", label: "Architecture" },
  { id: "Education",    label: "Éducation" },
  { id: "Business",     label: "Business" },
];

function EmptyState({ icon: Icon = BookOpen, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="h-7 w-7" strokeWidth={1.5} />
      </div>
      <h3 className="mb-1.5 text-base font-semibold text-slate-800">{title}</h3>
      <p className="max-w-xs text-sm leading-relaxed text-slate-500">{subtitle}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, count }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 flex-shrink-0">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900 leading-tight">{title}</h2>
        {count !== undefined && (
          <p className="text-xs text-slate-400 mt-0.5">
            {count} cours {count > 1 ? "disponibles" : "disponible"}
          </p>
        )}
      </div>
    </div>
  );
}

function Courses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isTeacher, isStudent } = useUserRole();

  const [platformCourses, setPlatformCourses] = useState([]);
  const [createdCourses, setCreatedCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [discoverCourses, setDiscoverCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      if (isAdmin) {
        const all = await fetchAllCourses({ viewerUserId: user?.id });
        setPlatformCourses(all);
        setCreatedCourses([]); setEnrolledCourses([]); setDiscoverCourses([]);
        return;
      }
      if (isTeacher) {
        const [created, enrolled, discover] = await Promise.all([
          fetchUserCourses(user?.id),
          fetchEnrolledCourses(user?.id),
          fetchDiscoverCourses(user?.id),
        ]);
        setCreatedCourses(created); setEnrolledCourses(enrolled); setDiscoverCourses(discover);
        setPlatformCourses([]);
        return;
      }
      if (isStudent) {
        const [enrolled, discover] = await Promise.all([
          fetchEnrolledCourses(user?.id),
          fetchDiscoverCourses(user?.id),
        ]);
        setEnrolledCourses(enrolled); setDiscoverCourses(discover);
        setPlatformCourses([]); setCreatedCourses([]);
      }
    } catch (err) {
      console.error("Erreur chargement cours:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, isStudent, isTeacher, user?.id]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const handleCreateCourse = () => navigate(PATHS.app.courses.create);
  const handleViewDetails  = (id) => navigate(PATHS.app.courses.detail.replace(":id", id));
  const handleEdit         = (id) => navigate(PATHS.app.courses.detail.replace(":id", id));

  const handleDelete = async (courseId) => {
    if (!window.confirm("Supprimer ce cours définitivement ?")) return;
    try { await deleteCourse(courseId); await loadCourses(); }
    catch (err) { console.error(err); }
  };

  const handleEnroll = async (courseId) => {
    if (!user?.id) return;
    try { await enrollInCourse(courseId, user.id); await loadCourses(); }
    catch (err) { console.error(err); }
  };


  const applyFilters = (list) => {
    let filtered = list;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((c) =>
        [c.title, c.description, c.category, c.createdByName].join(" ").toLowerCase().includes(q)
      );
    }
    if (activeFilter !== "all") {
      filtered = filtered.filter((c) => c.category === activeFilter);
    }
    return filtered;
  };

  const filteredPlatform = applyFilters(platformCourses);
  const filteredCreated  = applyFilters(createdCourses);
  const filteredEnrolled = applyFilters(enrolledCourses);
  const filteredDiscover = applyFilters(discoverCourses);

  // Stats calculées selon le rôle
  const adminTotalCourses   = platformCourses.length;
  const adminUniqueEnrolled = new Set(platformCourses.flatMap((c) => c.enrolledUserIds || [])).size;

  const teacherTotalStudents = createdCourses.reduce((acc, c) => acc + (c.enrolledUserIds?.length || 0), 0);
  const teacherTotalModules  = createdCourses.reduce((acc, c) => acc + (c.sections?.length || 0), 0);

  // Props grilles — plus de unenroll sur les cartes
  const gridActions = { onCardViewDetails: handleViewDetails, onCardEnroll: handleEnroll };
  const editDelete  = { onCardEdit: handleEdit, onCardDelete: handleDelete };

  return (
    <div className="w-full min-h-screen bg-[#f4f6f9]">

      {/* ===================== HERO HEADER ===================== */}
      <div className="bg-slate-900 relative overflow-hidden">
        {/* Texture légère */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.08),transparent_70%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">

            <div className="max-w-2xl">
              <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-3">
                {isAdmin ? "Administration" : isTeacher ? "Espace enseignant" : "Mon apprentissage"}
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight leading-tight">
                {isAdmin
                  ? "Gestion des cours"
                  : isTeacher
                  ? "Vos formations"
                  : "Tableau de bord"}
              </h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-lg">
                {isAdmin
                  ? "Supervisez, éditez et administrez l'ensemble des cours publiés sur la plateforme."
                  : isTeacher
                  ? "Créez, gérez vos formations et suivez celles que vous avez rejointes."
                  : "Retrouvez vos cours en cours et explorez le catalogue complet."}
              </p>

              {/* ---- Stats selon le rôle ---- */}

              {/* ADMIN : stats complètes plateforme */}
              {isAdmin && (
                <div className="flex flex-wrap gap-4 mt-7">
                  <div className="flex items-center gap-2.5 bg-white/8 border border-white/10 rounded-xl px-4 py-2.5">
                    <BookMarked className="h-5 w-5 text-slate-300" />
                    <div>
                      <p className="text-white font-bold text-lg leading-none">{adminTotalCourses}</p>
                      <p className="text-slate-400 text-xs mt-0.5">Cours publiés</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-white/8 border border-white/10 rounded-xl px-4 py-2.5">
                    <Trophy className="h-5 w-5 text-amber-400" />
                    <div>
                      <p className="text-white font-bold text-lg leading-none">{adminUniqueEnrolled}</p>
                      <p className="text-slate-400 text-xs mt-0.5">Apprenants inscrits</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ENSEIGNANT : ses stats uniquement */}
              {isTeacher && !isAdmin && (
                <div className="flex flex-wrap gap-4 mt-7">
                  <div className="flex items-center gap-2.5 bg-white/8 border border-white/10 rounded-xl px-4 py-2.5">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-white font-bold text-lg leading-none">{createdCourses.length}</p>
                      <p className="text-slate-400 text-xs mt-0.5">Cours créés</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-white/8 border border-white/10 rounded-xl px-4 py-2.5">
                    <Trophy className="h-5 w-5 text-amber-400" />
                    <div>
                      <p className="text-white font-bold text-lg leading-none">{teacherTotalStudents}</p>
                      <p className="text-slate-400 text-xs mt-0.5">Apprenants inscrits</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-white/8 border border-white/10 rounded-xl px-4 py-2.5">
                    <BookMarked className="h-5 w-5 text-slate-300" />
                    <div>
                      <p className="text-white font-bold text-lg leading-none">{teacherTotalModules}</p>
                      <p className="text-slate-400 text-xs mt-0.5">Modules publiés</p>
                    </div>
                  </div>
                </div>
              )}
              {/* ETUDIANT : pas de stats */}
            </div>

            {/* Bouton Créer */}
            {(isTeacher || isAdmin) && (
              <div className="flex-shrink-0">
                <button
                  onClick={handleCreateCourse}
                  className="flex items-center gap-2.5 bg-white text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-lg text-sm"
                >
                  <PlusCircle className="h-4.5 w-4.5" />
                  Créer un cours
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================== BARRE FILTRES ===================== */}
      <div className="sticky top-16 z-20 bg-white border-b border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row gap-3 items-center">

          {/* Recherche */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un cours ou un auteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition"
            />
          </div>

          {/* Filtres catégories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-shrink-0" style={{ scrollbarWidth: "none" }}>
            {FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all duration-200 ${
                  activeFilter === cat.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===================== CONTENU ===================== */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-16">

        {/* -- ADMIN -- */}
        {isAdmin && (
          <section>
            <SectionHeader icon={LibraryBig} title="Tous les cours de la plateforme" count={filteredPlatform.length} />
            {filteredPlatform.length > 0 || isLoading ? (
              <CoursesGrid courses={filteredPlatform} isLoading={isLoading} {...gridActions} {...editDelete} />
            ) : (
              <EmptyState icon={LibraryBig} title="Aucun cours trouvé" subtitle="Aucun cours ne correspond à votre recherche ou filtre actuel." />
            )}
          </section>
        )}

        {/* -- ENSEIGNANT -- */}
        {isTeacher && !isAdmin && (
          <>
            <section>
              <SectionHeader icon={BookPlus} title="Mes cours créés" count={filteredCreated.length} />
              {filteredCreated.length > 0 || isLoading ? (
                <CoursesGrid courses={filteredCreated} isLoading={isLoading} {...gridActions} {...editDelete} />
              ) : (
                <EmptyState
                  icon={BookPlus}
                  title="Aucun cours créé"
                  subtitle="Partagez vos connaissances en créant votre première formation. C'est simple et rapide."
                  action={
                    <button
                      onClick={handleCreateCourse}
                      className="flex items-center gap-2 bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition text-sm"
                    >
                      <PlusCircle className="h-4 w-4" /> Créer un cours
                    </button>
                  }
                />
              )}
            </section>

            <section>
              <SectionHeader icon={GraduationCap} title="Formationis suivies" count={filteredEnrolled.length} />
              {filteredEnrolled.length > 0 || isLoading ? (
                <CoursesGrid courses={filteredEnrolled} isLoading={isLoading} {...gridActions} />
              ) : (
                <EmptyState icon={GraduationCap} title="Aucune formation suivie" subtitle="En tant qu'enseignant, vous pouvez aussi suivre des cours d'autres formateurs." />
              )}
            </section>

            <section>
              <SectionHeader icon={Compass} title="Découvrir le catalogue" count={filteredDiscover.length} />
              {filteredDiscover.length > 0 || isLoading ? (
                <CoursesGrid courses={filteredDiscover} isLoading={isLoading} {...gridActions} />
              ) : (
                <EmptyState icon={Compass} title="Catalogue à jour" subtitle="Vous avez déjà accès à toutes les formations disponibles." />
              )}
            </section>
          </>
        )}

        {/* -- ETUDIANT -- */}
        {isStudent && (
          <>
            {(filteredEnrolled.length > 0 || isLoading) && (
              <section>
                <SectionHeader icon={GraduationCap} title="Mes formations en cours" count={filteredEnrolled.length} />
                <CoursesGrid courses={filteredEnrolled} isLoading={isLoading} {...gridActions} />
              </section>
            )}

            {!isLoading && enrolledCourses.length === 0 && (
              <EmptyState
                icon={GraduationCap}
                title="Commencez votre parcours"
                subtitle="Vous n'êtes inscrit à aucune formation. Explorez le catalogue ci-dessous."
              />
            )}

            <section>
              <SectionHeader icon={Compass} title="Découvrir de nouvelles formations" count={filteredDiscover.length} />
              {filteredDiscover.length > 0 || isLoading ? (
                <CoursesGrid courses={filteredDiscover} isLoading={isLoading} {...gridActions} />
              ) : (
                <EmptyState
                  icon={SearchX}
                  title={searchQuery ? "Aucun résultat" : "Catalogue complet"}
                  subtitle={searchQuery ? `Aucun cours pour « ${searchQuery} ». Essayez d'autres termes.` : "Vous avez accès à toutes les formations disponibles."}
                />
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default Courses;
