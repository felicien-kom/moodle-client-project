import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * Header premium pour l'espace Cours
 * Design épuré et professionnel
 */
export function CoursesHeader({ onSearch, onCreateClick, searchValue = "" }) {
  const { isTeacher, isAdmin } = useUserRole();
  const canCreateCourse = isTeacher || isAdmin;

  return (
    <div className="w-full border-b border-[#2A78C2]/30 bg-white">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-10">
        {/* Titre + Subtitle */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-900 tracking-tight mb-2">
            Espace Cours
          </h1>
          <p className="text-slate-600 text-base font-normal">
            Découvrez et gérez vos parcours de formation
          </p>
        </div>

        {/* Barre de recherche + Bouton Créer */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          {/* Barre de recherche */}
          <div className="flex-1 relative group">
            <Search
              size={20}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-900 transition-colors duration-200"
            />
            <Input
              type="text"
              placeholder="Rechercher un cours..."
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-800 transition-all duration-200"
            />
          </div>

          {/* Bouton Créer */}
          {canCreateCourse && (
            <button
              onClick={onCreateClick}
              className="px-6 py-3 bg-indigo-900 hover:bg-indigo-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-900/40 focus:ring-offset-2 whitespace-nowrap"
            >
              + Créer un cours
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
