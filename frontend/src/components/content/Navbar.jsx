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
import { RefreshCw, ChevronDown, User as UserIcon, LogOut, Wifi, WifiOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
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
  const { logout, isMoodleOnline } = useAuth();
  const user = getLocalUser() || {};
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState("");
  const [syncPhase, setSyncPhase] = useState(""); // "INIT", "PUSH", "PULL", "COMPLETE"
  const [syncError, setSyncError] = useState(null);

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
    if (!isMoodleOnline) {
      toast.error("Mode Hors-ligne", { description: "La synchronisation nécessite une connexion Internet." });
      return;
    }
  
    try {
      setIsSyncing(true);
      setSyncProgress(0);
      setSyncMessage("Démarrage de la synchronisation...");
      setSyncPhase("INIT");
      setSyncError(null);
  
      console.log("[SYNC] Appel startSync...");
      const result = await startSync();
      console.log("[SYNC] Résultat:", result);
      
      if (!result?.syncId) {
        throw new Error("Pas de syncId reçu du serveur");
      }
      
      console.log("[SYNC] syncId reçu:", result.syncId);
      
      // S'abonner aux SSE
      const unsubscribe = subscribeSyncProgress(result.syncId, {
        onProgress: (data) => {
          console.log("[SSE] Progress event:", data);
          // Mettre à jour la phase et la progression
          if (data.phase) {
            setSyncPhase(data.phase);
            
            // Animation fluide de la progression
            if (data.progress !== undefined) {
              setSyncProgress(prev => {
                const diff = data.progress - prev;
                // Interpolation rapide si grand écart, sinon direct
                if (Math.abs(diff) > 10) {
                  return prev + (diff * 0.3); // Smooth interpolation
                }
                return data.progress;
              });
            }
            
            // Message selon la phase
            if (data.phase === "INIT") {
              const statusMessages = {
                checking_server: "Vérification du serveur...",
                fetching_server_time: "Synchronisation horaire...",
                ready: "Initialisation terminée",
              };
              setSyncMessage(statusMessages[data.status] || "Initialisation...");
            } else if (data.phase === "PUSH") {
              setSyncMessage(data.message || `Envoi des modifications (${data.pushed || 0} éléments)`);
            } else if (data.phase === "PULL") {
              setSyncMessage(data.message || `Récupération des nouveautés (${data.pulled || 0} éléments)`);
            } else {
              setSyncMessage(data.message || "Synchronisation en cours...");
            }
          }
        },
        onComplete: () => {
          console.log("[SSE] Sync complète");
          setSyncPhase("COMPLETE");
          setSyncProgress(100);
          setSyncMessage("À jour");
          toast.success("Synchronisation terminée avec succès", {
            description: "Tous vos cours et devoirs ont été mis à jour."
          });
          setTimeout(() => {
            setIsSyncing(false);
            setSyncProgress(0);
            setSyncMessage("");
            setSyncPhase("");
          }, 2500);
          unsubscribe();
        },
        onError: (err) => {
          console.error("[SSE] Erreur:", err);
          setSyncError(err?.message || "Erreur inconnue");
          setSyncPhase("ERROR");
          setIsSyncing(false);
          toast.error("Erreur de synchronisation", { description: err?.message || "La synchro reprendra plus tard." });
          unsubscribe();
        }
      });
  
    } catch (error) {
      console.error("[SYNC] Exception:", error);
      setSyncError(error?.message || "Erreur inconnue");
      setSyncPhase("ERROR");
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
        {isMoodleOnline ? (
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
          className={`flex items-center gap-2 text-sm font-medium transition-all shadow-sm min-w-fit whitespace-nowrap ${
            !isMoodleOnline
              ? "bg-slate-100 text-slate-400 opacity-70 cursor-not-allowed hidden sm:flex"
              : isSyncing
                ? syncPhase === "ERROR"
                  ? "bg-red-100 text-red-600 hover:bg-red-100"
                  : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
          }`}
          onClick={handleSync}
          disabled={isSyncing || !isMoodleOnline}
          title={!isMoodleOnline ? "Mode Hors-ligne" : isSyncing ? "Synchronisation en cours..." : "Synchroniser les données"}
        >
          <RefreshCw className={`h-4 w-4 flex-shrink-0 ${isSyncing ? 'animate-spin' : ''} ${syncPhase === "ERROR" ? "text-red-600" : syncPhase === "COMPLETE" ? "text-emerald-600" : "text-current"}`} />
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
      
      {/* Barre de progression de synchronisation - Rendu Professionnel */}
      <div 
        className={`w-full transition-all duration-500 ease-in-out ${
          syncPhase === "ERROR" 
            ? "bg-gradient-to-r from-red-50 via-red-50 to-red-50 border-b border-red-200/30"
            : syncPhase === "COMPLETE"
            ? "bg-gradient-to-r from-emerald-50 via-emerald-50 to-emerald-50 border-b border-emerald-200/30"
            : "bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 border-b border-blue-200/20"
        } ${
          isSyncing ? "max-h-20 py-3 opacity-100 visible" : "max-h-0 py-0 opacity-0 invisible border-b-0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6">
          {/* Ligne 1: Icône + Phase + Message + Pourcentage */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {syncPhase === "ERROR" ? (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              ) : syncPhase === "COMPLETE" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
              )}
              
              {/* Badge Phase */}
              {syncPhase && syncPhase !== "ERROR" && (
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide transition-all duration-300 ${
                  syncPhase === "INIT" ? "bg-blue-100 text-blue-700" :
                  syncPhase === "PUSH" ? "bg-purple-100 text-purple-700" :
                  syncPhase === "PULL" ? "bg-amber-100 text-amber-700" :
                  "bg-emerald-100 text-emerald-700"
                }`}>
                  {syncPhase === "INIT" ? "Initialisation" :
                   syncPhase === "PUSH" ? "Envoi" :
                   syncPhase === "PULL" ? "Récupération" :
                   "Terminé"}
                </span>
              )}
              
              {/* Message */}
              <span className={`text-sm font-medium transition-colors duration-300 ${
                syncPhase === "ERROR" 
                  ? "text-red-700"
                  : syncPhase === "COMPLETE"
                  ? "text-emerald-700"
                  : "text-slate-700"
              }`}>
                {syncError || syncMessage || "Synchronisation en cours..."}
              </span>
            </div>
            
            {/* Pourcentage */}
            <span className={`text-sm font-bold tabular-nums transition-colors duration-300 flex-shrink-0 ${
              syncPhase === "ERROR" ? "text-red-600" :
              syncPhase === "COMPLETE" ? "text-emerald-600" :
              "text-blue-600"
            }`}>
              {syncProgress.toFixed(0)}%
            </span>
          </div>
          
          {/* Ligne 2: Barre de progression */}
          <div className="w-full h-2 rounded-full bg-white/50 overflow-hidden shadow-inner backdrop-blur-sm border border-white/20">
            <div 
              className={`h-full rounded-full transition-all duration-200 ease-out ${
                syncPhase === "ERROR" 
                  ? "bg-gradient-to-r from-red-500 to-red-600 shadow-[0_0_16px_rgba(239,68,68,0.5)]"
                  : syncPhase === "COMPLETE"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-[0_0_16px_rgba(16,185,129,0.5)]"
                  : "bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 shadow-[0_0_16px_rgba(59,130,246,0.4)]"
              }`}
              style={{
                width: `${syncProgress}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}