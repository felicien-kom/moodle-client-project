import { THEME_CONFIG } from "@/config/theme.config";

const { storageKey, defaultTheme, validThemes, darkClass } = THEME_CONFIG;

/**
 * Lit le thème depuis le localStorage.
 * Retourne defaultTheme si la clé est absente, vide ou invalide.
 */
export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(storageKey);

    // Cas 1 : clé absente
    if (stored === null) return defaultTheme;

    // Cas 2 : valeur invalide ou vide
    if (!validThemes.includes(stored)) return defaultTheme;

    // Cas 3 : valeur valide
    return stored;
  } catch {
    // Cas 4 : localStorage inaccessible (SSR, navigateur restrictif)
    return defaultTheme;
  }
}

/**
 * Sauvegarde le thème dans le localStorage.
 * Ne sauvegarde rien si la valeur est invalide.
 */
export function storeTheme(theme) {
  if (!validThemes.includes(theme)) {
    console.log("Valeur du thème invalide.");
    return;
  };

  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    console.warn("[ThemeUtils] Impossible d'écrire dans le localStorage.");
  }
}

/**
 * Résout le thème effectif (light ou dark) à partir du choix utilisateur.
 * "system" est résolu selon la préférence OS.
 */
export function resolveTheme(theme) {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

/**
 * Applique le thème résolu sur le <html> via la classe CSS.
 */
export function applyThemeToDOM(theme) {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;

  if (resolved === "dark") {
    root.classList.add(darkClass);
  } else {
    root.classList.remove(darkClass);
  }
}