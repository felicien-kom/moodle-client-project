export const I18N_CONFIG = {
  storageKey: "app_language",

  // Langue de fallback si système non supporté ou valeur invalide
  fallbackLang: "en",

  // Langue par défaut à proposer (≠ fallback : c'est le choix UX initial)
  defaultLang: "system",

  // Toutes les langues supportées par l'app
  supportedLangs: ["fr", "en"],

  // Correspondances étendues : couvre les variantes régionales
  // "ce que le navigateur peut retourner" → "notre id valide"
  langAliases: {
    fr: "fr",  "fr-fr": "fr", "fr-be": "fr", "fr-ca": "fr",
    "fr-ch": "fr", "fr-lu": "fr",
    en: "en",  "en-us": "en", "en-gb": "en", "en-au": "en",
    "en-ca": "en", "en-nz": "en", "en-ie": "en",
  },
};