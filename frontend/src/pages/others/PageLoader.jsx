import { useTranslation } from "react-i18next";

function PageLoader() {
  const { t } = useTranslation();
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Spinner */}
      <div className="relative flex items-center justify-center">
        {/* Anneau extérieur */}
        <div className="h-12 w-12 rounded-full border-2 border-muted animate-spin border-t-primary" />
        {/* Point central */}
        <div className="absolute h-2 w-2 rounded-full bg-primary" />
      </div>

      <p className="mt-4 text-sm text-muted-foreground tracking-wide animate-pulse">
        {t("pageLoader.text")}...
      </p>
    </div>
  );
}

export default PageLoader;
