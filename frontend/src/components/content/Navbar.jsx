// components/Navbar.tsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PATHS } from "@/router/paths";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCw, Mail, HelpCircle, Settings, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import DynamicAvatar from "./DynamicAvatar";
import { getLocalUser } from "@/utils/api.utils";
import { startSync } from "@/services/sync.service";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const user = getLocalUser();
  const [isSyncing, setIsSyncing] = useState(false);

  // Fonctions de navigation
  const goToHome = () => navigate(PATHS.public.home);
 // const goToCourses = () => navigate("/courses");
  const goToEvaluations = () => navigate(PATHS.app.assignment);
  const goToDashboard = () => navigate(PATHS.app.dashboard);
  const goToProfile = () => navigate(PATHS.app.profile);
  const goToLogin = () => navigate(PATHS.auth.login);
  const goToCourse = () => navigate(PATHS.app.course);

  // Fonction de synchronisation
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const result = await startSync();
      console.log("Synchronisation lancée:", result);
      alert("Synchronisation lancée avec succès");
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      alert("Erreur lors de la synchronisation: " + (error.message || error));
    } finally {
      setIsSyncing(false);
    }
  };

  // Détection de la route actuelle
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      {/* Logo + Liens */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={goToHome}>
          <span className="text-[#f98012] font-bold text-xl">moodle</span>
          <span className="text-xs text-gray-500 border-l pl-2">Client</span>
          <span className="font-semibold text-gray-800 ml-1">LearnPlatform</span>
        </div>

        <NavigationMenu>
          <NavigationMenuList className="flex gap-1">
            <NavigationMenuItem>
              <NavigationMenuLink
                onClick={goToHome}
                className={`px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
                  isActiveRoute(PATHS.public.home)
                    ? "text-white bg-indigo-900"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Accueil
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                onClick={goToCourse}
                className={`px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
                  isActiveRoute(PATHS.app.course)
                    ? "text-white bg-indigo-900"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Cours
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                onClick={goToEvaluations}
                className={`px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
                  isActiveRoute(PATHS.app.assignment)
                    ? "text-white bg-indigo-900"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Évaluations
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                onClick={goToDashboard}
                className={`px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
                  isActiveRoute(PATHS.app.dashboard)
                    ? "text-white bg-indigo-900"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Tableau de bord
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Icônes droite */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-600"
          onClick={handleSync}
          disabled={isSyncing}
          title="Synchroniser"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-600">
          <HelpCircle className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-600">
          <Mail className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-sm text-gray-700">
              {user.name}
              <DynamicAvatar name={user.name} />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={goToProfile}>
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {logout(); goToLogin();}}>
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="text-gray-600">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}