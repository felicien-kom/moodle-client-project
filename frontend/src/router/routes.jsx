import { PATHS } from "./paths";
import { lazy } from "react";
import { Navigate } from "react-router-dom";

// ============================================================
// PAGES PUBLIQUES (accessibles sans authentification)
// ============================================================
const Home     = lazy(() => import("@/pages/public/Home"));
const About    = lazy(() => import("@/pages/public/About"));
const Contact  = lazy(() => import("@/pages/public/Contact"));
const Services = lazy(() => import("@/pages/public/Services"));

// ============================================================
// PAGES AUTH (bloquées si déjà connecté via GuestGuard)
// ============================================================
const Login    = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const Forgot   = lazy(() => import("@/pages/auth/ForgotPassword"));

// ============================================================
// PAGES APP (toutes exigent une authentification via ProtectedRoute)
// ============================================================
const Dashboard    = lazy(() => import("@/pages/app/Dashboard"));
const Profile      = lazy(() => import("@/pages/app/Profile"));
const Settings     = lazy(() => import("@/pages/app/Settings"));

const Courses      = lazy(() => import("@/pages/app/courses/Courses"));
const CreateCourse = lazy(() => import("@/pages/app/courses/CreateCourse"));
const CourseDetail = lazy(() => import("@/pages/app/courses/CourseDetail"));

// ============================================================
// ROUTES PUBLIQUES
// ============================================================
export const publicRoutes = [
  { path: PATHS.public.home,     element: <Home />     },
  { path: PATHS.public.about,    element: <About />    },
  { path: PATHS.public.contact,  element: <Contact />  },
  { path: PATHS.public.services, element: <Services /> },
];

// ============================================================
// ROUTES AUTH
// GuestGuard garantit que tout utilisateur déjà connecté
// est redirigé vers /app s'il tente d'accéder à ces pages.
// ============================================================
export const authRoutes = [
  { path: PATHS.auth.login,    element: <Login />    },
  { path: PATHS.auth.register, element: <Register /> },
  { path: PATHS.auth.forgot,   element: <Forgot />   },
];

// ============================================================
// ROUTES PRIVÉES (App)
// ProtectedRoute : redirige vers /login si non-authentifié.
// RoleGuard (optionnel) : restreint par rôle (via champ roles[]).
//
// TOUTES ces routes sont librement accessibles entre elles
// dès que l'utilisateur est authentifié.
// ============================================================
export const appRoutes = [
  // Tableau de bord (tous rôles)
  { path: PATHS.app.dashboard, element: <Dashboard /> },

  // Profil & Paramètres (tous rôles)
  { path: PATHS.app.profile,   element: <Profile />  },
  { path: PATHS.app.settings,  element: <Settings /> },

  // Module Cours
  { path: PATHS.app.courses.list,   element: <Courses />      },
  { path: PATHS.app.courses.detail, element: <CourseDetail /> },

  // Création de cours — restreinte aux enseignants et admins
  {
    path: PATHS.app.courses.create,
    element: <CreateCourse />,
    roles: ["admin", "teacher"],
  },

  // Redirection /app/* → /app/courses pour toute route inconnue dans l'app
  { path: "/app/*", element: <Navigate to={PATHS.app.dashboard} replace /> },
];