import { useNavigate } from "react-router-dom";
import { PATHS } from "@/router/paths";
import { ArrowLeft } from "lucide-react";

function Settings() {
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
            Paramètres
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-12">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow">
          <p className="text-slate-600 dark:text-slate-400">
            Les paramètres seront bientôt disponibles...
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;