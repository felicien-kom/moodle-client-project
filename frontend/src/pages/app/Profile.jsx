import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import authService from "@/services/auth.service";
import {
  Loader2,
  KeyRound,
  AlertTriangle,
  User,
  Mail,
  ShieldAlert,
  Camera,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════
   STYLES CSS-in-JS (animations subtiles)
   ═══════════════════════════════════════════════════════════════════════ */
const fadeUpStyle = (delay = 0) => ({
  animation: `fadeUp 0.5s ease-out ${delay}s both`,
});

const fadeUpKeyframes = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes avatarPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(42,120,194, 0.3); }
  50%      { box-shadow: 0 0 0 8px rgba(42,120,194, 0); }
}
`;

/* ═══════════════════════════════════════════════════════════════════════
   SECTION : Photo de profil
   ═══════════════════════════════════════════════════════════════════════ */
function PhotoSection({ nom, photo, onPhotoChange, fileRef }) {
  const initiales = nom
    ? nom.split(" ").map((w) => w[0]?.toUpperCase() || "").join("").slice(0, 2)
    : "?";

  return (
    <div className="flex items-center gap-6" style={fadeUpStyle(0.1)}>
      <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
        <Avatar
          className="w-20 h-20 border-2 border-brand/30 shadow-md transition-transform duration-300 group-hover:scale-105"
          style={{ animation: "avatarPulse 3s ease-in-out 1" }}
        >
          {photo && <AvatarImage src={photo} alt={nom} className="object-cover" />}
          <AvatarFallback className="bg-brand/10 text-brand text-2xl font-bold">
            {initiales}
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
      </div>

      <div>
        <p className="font-semibold text-my-text-primary text-lg">{nom}</p>
        <button
          onClick={() => fileRef.current?.click()}
          className="text-brand text-sm font-medium hover:underline mt-0.5"
        >
          Changer la photo
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => onPhotoChange(ev.target.result);
          reader.readAsDataURL(file);
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION : Informations en lecture seule (données API)
   ═══════════════════════════════════════════════════════════════════════ */
function InfoSection({ user }) {
  const infos = [
    {
      icon: User,
      label: "Nom complet",
      value: user?.name || user?.username || "Non renseigné",
    },
    {
      icon: Mail,
      label: "Adresse e-mail",
      value: user?.email || "Non renseigné",
    },
    {
      icon: GraduationCap,
      label: "Identifiant Moodle",
      value: user?.username || "Non défini",
    },
  ];

  return (
    <div className="grid gap-4" style={fadeUpStyle(0.2)}>
      {infos.map(({ icon: Icon, label, value }, i) => (
        <div
          key={label}
          className="flex items-center gap-4 p-4 rounded-xl bg-my-bg border border-border transition-colors duration-200 hover:border-brand/30"
          style={fadeUpStyle(0.15 + i * 0.08)}
        >
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-my-text-muted uppercase tracking-wide">{label}</p>
            <p className="text-sm font-semibold text-my-text-primary truncate">{value}</p>
          </div>
        </div>
      ))}
      <p className="text-xs text-my-text-muted mt-1">
        Ces informations proviennent de votre inscription et de votre compte Moodle. Elles ne peuvent pas être modifiées ici.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION : Mot de passe
   ═══════════════════════════════════════════════════════════════════════ */
function PasswordSection() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  function handleSave() {
    if (!currentPwd || !newPwd || !confirmPwd) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPwd.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    // L'endpoint n'existe pas encore côté backend
    toast.info("L'API de changement de mot de passe est en cours d'intégration côté serveur.");
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
  }

  return (
    <div style={fadeUpStyle(0.3)}>
      <div className="flex flex-col gap-5 max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="current-pwd" className="text-sm font-semibold text-my-text">
            Mot de passe actuel
          </Label>
          <Input
            id="current-pwd"
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            className="bg-my-bg-light border-border focus:border-brand focus:ring-brand/20 font-mono tracking-wider"
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-pwd" className="text-sm font-semibold text-my-text">
            Nouveau mot de passe
          </Label>
          <Input
            id="new-pwd"
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            className="bg-my-bg-light border-border focus:border-brand focus:ring-brand/20 font-mono tracking-wider"
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-pwd" className="text-sm font-semibold text-my-text">
            Confirmer le mot de passe
          </Label>
          <Input
            id="confirm-pwd"
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            className="bg-my-bg-light border-border focus:border-brand focus:ring-brand/20 font-mono tracking-wider"
            placeholder="••••••••"
          />
        </div>
        <div className="flex justify-end mt-1">
          <Button
            onClick={handleSave}
            className="bg-brand hover:bg-brand/90 text-white text-sm font-semibold rounded-lg px-6 py-2.5 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            Mettre à jour
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION : Zone de danger
   ═══════════════════════════════════════════════════════════════════════ */
function DangerSection() {
  function handleDelete() {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible."
      )
    ) {
      // DELETE /auth/me est commenté dans le backend
      toast.info("L'API de suppression de compte est temporairement désactivée côté serveur.");
    }
  }

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-xl border border-danger/30 bg-danger/5"
      style={fadeUpStyle(0.4)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-4 h-4 text-danger" />
          <p className="text-sm font-bold text-danger">Supprimer le compte</p>
        </div>
        <p className="text-xs text-my-text-muted leading-relaxed">
          Toutes vos données locales (cours synchronisés, fichiers téléchargés, évaluations) seront définitivement supprimées.
        </p>
      </div>
      <Button
        onClick={handleDelete}
        variant="destructive"
        className="shrink-0 text-sm font-semibold"
      >
        Supprimer
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ═══════════════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const fileRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [freshUser, setFreshUser] = useState(null);
  const [isFetching, setIsFetching] = useState(true);

  // ── Charger les données fraîches via authService (API réelle) ──
  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      try {
        const data = await authService.getCurrentUser();
        if (!cancelled) {
          setFreshUser(data);
          if (data?.photo) setPhoto(data.photo);
        }
      } catch (err) {
        // Si l'API échoue, on utilise les données du context
        if (!cancelled) setFreshUser(null);
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }

    if (!isLoading) {
      fetchProfile();
    }

    return () => { cancelled = true; };
  }, [isLoading]);

  // L'utilisateur affiché : données fraîches de l'API > données du context
  const displayUser = freshUser || user;
  const loading = isLoading || isFetching;

  if (loading || !displayUser) {
    return (
      <div className="h-full flex-center-center">
        <Loader2 className="w-7 h-7 animate-spin text-brand" />
      </div>
    );
  }

  const nom = displayUser?.name || displayUser?.username || "Étudiant";

  function handlePhotoChange(src) {
    setPhoto(src);
    toast.success("Photo mise à jour localement.");
  }

  return (
    <>
      {/* Inject keyframes */}
      <style>{fadeUpKeyframes}</style>

      <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ── Header ─────────────────────────────────────────── */}
          <div style={fadeUpStyle(0)}>
            <h1 className="text-2xl font-bold text-my-text-primary tracking-tight">
              Mon profil
            </h1>
            <p className="text-sm text-my-text-muted mt-1">
              Consultez vos informations et gérez la sécurité de votre compte.
            </p>
          </div>

          {/* ── Carte : Profil ─────────────────────────────────── */}
          <Card className="border border-border shadow-sm rounded-2xl overflow-hidden bg-my-bg-light">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-my-text-primary flex items-center gap-2">
                <User className="w-4 h-4 text-brand" />
                Informations du profil
              </CardTitle>
              <CardDescription className="text-xs text-my-text-muted">
                Vos données d'identité issues de votre inscription Moodle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <PhotoSection
                nom={nom}
                photo={photo || displayUser?.photo}
                onPhotoChange={handlePhotoChange}
                fileRef={fileRef}
              />
              <Separator className="bg-border" />
              <InfoSection user={displayUser} />
            </CardContent>
          </Card>

          {/* ── Carte : Sécurité ───────────────────────────────── */}
          <Card className="border border-border shadow-sm rounded-2xl overflow-hidden bg-my-bg-light">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-my-text-primary flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand" />
                Sécurité &amp; Mot de passe
              </CardTitle>
              <CardDescription className="text-xs text-my-text-muted">
                Protégez l'accès à votre compte avec un mot de passe robuste.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordSection />
            </CardContent>
          </Card>

          {/* ── Zone de danger ──────────────────────────────────── */}
          <DangerSection />

          {/* ── Spacer bottom ──── */}
          <div className="h-4" />
        </div>
      </div>
      <Toaster />
    </>
  );
}