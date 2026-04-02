import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
  /** Narrow vertical rail (collapsed sidebar) */
  variant?: "default" | "rail";
}

export default function LanguageSwitcher({ className = "", variant = "default" }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language;
  const isRail = variant === "rail";

  return (
    <div
      className={cn(
        "flex gap-2",
        isRail && "w-full max-w-[2.75rem] flex-col gap-1.5",
        className
      )}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => changeLanguage("en")}
        className={cn(
          "rounded-md font-medium transition-all duration-200",
          isRail ? "w-full px-0 py-1.5 text-[10px] leading-none" : "px-3 py-1 text-sm",
          currentLanguage === "en" || currentLanguage.startsWith("en")
            ? "border-2 border-white bg-white text-black shadow-lg"
            : "border border-gray-600 bg-transparent text-white hover:border-gray-400"
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => changeLanguage("pt")}
        className={cn(
          "rounded-md font-medium transition-all duration-200",
          isRail ? "w-full px-0 py-1.5 text-[10px] leading-none" : "px-3 py-1 text-sm",
          currentLanguage === "pt" || currentLanguage.startsWith("pt")
            ? "border-2 border-white bg-white text-black shadow-lg"
            : "border border-gray-600 bg-transparent text-white hover:border-gray-400"
        )}
      >
        PT
      </button>
    </div>
  );
}
