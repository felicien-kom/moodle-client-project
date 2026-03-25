import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { applyThemeToDOM, getStoredTheme, storeTheme } from "@/utils/theme.utils";

// --- Création du context ---
const ThemeContext = createContext(null);

// --- Provider ---
export function ThemeProvider({ children }) {
  // Initialisation depuis le localStorage (avec fallback géré dans getStoredTheme)
  const [theme, setThemeState] = useState(getStoredTheme);

  // Fonction publique pour changer le thème
  const setTheme = useCallback((newTheme) => {
    storeTheme(newTheme);       // 1. Persiste dans le localStorage
    setThemeState(newTheme);    // 2. Met à jour le state React → re-render
  }, []);

  // Effet principal : applique le thème + écoute les changements OS si "system"
  useEffect(() => {
    applyThemeToDOM(theme);

    if (theme !== "system") return;

    // Écoute les changements de préférence OS en temps réel
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => applyThemeToDOM("system");

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// --- Hook personnalisé ---
// Toujours utiliser ce hook, jamais useContext(ThemeContext) directement
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error("[useTheme] doit être utilisé à l'intérieur d'un <ThemeProvider>");
  }

  return context;
}