import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// ─── Composant : Section Photo de profil ─────────────────────────────────────
function PhotoProfil({ nom, photo, onPhotoChange }) {
  const fileRef = useRef(null);

  const initiales = nom
    .split(" ")
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2);

  return (
    <div className="flex gap-8">
      {/* Titre section */}
      <div className="w-48 flex-shrink-0">
        <p className="text-sm font-semibold text-gray-900">Photo de profil</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Une photo de profil aide les autres à vous reconnaître.
        </p>
      </div>

      {/* Contenu */}
      <div className="flex items-center gap-5">
        <Avatar className="w-16 h-16 border-2 border-indigo-200">
          {photo && <AvatarImage src={photo} alt={nom} />}
          <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xl font-bold">
            {initiales}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Photo de profil actuelle</span>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-indigo-600 text-sm font-medium hover:underline text-left"
          >
            Changer la photo
          </button>
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
      </div>
    </div>
  );
}

// ─── Composant : Informations personnelles ───────────────────────────────────
function InformationsPersonnelles({ nom, email, onNomChange, onEmailChange, onSave }) {
  return (
    <div className="flex gap-8">
      {/* Titre section */}
      <div className="w-48 flex-shrink-0">
        <p className="text-sm font-semibold text-gray-900">Informations personnelles</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Vos nom et adresse e-mail.
        </p>
      </div>

      {/* Formulaire */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nom" className="text-sm text-gray-700">
            Nom complet
          </Label>
          <Input
            id="nom"
            value={nom}
            onChange={(e) => onNomChange(e.target.value)}
            className="rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-sm text-gray-700">
            Adresse e-mail
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div className="flex justify-end mt-1">
          <Button
            onClick={onSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg"
          >
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant : Section Profil (photo + infos) ───────────────────────────────
function SectionProfil({ profil, onUpdate }) {
  const [nom, setNom] = useState(profil.nom);
  const [email, setEmail] = useState(profil.email);
  const [photo, setPhoto] = useState(profil.photo);

  function handleSave() {
    if (!nom.trim() || !email.trim()) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    onUpdate({ nom, email, photo });
    toast.success("Profil enregistré avec succès.");
  }

  function handlePhotoChange(src) {
    setPhoto(src);
    toast.success("Votre photo de profil a été changée.");
  }

  return (
    <Card className="border border-gray-200 shadow-none rounded-xl">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-bold text-gray-900">Profil</CardTitle>
        <CardDescription className="text-sm text-gray-500 leading-relaxed">
          Modifiez ici vos informations personnelles. Ces informations seront visibles par les
          autres utilisateurs sur la plateforme.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <Separator className="mb-6" />
        <PhotoProfil nom={nom} photo={photo} onPhotoChange={handlePhotoChange} />
        <Separator className="my-6" />
        <InformationsPersonnelles
          nom={nom}
          email={email}
          onNomChange={setNom}
          onEmailChange={setEmail}
          onSave={handleSave}
        />
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
        <CardTitle className="text-lg font-bold text-gray-900">
          Mettre à jour le mot de passe
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Assurez-vous que votre compte utilise un mot de passe long et aléatoire pour rester sécurisé.
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
              className="rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
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
              className="rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
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
              className="rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="mt-1">
            <Button
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg"
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Composant : Suppression de compte ───────────────────────────────────────
function SectionSuppression() {
  function handleDelete() {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
      toast.error("Votre compte a été supprimé définitivement.");
    }
  }

  return (
    <Card className="border border-red-200 shadow-none rounded-xl">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-bold text-gray-900">
          Suppression de compte
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <Separator className="mb-5 bg-red-100" />
        <p className="text-sm text-gray-700 leading-relaxed mb-5">
          Une fois votre compte supprimé, toutes ses ressources et données seront
          définitivement supprimées. Avant de supprimer votre compte, veuillez télécharger
          toutes les données ou informations que vous souhaitez conserver.
        </p>
        <Button
          onClick={handleDelete}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-red-600"
        >
          Supprimer le compte
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [profil, setProfil] = useState({
    nom: "ledoux segning",
    email: "djouledoux@gmail.com",
    photo: null,
  });

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <SectionProfil profil={profil} onUpdate={setProfil} />
        <SectionMotDePasse />
        <SectionSuppression />
      </div>
      <Toaster />
    </div>
  );
}