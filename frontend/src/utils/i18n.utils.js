import { I18N_CONFIG } from "@/config/i18n.config";

const { storageKey, fallbackLang, defaultLang, supportedLangs, langAliases } = I18N_CONFIG;

/**
 * Résout une chaîne brute du navigateur vers un id supporté.
 * Exemples :
 *   "fr-FR"  → "fr"
 *   "fr-BE"  → "fr"
 *   "de-DE"  → null  (non supporté)
 *   "zh-Hans"→ null
 */
export function resolveSystemLang(rawLang) {
  if (!rawLang) return null;

  const normalized = rawLang.toLowerCase();

  // 1. Correspondance exacte ou alias connu (ex: "fr-be" → "fr")
  if (langAliases[normalized]) return langAliases[normalized];

  // 2. Correspondance sur le préfixe court (ex: "fr" extrait de "fr-XX")
  const prefix = normalized.split("-")[0];
  if (langAliases[prefix]) return langAliases[prefix];

  // 3. Vérification directe dans les langues supportées
  if (supportedLangs.includes(prefix)) return prefix;

  // 4. Langue non supportée
  return null;
}

/**
 * Détermine la langue effective à appliquer à i18next.
 * - "system" → résolution navigateur → fallback si non supporté
 * - id valide → retourné tel quel
 * - id invalide → fallbackLang
 */
export function resolveActiveLang(preference) {
  if (preference === "system") {
    // Parcourt toutes les langues déclarées par le navigateur (par ordre de préférence)
    const browserLangs = navigator.languages ?? [navigator.language];
    for (const lang of browserLangs) {
      const resolved = resolveSystemLang(lang);
      if (resolved) return resolved;
    }
    // Aucune langue navigateur n'est supportée → fallback
    return fallbackLang;
  }

  if (supportedLangs.includes(preference)) return preference;

  // Valeur inconnue ou corrompue
  return fallbackLang;
}

/**
 * Lit la préférence stockée dans localStorage.
 * Retourne defaultLang si absente, vide ou invalide.
 */
export function getStoredLang() {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === null) return defaultLang;

    const validPreferences = ["system", ...supportedLangs];
    if (!validPreferences.includes(stored)) return defaultLang;

    return stored;
  } catch {
    return defaultLang;
  }
}

/**
 * Persiste la préférence dans localStorage.
 * "system" supprime la clé (comportement naturel).
 */
export function storeLang(preference) {
  try {
    if (preference === "system") {
      localStorage.removeItem(storageKey);
    } else if (supportedLangs.includes(preference)) {
      localStorage.setItem(storageKey, preference);
    }
  } catch {
    console.warn("[i18nUtils] Impossible d'écrire dans le localStorage.");
  }
}