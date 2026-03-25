export const THEME_CONFIG = {
  // Clé utilisée dans le localStorage
  storageKey: "app_theme",

  // Valeur par défaut si le localStorage est absent, vide ou invalide
  defaultTheme: "system",

  // Valeurs autorisées — toute autre valeur est considérée invalide
  validThemes: ["system", "light", "dark"],

  // Classe CSS appliquée sur <html> pour le thème sombre
  darkClass: "dark",
};