import { useEffect, useRef, useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { PATHS } from "@/router/paths";

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

export default function LoginProfileDialog({ profile, open, onOpenChange, onSuccess }) {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPassword("");
      setError("");
      setShake(false);
      setShowPassword(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!password.trim()) {
      setError("Mot de passe requis");
      return;
    }

    try {
      await login({ username: profile.username, password });
      onSuccess?.();
      navigate(PATHS.app.dashboard, { replace: true });
    } catch (err) {
      setError("Mot de passe incorrect");
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-primary/20 to-primary/5 ring-2 ring-border">
              <span className="text-xl font-semibold text-primary">{initialsFrom(profile?.name)}</span>
            </div>
          </div>
          <DialogTitle className="text-xl">{profile?.name || "Profil"}</DialogTitle>
          <DialogDescription>
            Entrez votre mot de passe local pour acceder au dashboard
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-3 space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe local"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                disabled={isLoading}
                className={`pr-10 text-center ${shake ? "animate-shake" : ""} ${
                  error ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                autoComplete="current-password"
              />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isLoading || !password.trim()} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  Se connecter
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full"
            >
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
