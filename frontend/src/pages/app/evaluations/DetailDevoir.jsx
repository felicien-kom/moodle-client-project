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
export default function DetailDevoir({ devoir, onRetour, onVoirSoumission }) {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{devoir.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {devoir.course.title} ({devoir.course.shortName}) · Moodle
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
              <StatutBadge state="ouvert" />
              <span className="text-sm font-medium text-gray-700">
                20 points
              </span>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-lg p-3 mb-5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mb-1">
                Description
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {devoir.intro}
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
                  <p className="text-sm font-medium text-slate-800">
                    {devoir.course.shortName}
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
                    Consigne.pdf
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
                  <p className="text-sm font-medium text-slate-800">
                    {devoir.dueDate ? new Date(devoir.dueDate * 1000).toLocaleDateString('fr-FR') : 'Non définie'}
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
                ({devoir.submissions.length})
              </span>
            </p>
            <div className="flex flex-col divide-y divide-gray-100">
              {devoir.submissions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Avatar initiales={s.studentInitials} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{s.studentName}</p>
                    <p className="text-xs text-gray-400">{s.submittedAt ? new Date(s.submittedAt * 1000).toLocaleDateString('fr-FR') : 'Non définie'}</p>
                  </div>
                  {s.state === "GRADED" ? (
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      {s.grade} pts
                    </span>
                  ) : (
                    <StatutBadge state="SUBMITTED" />
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