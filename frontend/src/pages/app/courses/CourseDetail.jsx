import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchCourseById,
  addSection,
  addActivity,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  unenrollFromCourse,
} from "@/services/courses.service";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { PATHS } from "@/router/paths";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowLeft,
  CalendarDays,
  UserRound,
  BookOpen,
  Trash2,
  Pencil,
  CheckCircle2,
  FileText,
  HelpCircle,
  Play,
  Clock,
  BarChart3,
  Star,
  Users,
  Globe,
  Award,
  Video,
  X,
  Volume2,
  Maximize,
  BookPlus,
} from "lucide-react";

// ---- Types d'activités ----
const ACTIVITY_TYPES = [
  { value: "video",    label: "Vidéo",     icon: Video,        className: "bg-blue-50 text-blue-600" },
  { value: "resource", label: "Ressource", icon: FileText,     className: "bg-slate-100 text-slate-600" },
  { value: "task",     label: "Exercice",  icon: CheckCircle2, className: "bg-emerald-50 text-emerald-600" },
  { value: "quiz",     label: "Quiz",      icon: HelpCircle,   className: "bg-amber-50 text-amber-600" },
];

function getActivityConfig(type) {
  return ACTIVITY_TYPES.find((t) => t.value === type) || ACTIVITY_TYPES[1];
}

// ---- Loader ----
function PageLoader() {
  return (
    <div className="w-full min-h-screen bg-[#f4f6f9] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Chargement du cours...</p>
      </div>
    </div>
  );
}

// ---- Video Hero Modal ----
function VideoModal({ videoUrl, thumbnail, title, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
        >
          <X className="h-4 w-4" />
        </button>
        <video
          src={videoUrl}
          poster={thumbnail}
          controls
          autoPlay
          className="w-full aspect-video bg-black"
        >
          Votre navigateur ne supporte pas la lecture vidéo.
        </video>
        <div className="bg-slate-900 px-5 py-4">
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          <p className="text-slate-400 text-xs mt-0.5">Aperçu de la formation</p>
        </div>
      </div>
    </div>
  );
}

/**
 * CourseDetail — Style Coursera
 * Deux colonnes : contenu principal + sidebar sticky
 * Hero vidéo/image avec overlay et bouton de lecture
 */
function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTeacher, isAdmin } = useUserRole();

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Formulaires
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingActivityForSection, setAddingActivityForSection] = useState(null);
  const [newActivity, setNewActivity] = useState({ title: "", type: "video", duration: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Enrollment
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCourseById(id, { viewerUserId: user?.id });
        setCourse(data);
        // Ouvrir la première section par défaut
        if (data.sections?.length > 0) {
          setExpandedSections({ [data.sections[0].id]: true });
        }
      } catch (err) {
        setError("Cours introuvable.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, user?.id]);

  if (isLoading) return <PageLoader />;

  if (error || !course) {
    return (
      <div className="w-full min-h-screen bg-[#f4f6f9] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
          <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-7 w-7 text-red-400" />
          </div>
          <p className="text-slate-800 font-semibold mb-1">{error || "Cours introuvable"}</p>
          <p className="text-slate-500 text-sm mb-6">Ce cours n'existe pas ou a été supprimé.</p>
          <button
            onClick={() => navigate(PATHS.app.courses.list)}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-700 transition text-sm"
          >
            Retour aux cours
          </button>
        </div>
      </div>
    );
  }

  const canEdit = isAdmin || (isTeacher && String(user?.id) === String(course.createdBy));
  const isEnrolled = course.isEnrolled;
  const moduleCount = course.sections?.length || 0;
  const activityCount = course.sections?.reduce((acc, s) => acc + (s.activities?.length || 0), 0) || 0;

  // ---- Handlers ----
  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;
    try {
      setIsSaving(true);
      const section = await addSection(id, { title: newSectionTitle });
      setCourse((prev) => ({ ...prev, sections: [...(prev.sections || []), section] }));
      setNewSectionTitle("");
      setIsAddingSection(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddActivity = async (sectionId) => {
    if (!newActivity.title.trim()) return;
    try {
      setIsSaving(true);
      const activity = await addActivity(id, sectionId, newActivity);
      setCourse((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId ? { ...s, activities: [...(s.activities || []), activity] } : s
        ),
      }));
      setNewActivity({ title: "", type: "video", duration: "" });
      setAddingActivityForSection(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm("Supprimer définitivement ce cours ?")) return;
    try {
      await deleteCourse(id);
      navigate(PATHS.app.courses.list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnroll = async () => {
    try {
      setIsEnrolling(true);
      await enrollInCourse(id, user?.id);
      const updated = await fetchCourseById(id, { viewerUserId: user?.id });
      setCourse(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (!window.confirm("Se désinscrire de ce cours ?")) return;
    try {
      setIsEnrolling(true);
      await unenrollFromCourse(id, user?.id);
      const updated = await fetchCourseById(id, { viewerUserId: user?.id });
      setCourse(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f4f6f9]">

      {/* ===== HERO SECTION ===== */}
      <div className="bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.12),transparent_60%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
          {/* Retour */}
          <button
            onClick={() => navigate(PATHS.app.courses.list)}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-8 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Retour aux cours
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
            {/* Infos principales */}
            <div>
              {/* Catégorie + niveau */}
              <div className="flex items-center gap-3 mb-4">
                {course.category && (
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                    {course.category}
                  </span>
                )}
                {course.level && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs font-semibold text-slate-400">{course.level}</span>
                  </>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight">
                {course.title}
              </h1>

              <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl mb-6">
                {course.description || "Aucune description fournie."}
              </p>

              {/* Rating */}
              {course.rating && (
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`h-4 w-4 ${s <= Math.round(course.rating) ? "fill-amber-400 text-amber-400" : "fill-slate-700 text-slate-700"}`} />
                    ))}
                  </div>
                  <span className="text-amber-400 font-bold text-sm">{course.rating.toFixed(1)}</span>
                  {course.reviewCount && (
                    <span className="text-slate-400 text-sm">({course.reviewCount} avis)</span>
                  )}
                </div>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-5 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <UserRound className="h-4 w-4" />
                  {course.createdByName}
                </span>
                {course.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {course.duration}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" />
                  {moduleCount} module{moduleCount !== 1 ? "s" : ""} · {activityCount} ressources
                </span>
                {course.startDate && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    Depuis le {new Date(course.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
              </div>

              {/* Actions édition */}
              {canEdit && (
                <div className="flex gap-3 mt-7">
                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-4 py-2 rounded-xl transition border border-white/10">
                    <Pencil className="h-4 w-4" />
                    Modifier le cours
                  </button>
                  <button
                    onClick={handleDeleteCourse}
                    className="flex items-center gap-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-sm font-medium px-4 py-2 rounded-xl transition border border-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>

            {/* === THUMBNAIL / VIDEO PREVIEW === */}
            <div className="relative group rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10 aspect-video lg:aspect-auto lg:h-56 bg-slate-800 cursor-pointer"
              onClick={() => course.previewVideo && setShowVideoModal(true)}
            >
              {course.image && (
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Bouton play centré */}
              {course.previewVideo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-xl group-hover:scale-105 transition-transform duration-300">
                    <Play className="h-7 w-7 text-white fill-white ml-0.5" />
                  </div>
                  <span className="text-white text-xs font-semibold bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                    Aperçu du cours
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== CORPS PRINCIPAL (2 colonnes) ===== */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 items-start">

          {/* ============ COLONNE GAUCHE : Syllabus ============ */}
          <div className="space-y-6">

            {/* En-tête syllabus */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Contenu du programme</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {moduleCount} section{moduleCount !== 1 ? "s" : ""} · {activityCount} ressource{activityCount !== 1 ? "s" : ""}
                </p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setIsAddingSection(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une section
                </button>
              )}
            </div>

            {/* Formulaire ajout section */}
            {canEdit && isAddingSection && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Nouvelle section</h3>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="Ex : Introduction et bases fondamentales"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition mb-4"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddSection}
                    disabled={!newSectionTitle.trim() || isSaving}
                    className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-slate-700 transition disabled:opacity-50"
                  >
                    {isSaving ? "Enregistrement..." : "Ajouter"}
                  </button>
                  <button
                    onClick={() => { setIsAddingSection(false); setNewSectionTitle(""); }}
                    className="bg-white border border-slate-200 text-slate-600 px-5 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Liste des sections */}
            {course.sections && course.sections.length > 0 ? (
              <div className="space-y-3">
                {course.sections.map((section, index) => (
                  <div key={section.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">

                    {/* Header section */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors focus:outline-none"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 text-sm">{section.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {section.activities?.length || 0} ressource{(section.activities?.length || 0) !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      {expandedSections[section.id]
                        ? <ChevronUp className="h-5 w-5 text-slate-400 flex-shrink-0" />
                        : <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />
                      }
                    </button>

                    {/* Contenu section */}
                    {expandedSections[section.id] && (
                      <div className="border-t border-slate-100 p-4 space-y-2">
                        {section.activities && section.activities.length > 0 ? (
                          section.activities.map((activity) => {
                            const config = getActivityConfig(activity.type);
                            const Icon = config.icon;
                            return (
                              <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 group/activity transition-colors cursor-pointer">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${config.className}`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-700 truncate">{activity.title}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{config.label}{activity.duration ? ` · ${activity.duration}` : ""}</p>
                                </div>
                                {activity.type === "video" && (
                                  <Play className="h-4 w-4 text-slate-400 opacity-0 group-hover/activity:opacity-100 transition-opacity flex-shrink-0" />
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-5">
                            <p className="text-xs text-slate-400 italic">En cours de développement</p>
                          </div>
                        )}

                        {/* Bouton ajout activité (enseignant/admin) */}
                        {canEdit && (
                          <>
                            {addingActivityForSection === section.id ? (
                              <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <p className="text-xs font-semibold text-slate-700 mb-3">Nouvelle ressource</p>

                                {/* Type d'activité */}
                                <div className="flex gap-1.5 flex-wrap mb-3">
                                  {ACTIVITY_TYPES.map((t) => {
                                    const TIcon = t.icon;
                                    return (
                                      <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => setNewActivity((prev) => ({ ...prev, type: t.value }))}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                                          newActivity.type === t.value
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                        }`}
                                      >
                                        <TIcon className="h-3 w-3" />
                                        {t.label}
                                      </button>
                                    );
                                  })}
                                </div>

                                <input
                                  type="text"
                                  value={newActivity.title}
                                  onChange={(e) => setNewActivity((prev) => ({ ...prev, title: e.target.value }))}
                                  placeholder="Titre de la ressource..."
                                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition mb-2"
                                  autoFocus
                                />
                                <input
                                  type="text"
                                  value={newActivity.duration}
                                  onChange={(e) => setNewActivity((prev) => ({ ...prev, duration: e.target.value }))}
                                  placeholder="Durée (ex: 15 min)"
                                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition mb-3"
                                />

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAddActivity(section.id)}
                                    disabled={!newActivity.title.trim() || isSaving}
                                    className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-700 transition disabled:opacity-50"
                                  >
                                    {isSaving ? "..." : "Ajouter"}
                                  </button>
                                  <button
                                    onClick={() => { setAddingActivityForSection(null); setNewActivity({ title: "", type: "video", duration: "" }); }}
                                    className="bg-white border border-slate-200 text-slate-600 px-4 py-1.5 rounded-xl text-xs font-medium hover:bg-slate-50 transition"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAddingActivityForSection(section.id)}
                                className="mt-1 w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition border border-dashed border-slate-200"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Ajouter une ressource
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-7 w-7 text-slate-400" strokeWidth={1.5} />
                </div>
                <p className="text-slate-600 font-medium mb-1">Programme non défini</p>
                <p className="text-slate-400 text-sm">
                  {canEdit ? "Commencez par ajouter une première section." : "L'enseignant n'a pas encore publié le contenu."}
                </p>
              </div>
            )}
          </div>

          {/* ============ COLONNE DROITE : Sidebar sticky ============ */}
          <div className="lg:sticky lg:top-24 space-y-4">

            {/* Carte d'inscription */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg shadow-slate-200/60">
              {/* Mini thumbnail */}
              {course.image && (
                <div
                  className="relative h-44 cursor-pointer group"
                  onClick={() => course.previewVideo && setShowVideoModal(true)}
                >
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {course.previewVideo && (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                        <Play className="h-5 w-5 text-slate-900 fill-slate-900 ml-0.5" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="p-5 space-y-4">
                {/* Prix/Gratuit */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">Gratuit</span>
                  <span className="text-sm text-slate-400">Accès illimité</span>
                </div>

                {/* CTA - Inscription / Reprendre */}
                {!canEdit && (
                  <>
                    {isEnrolled ? (
                      <button
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition text-sm"
                      >
                        <Play className="h-4 w-4 fill-white" />
                        Reprendre le cours
                      </button>
                    ) : (
                      <button
                        onClick={handleEnroll}
                        disabled={isEnrolling}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition text-sm disabled:opacity-70"
                      >
                        {isEnrolling ? (
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <BookPlus className="h-4 w-4" />
                        )}
                        {isEnrolling ? "Inscription..." : "S'inscrire au cours"}
                      </button>
                    )}

                    {isEnrolled && (
                      <button
                        onClick={handleUnenroll}
                        className="w-full text-slate-500 hover:text-red-500 text-xs font-medium text-center py-1 transition"
                      >
                        Se désinscrire
                      </button>
                    )}
                  </>
                )}

                {/* Ce cours comprend */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <p className="text-sm font-semibold text-slate-800">Ce cours comprend :</p>
                  {[
                    { icon: Video, label: `${activityCount} ressources multimédias` },
                    { icon: Clock, label: course.duration || "Accès à vie" },
                    { icon: BarChart3, label: `${moduleCount} sections structurées` },
                    { icon: Globe, label: "Accès en ligne uniquement" },
                    { icon: Award, label: "Attestation de réussite" },
                  ].map((item, i) => {
                    const ItemIcon = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                        <ItemIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        {item.label}
                      </div>
                    );
                  })}
                </div>

                {/* Partager */}
                <div className="pt-3 text-center">
                  <button className="text-xs text-slate-400 hover:text-slate-700 underline transition">
                    Partager ce cours
                  </button>
                </div>
              </div>
            </div>

            {/* Infos instructeur */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-semibold text-slate-800">Votre formateur</p>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0">
                  <UserRound className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{course.createdByName}</p>
                  <p className="text-xs text-slate-400">Formateur certifié</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{course.enrolledUserIds?.length || 0} apprenants</span>
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />Formateur actif</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal vidéo */}
      {showVideoModal && course.previewVideo && (
        <VideoModal
          videoUrl={course.previewVideo}
          thumbnail={course.image}
          title={course.title}
          onClose={() => setShowVideoModal(false)}
        />
      )}
    </div>
  );
}

export default CourseDetail;
