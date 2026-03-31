import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, ArrowRight } from "lucide-react";

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
function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-slate-50 via-indigo-50/60 to-slate-100 overflow-hidden">
      {/* Décoration coins */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-100/40 rounded-bl-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-100/30 rounded-tr-full pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 py-28 text-center">
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-4 tracking-tight">
          Le savoir de demain,
        </h1>
        <h1 className="text-5xl md:text-6xl font-black text-indigo-900 leading-tight mb-6 tracking-tight">
          accessible aujourd'hui.
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Plongez dans un univers de connaissances avec des cours interactifs,
          des experts passionnés et une communauté dynamique.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button
            size="lg"
            className="bg-indigo-900 hover:bg-indigo-800 text-white font-semibold px-8 py-3 rounded-xl text-base h-auto"
          >
            Explorer les Cours
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-8 py-3 rounded-xl text-base h-auto"
          >
            Découvrir plus
          </Button>
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