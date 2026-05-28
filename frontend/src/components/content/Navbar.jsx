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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { RefreshCw, ChevronDown, User as UserIcon, LogOut, Wifi, WifiOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import MainLogo from "@/components/custom/MainLogo";
import { getLocalUser } from "@/utils/api.utils";
import { startSync, subscribeSyncProgress } from "@/services/sync.service";
import { toast } from "sonner";

function initialsFrom(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function avatarColorFrom(name) {
  if (!name) return "from-slate-400 to-slate-600";
  const colors = [
    "from-blue-500 to-indigo-500",
    "from-emerald-500 to-teal-500",
    "from-violet-500 to-purple-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-red-500",
    "from-cyan-500 to-blue-500"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isOnline } = useAuth();
  const user = getLocalUser() || {};
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState("");

  // Fonctions de navigation
  const goToHome = () => navigate(PATHS.app.dashboard);
 // const goToCourses = () => navigate("/courses");
  const goToEvaluations = () => navigate(PATHS.app.assignment);
  const goToProfile = () => navigate(PATHS.app.profile);
  const goToLogin = () => navigate(PATHS.auth.login);
  const goToCourse = () => navigate(PATHS.app.course);
  const goToMediatheque = () => navigate(PATHS.app.mediatheque);

  // Fonction de synchronisation
  const handleSync = async () => {
    if (!isOnline) {
      toast.error("Mode Hors-ligne", { description: "La synchronisation nécessite une connexion Internet." });
      return;
    }
  
    try {
      setIsSyncing(true);
      setSyncProgress(0);
      setSyncMessage("Démarrage de la synchronisation...");
  
      const result = await startSync();
      
      // S'abonner aux SSE
      const unsubscribe = subscribeSyncProgress(result.syncId, {
        onProgress: (data) => {
          setSyncProgress(data.progress || 0);
          setSyncMessage(data.message || "Synchronisation en cours...");
        },
        onComplete: () => {
          setSyncProgress(100);
          setSyncMessage("À jour");
          toast.success("Synchronisation terminée avec succès");
          setTimeout(() => {
            setIsSyncing(false);
            setSyncProgress(0);
            setSyncMessage("");
          }, 2000);
          unsubscribe();
        },
        onError: (err) => {
          setIsSyncing(false);
          toast.error("Connexion perdue", { description: "La synchro reprendra plus tard." });
          unsubscribe();
        }
      });
  
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      toast.error("Erreur lors de la synchronisation", { description: error?.message || "Erreur inconnue" });
      setIsSyncing(false);
    }
  };

  // Détection de la route actuelle
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="flex flex-col relative z-50">
      <nav className="w-full bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
        {/* Logo + Liens */}
        <div className="flex items-center gap-8">
        <div 
          className="flex items-center cursor-pointer transition-transform hover:scale-[1.02] active:scale-95" 
          onClick={goToHome}
        >
          <MainLogo size={24} />
        </div>

        <NavigationMenu>
          <NavigationMenuList className="flex gap-1.5">
            <NavigationMenuItem>
              <NavigationMenuLink
                onClick={goToHome}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all ${
                  isActiveRoute(PATHS.app.dashboard)
                    ? "text-primary bg-primary/10 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Tableau de bord
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                onClick={goToCourse}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all ${
                  isActiveRoute(PATHS.app.course)
                    ? "text-primary bg-primary/10 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Cours
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                onClick={goToEvaluations}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all ${
                  isActiveRoute(PATHS.app.assignment)
                    ? "text-primary bg-primary/10 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Devoirs
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                onClick={goToMediatheque}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all ${
                  isActiveRoute(PATHS.app.mediatheque)
                    ? "text-primary bg-primary/10 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Médiathèque
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Icônes droite */}
      <div className="flex items-center gap-3">
        {/* Indicateur de statut réseau (Antenne active/déconnectée) */}
        {isOnline ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-semibold select-none shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi className="h-3.5 w-3.5" />
            <span className="hidden md:inline">En ligne</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-xs font-semibold select-none shadow-sm">
            <WifiOff className="h-3.5 w-3.5 text-slate-400 animate-pulse" />
            <span>Hors-ligne</span>
          </div>
        )}

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        {/* Bouton de Synchronisation amélioré */}
        <Button 
          variant={isSyncing ? "secondary" : "default"} 
          className={`flex items-center gap-2 text-sm font-medium transition-all shadow-sm ${
            !isOnline 
              ? "bg-slate-100 text-slate-400 opacity-70 cursor-not-allowed hidden sm:flex" 
              : isSyncing 
                ? "bg-slate-100 text-slate-500 hover:bg-slate-200" 
                : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
          }`}
          onClick={handleSync}
          disabled={isSyncing || !isOnline}
          title={!isOnline ? "Mode Hors-ligne" : "Synchroniser les données"}
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
          <span className="hidden sm:inline-block">
            {isSyncing ? "Synchronisation..." : "Synchroniser"}
          </span>
        </Button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2.5 text-sm text-slate-700 hover:bg-slate-100 px-2 pl-3 py-1.5 h-auto rounded-full ring-1 ring-slate-200 transition-all hover:ring-primary/30">
              <span className="font-medium hidden md:block">{user.name || "Utilisateur"}</span>
              <div className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-linear-to-br shadow-inner ${avatarColorFrom(user.name)}`}>
                <span className="text-xs font-bold text-white">{initialsFrom(user.name)}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1 relative z-[100] bg-white border-slate-200 shadow-xl rounded-xl">
            <DropdownMenuLabel className="font-normal px-2.5 py-2.5">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-slate-900">{user.name || "Utilisateur"}</p>
                <p className="text-xs leading-none text-slate-500">{user.email || user.username || "Connecté"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem onClick={goToProfile} className="cursor-pointer gap-2 py-2 text-slate-600 focus:bg-slate-50 focus:text-primary rounded-md">
              <UserIcon className="h-4 w-4" />
              <span>Mon Profil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem onClick={() => {logout(); goToLogin();}} className="cursor-pointer gap-2 py-2 text-rose-600 focus:bg-rose-50 focus:text-rose-700 rounded-md">
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </nav>
      
      {/* Barre de progression de synchronisation */}
      <div 
        className={`w-full overflow-hidden transition-all duration-500 ease-in-out bg-slate-50/95 backdrop-blur border-b border-slate-200/50 ${
          isSyncing ? "max-h-16 py-2.5 opacity-100" : "max-h-0 py-0 opacity-0 border-b-0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 animate-pulse-slow">
          <div className="flex-shrink-0">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex mb-1 items-center justify-between text-[11px] font-semibold text-slate-600">
              <span className="truncate max-w-[80%] flex items-center gap-2">
                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Échange actif</span>
                {syncMessage || "Synchronisation..."}
              </span>
              <span className={syncProgress === 100 ? "text-emerald-600 font-bold" : "text-primary"}>{syncProgress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  syncProgress === 100 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-primary animate-progress-glow"
                }`}
                style={{ width: `${Math.max(2, syncProgress)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}