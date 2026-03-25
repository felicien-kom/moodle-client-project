export const PATHS = {

  // Zone publique (avec header/footer site)
  public: {
    home:     "/",
    about:    "/about",
    contact:  "/contact",
    services: "/services",
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
    // Ex: sous-module
    // users: {
    //   list:   "/app/users",
    //   detail: "/app/users/:id",
    // },
  },
};