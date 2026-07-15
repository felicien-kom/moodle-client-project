import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PATHS } from "@/router/paths";
import { MOCK_USERS } from "@/services/mockAuth";
import { useEffect } from "react";
import { LogIn } from "lucide-react";

function Login() {
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();

  // Si déjà connecté, rediriger vers le dashboard
  useEffect(() => {
    if (user && !isLoading) {
      navigate(PATHS.app.dashboard, { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleQuickLogin = async (email) => {
    try {
      const userData = MOCK_USERS[email];
      await login({ email, password: userData.password });
      navigate(PATHS.app.dashboard);
    } catch (error) {
      alert("Erreur de connexion: " + error.message);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Titre */}
      <div className="mb-8">
        <h1 className="text-4xl font-light text-slate-900 dark:text-slate-50 tracking-tight mb-2">
          Connexion
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Sélectionnez un utilisateur de test pour tester l'application
        </p>
      </div>

      {/* Boutons de test rapides */}
      <div className="space-y-3 mb-8">
        {/* Enseignant */}
        <button
          onClick={() => handleQuickLogin("tamo@example.com")}
          disabled={isLoading}
          className="w-full p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <LogIn size={18} />
          <div className="text-left">
            <div className="font-semibold">Tamo Gregoire</div>
            <div className="text-xs opacity-90">Enseignant</div>
          </div>
        </button>

        {/* Admin */}
        <button
          onClick={() => handleQuickLogin("tarick@example.com")}
          disabled={isLoading}
          className="w-full p-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <LogIn size={18} />
          <div className="text-left">
            <div className="font-semibold">Tarick Keni</div>
            <div className="text-xs opacity-90">Administrateur</div>
          </div>
        </button>

        {/* Étudiant */}
        <button
          onClick={() => handleQuickLogin("nono@example.com")}
          disabled={isLoading}
          className="w-full p-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <LogIn size={18} />
          <div className="text-left">
            <div className="font-semibold">Nono Jorge</div>
            <div className="text-xs opacity-90">Étudiant</div>
          </div>
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400">
            ou
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-900 dark:text-blue-100">
        <p className="font-semibold mb-2">🔐 Différentes interfaces pour chaque rôle :</p>
        <ul className="space-y-1 text-xs">
          <li>• <strong>Enseignant</strong> : Gérer ses propres cours</li>
          <li>• <strong>Admin</strong> : Voir tous les cours, gestion complète</li>
          <li>• <strong>Étudiant</strong> : Consulter les ressources disponibles</li>
        </ul>
      </div>

      {/* Mot de passe */}
      <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Mot de passe pour tous : <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">password</code>
      </div>
    </div>
  );
}

export default Login;
