import { PATHS } from "./paths";

// Lazy loading : les pages ne sont chargées que si la zone est visitée
import { lazy } from "react";

const Home      = lazy(() => import("@/pages/others/Home"));
const About     = lazy(() => import("@/pages/public/About"));
const Contact   = lazy(() => import("@/pages/public/Contact"));
const Services  = lazy(() => import("@/pages/public/Services"));

const Login     = lazy(() => import("@/pages/auth/Login"));
const Register  = lazy(() => import("@/pages/auth/Register"));
const Forgot    = lazy(() => import("@/pages/auth/ForgotPassword"));

const Dashboard = lazy(() => import("@/pages/app/Dashboard"));
const Profile   = lazy(() => import("@/pages/app/Profile"));
const Settings  = lazy(() => import("@/pages/app/Settings"));
// const UserList  = lazy(() => import("@/pages/app/users/UserList"));
// const UserDetail= lazy(() => import("@/pages/app/users/UserDetail"));

export const publicRoutes = [
  { path: PATHS.public.home,     element: <Home />     },
  { path: PATHS.public.about,    element: <About />    },
  { path: PATHS.public.contact,  element: <Contact />  },
  { path: PATHS.public.services, element: <Services /> },
];

export const authRoutes = [
  { path: PATHS.auth.login,    element: <Login />    },
  { path: PATHS.auth.register, element: <Register /> },
  { path: PATHS.auth.forgot,   element: <Forgot />   },
];

export const appRoutes = [
  { path: PATHS.app.dashboard,    element: <Dashboard />  },
  { path: PATHS.app.profile,      element: <Profile />    },
  { path: PATHS.app.settings,     element: <Settings />   },
  // { path: PATHS.app.users.list,   element: <UserList />   },
  // { path: PATHS.app.users.detail, element: <UserDetail /> },
];