import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { PATHS } from "@/router/paths";
import { ArrowLeft, Mail, User as UserIcon } from "lucide-react";

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(PATHS.app.dashboard)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
          <h1 className="text-2xl font-light text-slate-900 dark:text-slate-50 tracking-tight">
            Mon Profil
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-12">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow">
          {/* Avatar */}
          <div className="flex justify-center mb-8">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-24 h-24 rounded-full border-4 border-blue-500"
            />
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                <UserIcon size={16} className="inline mr-2" />
                Nom
              </label>
              <p className="text-lg text-slate-900 dark:text-slate-50 mt-2">
                {user?.name}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                <Mail size={16} className="inline mr-2" />
                Email
              </label>
              <p className="text-lg text-slate-900 dark:text-slate-50 mt-2">
                {user?.email}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Rôle
              </label>
              <p className="text-lg text-slate-900 dark:text-slate-50 mt-2 capitalize">
                {user?.role === "admin" ? "Administrateur" :
                 user?.role === "teacher" ? "Enseignant" :
                 "Étudiant"}
              </p>
            </div>

            {user?.isGuest && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  ℹ️ Vous êtes actuellement en mode <strong>démo invité</strong>. Les modifications ne seront pas sauvegardées.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;