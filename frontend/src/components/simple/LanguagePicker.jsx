import { Languages } from "lucide-react";
import { FranceFlag, USAFlag } from "@/components/content/elements";
import { useLanguage } from "@/context/LanguageContext";
import { IconLabelPicker } from "@/components/custom/IconLabelPicker";
import { useTranslation } from "react-i18next";

function LanguagePicker() {
  const { langPreference, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const tmpLabel = t("language.triggerLabel");
  const LANGUAGES = [
    { id: "system", label: t("language.options.system"),icon: Languages },
    { id: "fr", label: t("language.options.french"), icon: FranceFlag },
    { id: "en", label: t("language.options.english"),icon: USAFlag },
  ];

  return (
    <IconLabelPicker
      list={LANGUAGES}
      selectedId={langPreference}
      onSelect={setLanguage}
      triggerLabel={tmpLabel}
    />
  );
}

export default LanguagePicker;