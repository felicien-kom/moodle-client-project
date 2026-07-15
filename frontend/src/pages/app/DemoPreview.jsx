import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PATHS } from "@/router/paths";
import { Eye, LogIn, LogOut } from "lucide-react";

function DemoPreview() {
  const { loginAsGuest, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleStartDemo = () => {
    loginAsGuest();
    navigate(PATHS.app.courses.list);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-16">
          <div className="text-2xl font-light text-slate-900 dark:text-slate-50 tracking-tight">
            📚 Apperçu - Moodle Client
          </div>
          {user && user.isGuest && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Quitter la démo
            </button>
          )}
        </div>

        {/* Hero Section */}
        <div className="mb-16">
          <h1 className="text-5xl font-light text-slate-900 dark:text-slate-50 tracking-tight mb-4">
            Explorez notre plateforme
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl">
            Découvrez l'interface de gestion des cours conçue pour les enseignants, administrateurs et étudiants. Parcourez en tant qu'invité pour voir l'expérience utilisateur complète.
          </p>

          {!user?.isGuest ? (
            <button
              onClick={handleStartDemo}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              <Eye size={20} />
              Commencer la démo
            </button>
          ) : (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-900 dark:text-green-100">
              ✅ Vous êtes en mode démo en tant qu'<strong>Étudiant</strong>. Accédez à la section <strong>Cours</strong> pour explorer.
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {/* Card 1: Courses */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
            <div className="text-4xl mb-3">📖</div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Gestion des Cours
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              Visualisez la liste des cours disponibles, parcourez les détails, et consultez les sections et activités.
            </p>
            {user?.isGuest && (
              <button
                onClick={() => navigate(PATHS.app.courses.list)}
                className="text-blue-600 dark:text-blue-400 font-medium text-sm hover:underline"
              >
                Voir les cours →
              </button>
            )}
          </div>

          {/* Card 2: Roles */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Interfaces par Rôle
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              Chaque rôle (Enseignant, Admin, Étudiant) a une interface adaptée avec des permissions spécifiques.
            </p>
            <div className="text-xs space-y-1">
              <div>🎓 <strong>Enseignant</strong> : Gérer ses cours</div>
              <div>⚙️ <strong>Admin</strong> : Contrôle complet</div>
              <div>📚 <strong>Étudiant</strong> : Accès lecture</div>
            </div>
          </div>

          {/* Card 3: Responsive */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
            <div className="text-4xl mb-3">📱</div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Design Responsive
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              Interface professionnelle et épurée optimisée pour tous les écrans, du mobile au desktop.
            </p>
          </div>
        </div>

        {/* Test Users Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-6">
            Utilisateurs de Test
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Teacher */}
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="font-semibold text-slate-900 dark:text-slate-50">Tamo Gregoire</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Email: <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">tamo@example.com</code>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Rôle: <span className="font-medium">Enseignant</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Peut créer et gérer ses propres cours, ajouter des sections et activités.
              </p>
            </div>

            {/* Admin */}
            <div className="border-l-4 border-purple-500 pl-4">
              <p className="font-semibold text-slate-900 dark:text-slate-50">Tarick Keni</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Email: <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">tarick@example.com</code>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Rôle: <span className="font-medium">Administrateur</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Accès complet à tous les cours, gestion des utilisateurs et des permissions.
              </p>
            </div>

            {/* Student */}
            <div className="border-l-4 border-green-500 pl-4">
              <p className="font-semibold text-slate-900 dark:text-slate-50">Nono Jorge</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Email: <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">nono@example.com</code>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Rôle: <span className="font-medium">Étudiant</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Consultez les ressources disponibles, parcourez les cours publics.
              </p>
            </div>
          </div>

          <p className="mt-6 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-900 dark:text-blue-100">
            <strong>Mot de passe pour tous les comptes :</strong> <code className="bg-white dark:bg-slate-700 px-2 py-1 rounded">password</code>
          </p>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          {!user?.isGuest && (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Prêt à explorer la plateforme ?
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleStartDemo}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Eye size={18} />
                  Mode Invité
                </button>
                <a
                  href={PATHS.auth.login}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
                >
                  <LogIn size={18} />
                  Se Connecter
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DemoPreview;
