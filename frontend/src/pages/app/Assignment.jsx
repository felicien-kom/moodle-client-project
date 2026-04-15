import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Calendar,
  FileText,
  User,
  CheckCircle,
} from "lucide-react";

// ─── Données mockées ──────────────────────────────────────────────────────────
const devoirsData = [
  {
    id: 1,
    titre: "Examen final",
    cours: "Machine Learning (ML)",
    coursCode: "ML",
    echeance: "20/04/2026",
    statut: "Ouvert",
    points: 20,
    fichier: "examen_final_ml.pdf",
    description:
      "Examen final du cours Machine Learning. Durée : 2h. Couvre les chapitres 1 à 8.",
    soumissions: [
      {
        id: 1,
        initiales: "AM",
        nom: "Alice Martin",
        date: "14/04/2026 09:30",
        note: 16,
        sur: 30,
        statut: "corrige",
        fichier: "examen_alice.pdf",
        commentaire: "Très bon travail, bonne maîtrise des concepts.",
      },
      {
        id: 2,
        initiales: "BN",
        nom: "Bob Nguyen",
        date: "14/04/2026 10:15",
        note: null,
        sur: 30,
        statut: "acorriger",
        fichier: "examen_bob.pdf",
        commentaire: "",
      },
    ],
  },
  {
    id: 2,
    titre: "TP Régression linéaire",
    cours: "Statistiques avancées",
    coursCode: "STAT",
    echeance: "15/04/2026",
    statut: "Ouvert",
    points: 15,
    fichier: "tp_regression.pdf",
    description:
      "Travail pratique sur la régression linéaire simple et multiple.",
    soumissions: [
      {
        id: 3,
        initiales: "JD",
        nom: "Julie Dupont",
        date: "12/04/2026 14:00",
        note: 14,
        sur: 15,
        statut: "corrige",
        fichier: "tp_julie.pdf",
        commentaire: "Excellent travail, graphiques bien expliqués.",
      },
    ],
  },
  {
    id: 3,
    titre: "Quizz — Réseaux de neurones",
    cours: "Deep Learning",
    coursCode: "DL",
    echeance: "18/04/2026",
    statut: "Ouvert",
    points: 10,
    fichier: "quizz_reseaux.pdf",
    description: "Quizz portant sur les architectures CNN, RNN et Transformer.",
    soumissions: [
      {
        id: 4,
        initiales: "BN",
        nom: "Brice Nguyen",
        date: "10/04/2026 11:00",
        note: 8,
        sur: 10,
        statut: "corrige",
        fichier: "quizz_brice.pdf",
        commentaire: "Quelques erreurs sur la backpropagation.",
      },
    ],
  },
];

// ─── Couleurs avatar ──────────────────────────────────────────────────────────
const avatarColors = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-pink-100", text: "text-pink-700" },
  { bg: "bg-green-100", text: "text-green-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
];
function getAvatarColor(initiales) {
  const idx = initiales.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
}

// ─── Composant Avatar ─────────────────────────────────────────────────────────
function Avatar({ initiales }) {
  const color = getAvatarColor(initiales);
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${color.bg} ${color.text}`}
    >
      {initiales}
    </div>
  );
}

// ─── Badge Statut ─────────────────────────────────────────────────────────────
function StatutBadge({ statut }) {
  if (statut === "corrige") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
        Corrigée
      </span>
    );
  }
  if (statut === "acorriger") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
        À corriger
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
      Ouvert
    </span>
  );
}

// ─── VUE 1 : Liste des devoirs ────────────────────────────────────────────────
function ListeDevoirs({ onVoirDevoir }) {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Évaluations</h1>
        </div>

        {/* Barre compteur + bouton */}
        <Card className="mb-5 border border-gray-200 shadow-none rounded-xl">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {devoirsData.length} devoirs
            </span>
            <Button className="bg-slate-800 hover:bg-slate-900 text-white text-sm h-9 rounded-lg gap-1.5">
              <Plus className="w-4 h-4" />
              Ajouter un devoir
            </Button>
          </CardContent>
        </Card>

        {/* Liste */}
        <div className="flex flex-col gap-3">
          {devoirsData.map((devoir) => (
            <DevoirCard
              key={devoir.id}
              devoir={devoir}
              onVoir={() => onVoirDevoir(devoir)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Carte devoir (dans la liste) ─────────────────────────────────────────────
function DevoirCard({ devoir, onVoir }) {
  const nbSoumissions = devoir.soumissions.length;
  const notesCorrigees = devoir.soumissions.filter(
    (s) => s.statut === "corrige"
  );
  const noteMoy =
    notesCorrigees.length > 0
      ? (
          notesCorrigees.reduce((a, s) => a + s.note, 0) /
          notesCorrigees.length
        ).toFixed(1)
      : "—";

  return (
    <Card className="border border-gray-200 shadow-none rounded-xl bg-white">
      <CardContent className="p-5 flex flex-col gap-3">
        {/* Titre + statut */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-semibold text-gray-900">
              {devoir.titre}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{devoir.cours}</p>
          </div>
          <StatutBadge statut="ouvert" />
        </div>

        {/* Méta */}
        <div className="flex gap-6">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
              Échéance
            </p>
            <p className="text-sm font-medium text-gray-800">
              {devoir.echeance}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
              Soumissions
            </p>
            <p className="text-sm font-medium text-gray-800">
              {nbSoumissions}/28
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
              Note moy.
            </p>
            <p className="text-sm font-medium text-gray-800">
              {noteMoy}/{notesCorrigees[0]?.sur ?? devoir.points}
            </p>
          </div>
        </div>

        {/* Bouton */}
        <div className="flex justify-end">
          <Button
            onClick={onVoir}
            className="bg-slate-800 hover:bg-slate-900 text-white text-sm h-9 rounded-lg"
          >
            Voir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── VUE 2 : Détail d'un devoir ───────────────────────────────────────────────
function DetailDevoir({ devoir, onRetour, onVoirSoumission }) {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{devoir.titre}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {devoir.cours} · Moodle
            </p>
          </div>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 h-9 rounded-lg gap-1.5 text-sm"
            onClick={onRetour}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        </div>

        {/* Infos devoir */}
        <Card className="border border-gray-200 shadow-none rounded-xl bg-white mb-4">
          <CardContent className="p-5">
            {/* Statut + points */}
            <div className="flex items-center gap-3 mb-5">
              <StatutBadge statut="ouvert" />
              <span className="text-sm font-medium text-gray-700">
                {devoir.points} points
              </span>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-lg p-3 mb-5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mb-1">
                Description
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {devoir.description}
              </p>
            </div>

            <Separator className="mb-4" />

            {/* Champs */}
            <div className="flex flex-col gap-4">
              {/* Cours */}
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Cours
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {devoir.coursCode}
                  </p>
                </div>
              </div>

              {/* Fichier du devoir */}
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Fichier
                  </p>
                  <p className="text-sm font-medium text-slate-700 underline underline-offset-2 cursor-pointer">
                    {devoir.fichier}
                  </p>
                </div>
              </div>

              {/* Échéance */}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Échéance
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {devoir.echeance}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Soumissions */}
        <Card className="border border-gray-200 shadow-none rounded-xl bg-white">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-gray-800 mb-4">
              Soumissions{" "}
              <span className="font-normal text-gray-400">
                ({devoir.soumissions.length})
              </span>
            </p>
            <div className="flex flex-col divide-y divide-gray-100">
              {devoir.soumissions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Avatar initiales={s.initiales} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{s.nom}</p>
                    <p className="text-xs text-gray-400">{s.date}</p>
                  </div>
                  {s.statut === "corrige" ? (
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      {s.note} pts
                    </span>
                  ) : (
                    <StatutBadge statut="acorriger" />
                  )}
                  <Button
                    onClick={() => onVoirSoumission(s)}
                    variant="outline"
                    className="border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white text-xs h-8 rounded-lg px-3 transition-colors"
                  >
                    Voir
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── VUE 3 : Détail d'une soumission ─────────────────────────────────────────
function DetailSoumission({ soumission, devoir, onRetour, onSauvegarder }) {
  const [note, setNote] = useState(soumission.note ?? "");
  const [commentaire, setCommentaire] = useState(soumission.commentaire);

  function handleSave() {
    onSauvegarder({ ...soumission, note: Number(note), commentaire, statut: "corrige" });
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {soumission.nom}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {devoir.titre} · {devoir.coursCode}
            </p>
          </div>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 h-9 rounded-lg gap-1.5 text-sm"
            onClick={onRetour}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        </div>

        {/* Infos soumission */}
        <Card className="border border-gray-200 shadow-none rounded-xl bg-white mb-4">
          <CardContent className="p-5">
            {/* Statut + date */}
            <div className="flex items-center gap-3 mb-5">
              <StatutBadge statut={soumission.statut} />
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Envoyé le {soumission.date}
              </span>
            </div>

            <Separator className="mb-4" />

            <div className="flex flex-col gap-4">
              {/* Étudiant */}
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Étudiant
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {soumission.nom}
                  </p>
                </div>
              </div>

              {/* Devoir */}
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Devoir
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {devoir.titre}
                  </p>
                </div>
              </div>

              {/* Fichier */}
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Fichier
                  </p>
                  <p className="text-sm font-medium text-slate-700 underline underline-offset-2 cursor-pointer">
                    {soumission.fichier}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Correction */}
        <Card className="border border-gray-200 shadow-none rounded-xl bg-white">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-gray-800 mb-5">
              Correction
            </p>

            {/* Note */}
            <div className="mb-5">
              <Label className="text-sm text-gray-600 mb-2 block">
                Note attribuée
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  min={0}
                  max={soumission.sur}
                  className="w-20 h-10 text-base font-medium border-gray-300 rounded-lg focus:border-slate-800 focus:ring-slate-800"
                />
                <span className="text-sm text-gray-500 font-medium">
                  / {soumission.sur}
                </span>
              </div>
            </div>

            {/* Commentaire */}
            <div className="mb-6">
              <Label className="text-sm text-gray-600 mb-2 block">
                Commentaire
              </Label>
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                className="min-h-[90px] border-gray-300 rounded-lg text-sm focus:border-slate-800 focus:ring-slate-800"
                placeholder="Ajouter un commentaire..."
              />
            </div>

            {/* Bouton */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                className="bg-slate-800 hover:bg-slate-900 text-white h-10 rounded-lg gap-2 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Enregistrer la correction
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── interface principale principale (routeur) ─────────────────────────────────────────────────
export default function Assignment() {
  const [vue, setVue] = useState("liste"); // "liste" | "devoir" | "soumission"
  const [devoirs, setDevoirs] = useState(devoirsData);
  const [devoirActuel, setDevoirActuel] = useState(null);
  const [soumissionActuelle, setSoumissionActuelle] = useState(null);

  function ouvrirDevoir(devoir) {
    setDevoirActuel(devoirs.find((d) => d.id === devoir.id));
    setVue("devoir");
  }

  function ouvrirSoumission(soumission) {
    setSoumissionActuelle(soumission);
    setVue("soumission");
  }

  function sauvegarderCorrection(soumissionMaj) {
    setDevoirs((prev) =>
      prev.map((d) =>
        d.id === devoirActuel.id
          ? {
              ...d,
              soumissions: d.soumissions.map((s) =>
                s.id === soumissionMaj.id ? soumissionMaj : s
              ),
            }
          : d
      )
    );
    const devoirMaj = {
      ...devoirActuel,
      soumissions: devoirActuel.soumissions.map((s) =>
        s.id === soumissionMaj.id ? soumissionMaj : s
      ),
    };
    setDevoirActuel(devoirMaj);
    setVue("devoir");
  }

  if (vue === "liste") {
    return <ListeDevoirs onVoirDevoir={ouvrirDevoir} />;
  }
  if (vue === "devoir" && devoirActuel) {
    return (
      <DetailDevoir
        devoir={devoirActuel}
        onRetour={() => setVue("liste")}
        onVoirSoumission={ouvrirSoumission}
      />
    );
  }
  if (vue === "soumission" && soumissionActuelle) {
    return (
      <DetailSoumission
        soumission={soumissionActuelle}
        devoir={devoirActuel}
        onRetour={() => setVue("devoir")}
        onSauvegarder={sauvegarderCorrection}
      />
    );
  }
  return null;
}