import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { publicRoutes, authRoutes, appRoutes } from "./routes";
import ProtectedRoute from "./guards/ProtectedRoute";
import GuestGuard from "./guards/GuestGuard";
import RoleGuard from "./guards/RoleGuard";

// Layouts
import PublicLayout from "@/layouts/PublicLayout";   // header + footer site
import AuthLayout from "@/layouts/AuthLayout";     // page centrée, sans nav
import AppLayout from "@/layouts/AppLayout";      // sidebar + header dashboard

// Fallbacks
import NotFound from "@/pages/others/NotFound";
import PageLoader from "@/pages/others/PageLoader";

function AllRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Zone publique — header + footer site web */}
        <Route element={<PublicLayout />}>
          {publicRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>

        {/* Zone auth — layout minimaliste, protégée contre les utilisateurs DÉJÀ connectés */}
        <Route element={<GuestGuard />}>
          <Route element={<AuthLayout />}>
            {authRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          </Route>
        </Route>

        {/* Zone app — PROTÉGÉE, layout dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {appRoutes.map((route) => {
              if (route.roles) {
                return (
                  <Route key={route.path} element={<RoleGuard allowedRoles={route.roles} />}>
                    <Route path={route.path} element={route.element} />
                  </Route>
                );
              }
              return <Route key={route.path} path={route.path} element={route.element} />;
            })}
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AllRoutes;