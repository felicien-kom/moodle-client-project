import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getStoredLang, resolveActiveLang, storeLang } from "@/utils/i18n.utils";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { i18n } = useTranslation();

  // Préférence utilisateur ("system" | "fr" | "en")
  const [langPreference, setLangPreference] = useState(getStoredLang);

  const setLanguage = useCallback((preference) => {
    storeLang(preference);                          // 1. Persiste
    setLangPreference(preference);                  // 2. Met à jour le state
    i18n.changeLanguage(resolveActiveLang(preference)); // 3. Applique à i18next
  }, [i18n]);

  // Réécoute les changements OS si on est en mode "system"
  useEffect(() => {
    if (langPreference !== "system") return;

    // Sur changement de langues navigateur (rare mais possible)
    const handleLanguageChange = () => {
      i18n.changeLanguage(resolveActiveLang("system"));
    };

    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, [langPreference, i18n]);

  return (
    <LanguageContext.Provider value={{ langPreference, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === null) {
    throw new Error("[useLanguage] doit être utilisé à l'intérieur d'un <LanguageProvider>");
  }
  return context;
}