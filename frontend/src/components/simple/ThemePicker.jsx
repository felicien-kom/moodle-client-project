// src/components/ThemePicker.jsx

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { ContrastTheme } from "@/components/content/elements";
import { IconLabelPicker } from "@/components/custom/IconLabelPicker";
import { useTranslation } from "react-i18next";


function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const tmpLabel = t("theme.triggerLabel");
  const THEMES = [
    { id: "system", label: t("theme.options.system"), icon: ContrastTheme },
    { id: "light", label: t("theme.options.light"), icon: Sun },
    { id: "dark", label: t("theme.options.dark"), icon: Moon },
  ];

  return (
    <IconLabelPicker
      list={THEMES}
      selectedId={theme}        // ← source de vérité : le context
      onSelect={setTheme}       // ← callback : met à jour le context
      triggerLabel={tmpLabel}
    />
  );
}

export default ThemePicker;