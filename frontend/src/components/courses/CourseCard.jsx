import { useRef, useState } from "react";
import {
  BookPlus,
  CalendarDays,
  Layers3,
  UserRound,
  Pencil,
  Trash2,
  Play,
  CheckCircle,
  Clock,
  Star,
  BarChart3,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import bannerImage from "@/assets/img/img01.jpg";

// Niveau de difficulté
const LEVEL_CONFIG = {
  "Débutant":      { label: "Débutant",      className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "Intermédiaire": { label: "Intermédiaire", className: "bg-sky-50 text-sky-700 border-sky-200" },
  "Avancé":        { label: "Avancé",        className: "bg-violet-50 text-violet-700 border-violet-200" },
};

/**
 * CourseCard — Design premium, harmonisé (Coursera / Skillshare)
 * Palette : slate-900 (Navy) / slate-600 / amber / blanc
 * - Vidéo silencieuse au hover (remplace l'image)
 * - Aucun sticker / emoji / avatar initiales
 * - Barre de progression si insrit
 */
export function CourseCard({
  courseId,
  image,
  title,
  description,
  createdBy,
  createdByName,
  startDate,
  category,
  level,
  duration,
  rating,
  reviewCount,
  sections = [],
  previewVideo,
  progress = null,
  onEdit,
  onDelete,
  onEnroll,
  onUnenroll,
  onViewDetails,
  isEnrolled = false,
}) {
  const { isTeacher, isAdmin, isStudent, user } = useUserRole();
  const [imageError, setImageError] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const isCreator = String(user?.id) === String(createdBy);
  const canEdit = (isAdmin || (isTeacher && isCreator)) && typeof onEdit === "function";
  const canDelete = (isAdmin || (isTeacher && isCreator)) && typeof onDelete === "function";
  const canEnroll = (isStudent || isTeacher) && !isCreator && !isEnrolled && typeof onEnroll === "function";
  const canViewDetails = typeof onViewDetails === "function";

  const safeImage = !imageError && image ? image : bannerImage;
  const moduleCount = Array.isArray(sections) ? sections.length : 0;
  const levelConfig = LEVEL_CONFIG[level] || null;

  const handleMouseEnter = () => {
    if (!previewVideo) return;
    setIsHovering(true);
    videoRef.current?.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    if (!previewVideo) return;
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleCardClick = () => { if (canViewDetails) onViewDetails(courseId); };
  const stopPropagation = (handler) => (e) => { e.stopPropagation(); handler(courseId); };
  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted((m) => !m);
    if (videoRef.current) videoRef.current.muted = !isMuted;
  };

  return (
    <article
      role={canViewDetails ? "button" : undefined}
      tabIndex={canViewDetails ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (canViewDetails && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onViewDetails(courseId);
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white border transition-all duration-300 ease-out ${
        canViewDetails
          ? "cursor-pointer border-slate-200 hover:border-slate-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-slate-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-800 focus-visible:ring-offset-2"
          : "cursor-default border-slate-200"
      }`}
    >
      {/* ===== MEDIA (Image + Vidéo overlay) ===== */}
      <div className="relative aspect-video overflow-hidden bg-slate-100 flex-shrink-0">

        {/* Image par défaut */}
        <img
          src={safeImage}
          alt={title}
          onError={() => setImageError(true)}
          className={`h-full w-full object-cover transition-all duration-500 ease-out ${
            isHovering && previewVideo ? "opacity-0 scale-105" : "opacity-100 scale-100 group-hover:scale-[1.03]"
          }`}
        />

        {/* Vidéo de prévisualisation (appear on hover) */}
        {previewVideo && (
          <video
            ref={videoRef}
            src={previewVideo}
            muted={isMuted}
            loop
            playsInline
            preload="none"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-400 ${
              isHovering ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* Gradient doux en bas */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

        {/* Overlay "Voir le cours" au hover */}
        {canViewDetails && !isHovering && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-slate-900 font-semibold text-sm px-4 py-2 rounded-full shadow-lg">
              <Play className="h-4 w-4 fill-slate-900" />
              Voir le cours
            </div>
          </div>
        )}

        {/* Contrôle mute visible seulement quand vidéo active */}
        {previewVideo && isHovering && (
          <button
            type="button"
            onClick={toggleMute}
            className="absolute bottom-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition z-10"
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        )}

        {/* Badge "Inscrit" */}
        {isEnrolled && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
            <CheckCircle className="h-3 w-3" />
            Inscrit
          </div>
        )}
      </div>

      {/* ===== CONTENU ===== */}
      <div className="flex flex-1 flex-col p-4 gap-2.5">

        {/* Catégorie + Niveau */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {category && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <Layers3 className="h-3 w-3" />
              {category}
            </span>
          )}
          {levelConfig && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${levelConfig.className}`}>
              {levelConfig.label}
            </span>
          )}
        </div>

        {/* Titre */}
        <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-slate-700 transition-colors duration-200 min-h-[2.5rem]">
          {title}
        </h3>

        {/* Note */}
        {rating && (
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map((s) => (
                <Star
                  key={s}
                  className={`h-3 w-3 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
                />
              ))}
            </div>
            <span className="font-bold text-slate-800">{rating.toFixed(1)}</span>
            {reviewCount && <span className="text-slate-400">({reviewCount})</span>}
          </div>
        )}

        {/* Meta : Auteur, Modules, Durée */}
        <div className="flex flex-col gap-1 text-xs text-slate-500 mt-auto pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{createdByName || "Instructeur"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              {moduleCount} module{moduleCount !== 1 ? "s" : ""}
            </span>
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                {duration}
              </span>
            )}
          </div>
        </div>

        {/* Barre de progression si inscrit */}
        {isEnrolled && progress !== null && (
          <div className="mt-1">
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>Progression</span>
              <span className="font-bold text-slate-700">{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-800 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* ===== ACTIONS ===== */}
        <div className="flex flex-col gap-2 pt-3">
          {canEnroll && (
            <button
              type="button"
              onClick={stopPropagation(onEnroll)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-800"
            >
              <BookPlus size={15} />
              S'inscrire au cours
            </button>
          )}

          {isEnrolled && !isCreator && (
            <button
              type="button"
              onClick={stopPropagation(onViewDetails)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors duration-200"
            >
              <Play size={13} className="fill-slate-700" />
              Reprendre le cours
            </button>
          )}

          {(canEdit || canDelete) && (
            <div className="flex gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={stopPropagation(onEdit)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors duration-200"
                >
                  <Pencil size={12} />
                  Modifier
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={stopPropagation(onDelete)}
                  aria-label="Supprimer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors duration-200"
                >
                  <Trash2 size={12} />
                  Supprimer
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default CourseCard;
