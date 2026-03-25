import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/router/paths";
import { useTranslation } from "react-i18next";

function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">

      {/* Code erreur */}
      <span className="text-8xl font-bold tracking-tighter text-muted-foreground/20 select-none">
        404
      </span>

      {/* Message */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">
          {t("error404.notFound")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t("error404.text")}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          {t("error404.back")}
        </Button>
        <Button onClick={() => navigate(PATHS.public.home)}>
          {t("error404.home")}
        </Button>
      </div>

    </div>
  );
}

export default NotFound;
