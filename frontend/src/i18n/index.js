import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18N_CONFIG } from "@/config/i18n.config";
import { getStoredLang, resolveActiveLang } from "@/utils/i18n.utils";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

// On calcule la langue active dès le démarrage, avant tout rendu React
const initialPreference = getStoredLang();
const initialLang = resolveActiveLang(initialPreference);

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },

  lng: initialLang,                       // langue résolue au démarrage
  fallbackLng: I18N_CONFIG.fallbackLang,  // filet de sécurité i18next natif

  interpolation: { escapeValue: false },

  // On désactive la détection automatique d'i18next :
  // c'est notre logique qui fait foi
  detection: undefined,
});

export default i18n;