// components/Navbar.tsx
import { useNavigate } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCw, Mail, HelpCircle, Settings, ChevronDown } from "lucide-react";

export function Navbar() {
  const navigate = useNavigate();

  // Fonctions de navigation
  const goToHome = () => navigate("/");
  const goToCourses = () => navigate("/courses");
  const goToEvaluations = () => navigate("/evaluations");
  const goToDashboard = () => navigate("/app");
  const goToProfile = () => navigate("/app/profile");
  const goToLogin = () => navigate("/login");

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      {/* Logo + Liens */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2 cursor-pointer" >
          <span className="text-[#f98012] font-bold text-xl">moodle</span>
          <span className="text-xs text-gray-500 border-l pl-2">Client</span>
          <span className="font-semibold text-gray-800 ml-1">LearnPlatform</span>
        </div>

        <NavigationMenu>
          <NavigationMenuList className="flex gap-1">
            <NavigationMenuItem>
              <NavigationMenuLink
                onClick={goToHome}
                className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 
                           hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
              >
                Accueil
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                onClick={goToCourses}
                className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 
                           hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
              >
                Cours
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                onClick={goToEvaluations}
                className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 
                           hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
              >
                Évaluations
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                onClick={goToDashboard}
                className="px-3 py-2 text-sm text-white bg-indigo-900 
                           rounded-md cursor-pointer hover:bg-indigo-800 transition-colors"
              >
                Tableau de bord
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Icônes droite */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-gray-600">
          <RefreshCw className="h-4 w-4" />
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
              Etudiant Un
              <Avatar className="h-7 w-7 bg-indigo-900 text-white text-xs">
                <AvatarFallback className="bg-indigo-900 text-white text-xs">ET</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={goToProfile}>
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={goToLogin}>
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