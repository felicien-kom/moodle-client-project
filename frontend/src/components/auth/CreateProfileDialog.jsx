import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Eye, EyeOff, Info, Loader2, WifiOff, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const INITIAL_FORM = {
  username: "",
  email: "",
  moodlePassword: "",
  localPassword: "",
  confirmLocalPassword: "",
};

export default function CreateProfileDialog({ open, onOpenChange, onSuccess }) {
  const { createProfile, isLoading, isOnline } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showServerPassword, setShowServerPassword] = useState(false);
  const [showLocalPassword, setShowLocalPassword] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(INITIAL_FORM);
      setError("");
      setSuccess(false);
      setShowServerPassword(false);
      setShowLocalPassword(false);
    }
  }, [open]);

  const passwordsMatch = form.localPassword === form.confirmLocalPassword;

  const canSubmit = useMemo(() => {
    return (
      isOnline &&
      form.username.trim() &&
      form.email.trim() &&
      form.moodlePassword.trim() &&
      form.localPassword.trim().length >= 8 &&
      passwordsMatch
    );
  }, [form, isOnline, passwordsMatch]);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) {
      if (!isOnline) {
        setError("Connexion internet requise pour creer un profil.");
        return;
      }
      setError("Veuillez remplir correctement tous les champs.");
      return;
    }

    try {
      await createProfile({
        username: form.username,
        email: form.email,
        moodlePassword: form.moodlePassword,
        localPassword: form.localPassword,
        confirmLocalPassword: form.confirmLocalPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1000);
    } catch (err) {
      setError(err?.message || "Erreur lors de la creation du profil");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un profil</DialogTitle>
          <DialogDescription>
            Renseignez vos identifiants Moodle puis votre mot de passe local.
          </DialogDescription>
        </DialogHeader>

        {!isOnline && (
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
            <WifiOff className="mt-0.5 h-4 w-4 text-warning" />
            <div className="text-warning">
              Creation impossible hors ligne. Reconnectez-vous a internet.
            </div>
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold">Profil cree avec succes</h3>
            <p className="text-sm text-muted-foreground">Vous pouvez maintenant vous connecter.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3 rounded-lg border border-border/80 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Compte Moodle</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Username Moodle</Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => update("username", e.target.value)}
                    placeholder="prenom.nom"
                    disabled={isLoading || !isOnline}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="prenom.nom@universite.edu"
                    disabled={isLoading || !isOnline}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="moodlePassword">Mot de passe Moodle</Label>
                <div className="relative">
                  <Input
                    id="moodlePassword"
                    type={showServerPassword ? "text" : "password"}
                    value={form.moodlePassword}
                    onChange={(e) => update("moodlePassword", e.target.value)}
                    placeholder="Mot de passe Moodle"
                    className="pr-10"
                    disabled={isLoading || !isOnline}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                    onClick={() => setShowServerPassword((prev) => !prev)}
                    disabled={isLoading}
                  >
                    {showServerPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border/80 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Securite locale (hors ligne)</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="localPassword">Mot de passe local</Label>
                  <div className="relative">
                    <Input
                      id="localPassword"
                      type={showLocalPassword ? "text" : "password"}
                      value={form.localPassword}
                      onChange={(e) => update("localPassword", e.target.value)}
                      placeholder="Minimum 8 caracteres"
                      className="pr-10"
                      disabled={isLoading || !isOnline}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                      onClick={() => setShowLocalPassword((prev) => !prev)}
                      disabled={isLoading}
                    >
                      {showLocalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmLocalPassword">Confirmer</Label>
                  <Input
                    id="confirmLocalPassword"
                    type={showLocalPassword ? "text" : "password"}
                    value={form.confirmLocalPassword}
                    onChange={(e) => update("confirmLocalPassword", e.target.value)}
                    placeholder="Confirmer"
                    className={!passwordsMatch && form.confirmLocalPassword ? "border-destructive focus-visible:ring-destructive" : ""}
                    disabled={isLoading || !isOnline}
                  />
                  {!passwordsMatch && form.confirmLocalPassword && (
                    <p className="text-xs text-destructive">Les mots de passe ne correspondent pas.</p>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="sm:flex-1" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Annuler
              </Button>
              <Button type="submit" className="sm:flex-1" disabled={isLoading || !canSubmit}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validation...
                  </>
                ) : (
                  "Creer le profil"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
