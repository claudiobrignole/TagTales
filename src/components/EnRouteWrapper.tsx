import { useEffect } from "react";
import { useI18n } from "../contexts/I18nContext";
import { useLocation } from "react-router-dom";

export default function EnRouteWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { language, setLanguage } = useI18n();
  const location = useLocation();

  useEffect(() => {
    if (language !== "EN") {
      setLanguage("EN", true);
    }
  }, [location.pathname]);

  return <>{children}</>;
}
