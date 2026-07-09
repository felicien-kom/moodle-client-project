import Assignment from "@/pages/app/evaluations/Assignment";

export const PATHS = {

  // Zone publique (avec header/footer site)
  public: {
    home:     "/",
    about:    "/about",
    contact:  "/contact",
    services: "/services",
    guest: "/guest",
  },

  // Zone auth (sans layout)
  auth: {
    login:    "/login",
    register: "/register",
    forgot:   "/forgot-password",
    // reset:    "/reset-password/:token",
  },

  // Zone application / dashboard
  app: {
    dashboard: "/app",
    profile:   "/app/profile",
    settings:  "/app/settings",
    assignment: "/app/assignment",
    course:"/app/course",
    mediatheque: "/app/mediatheque"
  },
};