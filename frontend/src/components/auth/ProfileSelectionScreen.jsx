import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, User, GraduationCap, Shield, Wifi, WifiOff, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import LoginProfileDialog from "@/components/auth/LoginProfileDialog";
import CreateProfileDialog from "@/components/auth/CreateProfileDialog";
import MainLogo from "@/components/custom/MainLogo";

function formatLastLogin(value) {
  if (!value) return "Jamais connecte";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;

  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function roleMeta(role) {
  if (role === "TEACHER") {
    return { label: "Professeur", Icon: GraduationCap };
  }
  if (role === "ADMIN") {
    return { label: "Administrateur", Icon: Shield };
  }
  return { label: "Etudiant", Icon: User };
}

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
    "from-blue-400 to-blue-600",
    "from-emerald-400 to-emerald-600",
    "from-violet-400 to-violet-600",
    "from-amber-400 to-amber-600",
    "from-rose-400 to-rose-600",
    "from-cyan-400 to-cyan-600"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function ProfileCard({ profile, onSelect }) {
  const { Icon, label } = roleMeta(profile.role);
  const colorClasses = avatarColorFrom(profile.name);

  return (
    <Card
      className="group cursor-pointer border-transparent bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ring-1 ring-border/50 hover:ring-primary/40 overflow-hidden w-full sm:w-[260px] shrink-0"
      onClick={onSelect}
    >
      <div className="h-16 w-full bg-linear-to-b from-primary/10 to-transparent"></div>
      <CardContent className="flex min-h-[220px] flex-col items-center gap-4 px-6 pb-6 pt-0 text-center">
        <div className="relative -mt-10">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white shadow-md ring-4 ring-white transition-all group-hover:ring-primary/10">
            <div className={`flex h-full w-full items-center justify-center bg-linear-to-br ${colorClasses}`}>
              <span className="text-2xl font-bold text-white">{initialsFrom(profile.name)}</span>
            </div>
          </div>
          <Badge variant="secondary" className="absolute -bottom-2 left-1/2 -translate-x-1/2 gap-1 whitespace-nowrap text-[10px] font-semibold bg-white shadow-sm ring-1 ring-border">
            <Icon className="h-3 w-3 text-primary" />
            {label}
          </Badge>
        </div>

        <div className="mt-2 text-center w-full">
          <h3 className="truncate px-2 font-bold text-slate-800 transition-colors group-hover:text-primary">{profile.name}</h3>
          <p className="truncate text-xs font-medium text-slate-500">@{profile.username}</p>
        </div>

        <div className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-50 py-2 text-xs font-medium text-slate-500 transition-colors group-hover:bg-primary/5 group-hover:text-primary/80">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatLastLogin(profile.lastLoginAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AddProfileCard({ onClick, disabled }) {
  return (
    <Card
      className={`group border-dashed border-2 bg-slate-50/50 shadow-none transition-all duration-300 w-full sm:w-[260px] shrink-0 ${!disabled ? "cursor-pointer hover:-translate-y-2 hover:border-primary/40 hover:bg-white hover:shadow-xl" : "opacity-60 grayscale cursor-not-allowed"}`}
      onClick={!disabled ? onClick : undefined}
    >
      <CardContent className="flex h-full min-h-[260px] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border transition-transform group-hover:scale-110 group-hover:shadow-md group-hover:ring-primary/20">
          <Plus className="h-8 w-8 text-slate-400 transition-colors group-hover:text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-slate-700 transition-colors group-hover:text-primary">Nouveau Profil</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {disabled ? "Internet requis" : "Connexion avec Moodle"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfileSelectionScreen() {
  const { profiles, isOnline, refreshProfiles, isLoading } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [openLogin, setOpenLogin] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const navigate = useNavigate();

  const sortedProfiles = useMemo(
    () => [...profiles].sort((a, b) => new Date(b.lastLoginAt || 0) - new Date(a.lastLoginAt || 0)),
    [profiles]
  );

  const onSelectProfile = (profile) => {
    setSelectedProfile(profile);
    setOpenLogin(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Curved Hero Header */}
      <header className="relative w-full overflow-hidden bg-primary/95 pb-16 pt-8 text-primary-foreground shadow-lg md:rounded-b-[3rem] rounded-b-[2rem]">
        {/* Abstract background elements for color/texture */}
        <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-white/10 blur-3xl"></div>
        
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-3 pr-6 text-white shadow-inner backdrop-blur-md ring-1 ring-white/20">
              <div className="rounded-xl bg-white p-1.5 flex items-center justify-center">
                <MainLogo size={28} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Sélection de Profil</h1>
                <p className="text-xs text-primary-foreground/80 font-medium">Accédez à votre espace local</p>
              </div>
            </div>

            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
              <div
                className={`flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm backdrop-blur-md transition-all ${
                  isOnline 
                    ? "bg-white/15 text-white ring-1 ring-white/30" 
                    : "bg-warning text-warning-foreground shadow-warning/20 ring-1 ring-warning"
                }`}
              >
                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span>{isOnline ? "Mode En Ligne" : "Mode Hors Ligne"}</span>
              </div>
              
              <Button 
                variant="secondary" 
                className="group rounded-full bg-white font-semibold text-primary hover:bg-slate-50 hover:shadow-md"
                onClick={() => navigate("/")}
              >
                <User className="mr-2 h-4 w-4" />
                Continuer comme invité
                <ArrowRight className="ml-2 h-4 w-4 opacity-70 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Bonjour, qui êtes-vous ?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-primary-foreground/90 sm:text-base">
              Sélectionnez votre profil pour continuer hors ligne ou en ligne avec votre mot de passe local.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20 pt-10 sm:-mt-10 sm:pt-0 relative z-10">
        <div className="flex flex-wrap items-stretch justify-center gap-5">
          {sortedProfiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} onSelect={() => onSelectProfile(profile)} />
          ))}

          <AddProfileCard onClick={() => setOpenCreate(true)} disabled={!isOnline} />
        </div>

        {!isOnline && (
          <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-warning/20 bg-warning/5 p-5 text-center text-sm font-medium text-warning-foreground shadow-sm">
            <WifiOff className="mx-auto mb-2 h-6 w-6 text-warning/80" />
            La création de profil nécessite internet. La connexion locale avec un profil existant reste entièrement disponible hors ligne.
          </div>
        )}
      </main>

      {selectedProfile && (
        <LoginProfileDialog
          profile={selectedProfile}
          open={openLogin}
          onOpenChange={setOpenLogin}
          onSuccess={() => {
            setOpenLogin(false);
            setSelectedProfile(null);
          }}
        />
      )}

      <CreateProfileDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSuccess={() => {
          setOpenCreate(false);
          refreshProfiles();
        }}
      />
    </div>
  );
}
