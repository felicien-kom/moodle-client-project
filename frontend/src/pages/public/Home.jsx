import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, ArrowRight, Sparkles, BookOpen } from "lucide-react";

// ─── Données ────────────────────────────────────────────────

const STATS = [
  {
    value: "50+",
    label: "Cours d'Experts",
    desc: "Des formations conçues et animées par des professionnels reconnus dans leur domaine.",
    circleColor: "bg-indigo-100 text-indigo-700",
  },
  {
    value: "10k+",
    label: "Étudiants Satisfaits",
    desc: "Rejoignez une communauté de milliers d'apprenants qui nous font confiance.",
    circleColor: "bg-purple-100 text-purple-600",
  },
  {
    value: "24/7",
    label: "Support & Accès",
    desc: "Apprenez à votre rythme, où que vous soyez, avec un support toujours disponible.",
    circleColor: "bg-green-100 text-green-600",
  },
];

const FEATURES = [
  "Apprentissage par projets",
  "Accès à vie au contenu",
  "Certificat de complétion",
];

const TESTIMONIALS = [
  {
    quote:
      "La qualité des cours a dépassé toutes mes attentes. J'ai pu obtenir une promotion en moins de 6 mois !",
    name: "Marie Dubois",
    role: "Développeuse Front-end",
  },
  {
    quote:
      "Une plateforme intuitive et des formateurs à l'écoute. C'est l'investissement le plus rentable que j'ai fait pour ma carrière.",
    name: "Jean Dupont",
    role: "Chef de Projet Tech",
  },
  {
    quote:
      "Le support communautaire est incroyable. On ne se sent jamais seul face à un problème. Je recommande à 100%.",
    name: "Sarah Lemoine",
    role: "UX/UI Designer",
  },
];

// ─── Initiales avatar ────────────────────────────────────────
function Avatar({ name }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
      {initials}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  SECTION 1 — Hero
// ════════════════════════════════════════════════════════════
export function HeroSection() {
  return (
    <section className="relative bg-gray-100 overflow-hidden min-h-[520px] flex items-center">
 
      {/* ── Décoration fond ── */}
      {/* Cercle flou haut-gauche */}
      <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full bg-indigo-900/10 blur-3xl pointer-events-none" />
      {/* Cercle flou bas-droite */}
      <div className="absolute -bottom-20 -right-10 w-96 h-96 rounded-full bg-indigo-900/8 blur-3xl pointer-events-none" />
      {/* Grille de points */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: "radial-gradient(circle, #c7d2fe 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Barre accent verticale gauche */}
      <div className="absolute left-0 top-1/4 w-1.5 h-32 bg-indigo-900 rounded-r-full" />
 
      {/* ── Contenu ── */}
      <div className="relative max-w-5xl mx-auto px-8 py-24 w-full">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 items-center">
 
          {/* ── Colonne texte ── */}
          <div>
 
            {/* Pill badge */}
            <span className="inline-flex items-center gap-1.5 bg-indigo-900/10 text-indigo-900
                             text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Sparkles className="w-3 h-3" />
              Nouvelle saison de formations disponible
            </span>
 
            {/* Titre */}
            <h1 className="text-5xl md:text-6xl font-black text-gray-900
                           leading-[1.1] tracking-tight mb-2">
              Maîtrisez les
            </h1>
            <h1 className="text-5xl md:text-6xl font-black leading-[1.1] tracking-tight mb-6">
              <span className="text-indigo-900">compétences</span>
              <span className="text-gray-900"> qui comptent.</span>
            </h1>
 
            {/* Sous-titre */}
            <p className="text-gray-500 text-lg max-w-lg leading-relaxed mb-10">
              Des parcours structurés, des formateurs de terrain et des
              certifications reconnues — tout ce qu'il faut pour progresser
              vite et durablement.
            </p>
 
            {/* Boutons */}
            <div className="flex items-center gap-4 flex-wrap">
              <Button
                size="lg"
                className="bg-indigo-900 hover:bg-indigo-800 text-white font-semibold
                           px-8 py-3 rounded-xl text-sm h-auto
                           shadow-md shadow-indigo-900/20 transition-all"
                asChild
              >
                <a href="/login" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Démarrer ma formation
                </a>
              </Button>
 
              <Button
                size="lg"
                variant="outline"
                className="border-gray-300 bg-white hover:bg-gray-50 text-gray-700
                           font-semibold px-8 py-3 rounded-xl text-sm h-auto transition-all"
              >
                Voir le catalogue
              </Button>
            </div>
 
            {/* Mini stats */}
            <div className="flex items-center gap-6 mt-9 flex-wrap">
              {[
                { val: "50+",  txt: "formations" },
                { val: "10k+", txt: "apprenants actifs" },
                { val: "4.9★", txt: "note moyenne" },
              ].map(({ val, txt }) => (
                <div key={txt} className="flex items-baseline gap-1.5">
                  <span className="text-base font-extrabold text-indigo-900">{val}</span>
                  <span className="text-xs text-gray-400">{txt}</span>
                </div>
              ))}
            </div>
          </div>
 
          {/* ── Colonne visuelle : 2 cartes flottantes ── */}
          <div className="hidden md:flex flex-col gap-3 w-56">
 
            {/* Carte module actif */}
            
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-900 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Module actif
              </p>
              <p className="text-sm font-bold text-gray-900 leading-snug">
                Développement Web Full-Stack
              </p>
              {/* Barre de progression */}
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full w-[60%] bg-indigo-900 rounded-full" />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">60% complété</p>
            </div>
            
            
 
            {/* Carte prochaine session */}
            <div className="bg-indigo-900 rounded-2xl p-5 text-white shadow-md shadow-indigo-900/25">
              <p className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider mb-1">
                Prochaine session
              </p>
              <p className="text-sm font-bold leading-snug">
                Design de systèmes distribués
              </p>
              <p className="text-indigo-300 text-xs mt-2">Commence dans 3 jours</p>
            </div>
 
          </div>
        </div>
      </div>
    </section>
  );
}
// ════════════════════════════════════════════════════════════
//  SECTION 2 — Stats / Pourquoi nous
// ════════════════════════════════════════════════════════════
function StatsSection() {
  return (
    <section className="bg-gray-50 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Titre */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Pourquoi notre plateforme est unique&nbsp;?
          </h2>
          <p className="text-gray-500 text-base">
            Nous combinons technologie, expertise et support pour votre réussite.
          </p>
        </div>

        {/* Cartes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATS.map((s) => (
            <Card
              key={s.label}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-8 pb-8 px-7 flex flex-col items-center text-center">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-extrabold mb-5 ${s.circleColor}`}
                >
                  {s.value}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{s.label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════
//  SECTION 3 — Cours en vedette
// ════════════════════════════════════════════════════════════
function FeaturedCourseSection() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Visuel placeholder */}
          <div className="bg-indigo-50 rounded-2xl h-72 flex items-center justify-center border border-indigo-100">
            <div className="text-center text-indigo-300">
              <div className="text-6xl mb-3">🖥️</div>
              <span className="text-sm font-medium text-indigo-400">
                Cours de développement web
              </span>
            </div>
          </div>

          {/* Contenu */}
          <div>
            <Badge className="bg-indigo-100 text-indigo-900 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-md mb-4 hover:bg-indigo-100">
              Cours en vedette
            </Badge>
            <h2 className="text-3xl font-extrabold text-gray-900 leading-snug mb-4">
              Masterclass : Développement Web Moderne
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Devenez un développeur full-stack aguerri. Ce cours complet couvre
              les dernières technologies du front-end au back-end, avec des
              projets concrets.
            </p>

            {/* Checklist */}
            <ul className="space-y-3 mb-8">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              className="bg-indigo-900 hover:bg-indigo-800 text-white font-semibold px-7 py-3 rounded-xl h-auto text-sm"
            >
              Commencer l'aventure <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════
//  SECTION 4 — Témoignages
// ════════════════════════════════════════════════════════════
function TestimonialsSection() {
  return (
    <section className="bg-gray-50 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Titre */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Ils ont transformé leur carrière
          </h2>
          <p className="text-gray-500 text-base">
            Lisez les histoires de ceux qui ont atteint leurs objectifs grâce à nous.
          </p>
        </div>

        {/* Cartes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <Card
              key={t.name}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-7 pb-7 px-6 flex flex-col h-full">
                {/* Barre accent + citation */}
                <div className="flex gap-4 mb-6 flex-1">
                  <div className="w-1 bg-indigo-900 rounded-full flex-shrink-0" />
                  <p className="text-sm text-gray-700 italic leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>

                <Separator className="mb-5" />

                {/* Auteur */}
                <div className="flex items-center gap-3">
                  <Avatar name={t.name} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════
//  SECTION 5 — CTA Final
// ════════════════════════════════════════════════════════════
function CtaSection() {
  return (
    <section className="bg-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Bandeau violet avec motif + */}
        <div
          className="relative bg-indigo-900 rounded-3xl overflow-hidden px-8 py-16 text-center"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        >
          {/* Superposition dégradé léger */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-800/60 via-transparent to-purple-900/40 pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
              Prêt à transformer votre avenir&nbsp;?
            </h2>
            <p className="text-indigo-200 text-base mb-8 max-w-xl mx-auto">
              Votre première leçon n'est qu'à un clic. Rejoignez-nous et libérez
              votre potentiel.
            </p>
            <Button
              size="lg"
              className="bg-white hover:bg-gray-50 text-indigo-900 font-bold px-8 py-3 rounded-xl h-auto text-sm shadow-md"
            >
              Créer mon compte gratuit
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════
export default function HomePage() {
  return (
    <main className="min-h-screen font-sans">
      <HeroSection />
      <StatsSection />
      <FeaturedCourseSection />
      <TestimonialsSection />
      <CtaSection />
    </main>
  );
}