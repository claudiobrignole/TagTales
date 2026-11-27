import clsx from "clsx";
import { useTranslation } from "react-i18next";
import type { CatalogSort } from "../utils/catalogSort";

interface CatalogSortControlProps {
  value: CatalogSort;
  onChange: (mode: CatalogSort) => void;
  variant?: "light" | "dark";
  manualLabel?: string;
  newestLabel?: string;
}

export default function CatalogSortControl({
  value,
  onChange,
  variant = "light",
  manualLabel,
  newestLabel,
}: CatalogSortControlProps) {
  const { t } = useTranslation();
  const options: { id: CatalogSort; label: string }[] = [
    { id: "manual", label: manualLabel || t("sort.manual", "Manuale") },
    { id: "newest", label: newestLabel || t("sort.newest", "Più recenti") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("sort.label", "Ordina")}>
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            className={clsx(
              "font-['Karla'] font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded-full border transition-colors",
              variant === "dark"
                ? active
                  ? "bg-white text-[#121212] border-white"
                  : "bg-transparent text-white border-white/30 hover:border-white"
                : active
                  ? "bg-[#121212] text-white border-[#121212]"
                  : "bg-white text-[#59554E] border-[#EAE3D9] hover:border-[#121212]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
