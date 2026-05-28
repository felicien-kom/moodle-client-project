import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { publicRoutes, authRoutes, appRoutes } from "./routes";
import AuthGuard from "./guards/AuthGuard";

// Layouts
import PublicLayout from "@/layouts/PublicLayout";   // header + footer site
import AuthLayout from "@/layouts/AuthLayout";     // page centrée, sans nav
import AppLayout from "@/layouts/AppLayout";      // sidebar + header dashboard

// Fallbacks
import NotFound from "@/pages/others/NotFound";
import PageLoader from "@/pages/others/PageLoader";    // spinner pendant le lazy load

function AllRoutes() {
  return (
    // Suspense global : couvre tous les lazy imports des routes
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* Zone publique — header + footer site web */}
        <Route element={<PublicLayout />}>
          {publicRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>

        {/* Zone auth — layout minimaliste, pas de nav */}
        <Route>
          {authRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>

        {/* Zone app — protégée, layout dashboard */}
        <Route element={<AuthGuard />}> {/* protège toutes les routes enfants */}
          <Route element={<AppLayout />}>
            {appRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          </Route>
         </Route> 

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Suspense>
  );
}

export default AllRoutes;