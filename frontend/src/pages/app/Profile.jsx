import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getLocalUser } from "@/utils/api.utils";

import { Info, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// --- Utilitaires communs d'Avatar (idéalement à mutualiser) ---
function initialsFrom(name) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
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

// ─── Composant : Section Profil ───────────────────────────────────────────────
function SectionProfil({ profil }) {
  const initiales = initialsFrom(profil.nom);
  const userColor = avatarColorFrom(profil.nom);

  return (
    <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
      {/* Cover background */}
      <div className="h-32 w-full bg-slate-100 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50" />
      </div>

      <CardContent className="relative px-6 sm:px-8 pb-8 pt-0">
        {/* Overlapping Avatar */}
        <div className="relative -mt-12 mb-5 flex justify-between items-end">
          <div className={`flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br shadow-md ${userColor}`}>
            <span className="text-3xl font-bold text-white tracking-wide">{initiales}</span>
          </div>
            👋
        </div>

        {/* Profile Info */}
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-slate-800">{profil.nom}</h2>
          <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
            <Mail className="h-4 w-4" />
            {profil.email}
          </p>
        </div>
        
        <Separator className="my-6" />
        
        <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
          <Info className="h-5 w-5 text-[#2A78C2] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-800">Informations gérées par Moodle.</strong><br/>
            Votre nom, votre adresse e-mail et votre avatar sont synchronisés automatiquement depuis votre institution. Vous ne pouvez pas les modifier ici.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Composant : Mettre à jour le mot de passe ───────────────────────────────
function SectionMotDePasse() {
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
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    toast.success("Mot de passe mis à jour avec succès.");
  }

  return (
    <Card className="border border-gray-200 shadow-none rounded-xl">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-bold text-slate-800">
          Mettre à jour le mot de passe
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Assurez-vous que votre compte local utilise un mot de passe sécurisé.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <Separator className="mb-6" />
        <div className="flex flex-col gap-4 max-w-lg">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current-pwd" className="text-sm text-gray-700">
              Mot de passe actuel
            </Label>
            <Input
              id="current-pwd"
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className="rounded-lg border-gray-300 focus:border-[#2A78C2] focus:ring-[#2A78C2]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-pwd" className="text-sm text-gray-700">
              Nouveau mot de passe
            </Label>
            <Input
              id="new-pwd"
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="rounded-lg border-gray-300 focus:border-[#2A78C2] focus:ring-[#2A78C2]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-pwd" className="text-sm text-gray-700">
              Confirmer le mot de passe
            </Label>
            <Input
              id="confirm-pwd"
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className="rounded-lg border-gray-300 focus:border-[#2A78C2] focus:ring-[#2A78C2]"
            />
          </div>
          <div className="mt-1">
            <Button
              onClick={handleSave}
              className="bg-[#2A78C2] hover:bg-[#1F69AE] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm"
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const user = getLocalUser() || {};
  const profil = {
    nom: user.name || user.username || "Utilisateur Anonyme",
    email: user.email || user.username || "Pas d'adresse e-mail",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <SectionProfil profil={profil} />
        <SectionMotDePasse />
      </div>
    </div>
  );
}