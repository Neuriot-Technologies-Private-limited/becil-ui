import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { GiMusicalNotes } from "react-icons/gi";
import { FaBroadcastTower } from "react-icons/fa";
import { MdHearing, MdLogout, MdMenu, MdClose } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router";
import { PiGear } from "react-icons/pi";
import { GoTriangleLeft, GoTriangleRight } from "react-icons/go";
import { HiOutlineExternalLink } from "react-icons/hi";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@components/LanguageSwitcher";

/** Same asset as `<link rel="icon">` — used as collapsed sidebar mark */
const APP_FAVICON = "/favicon.jpg";

export default function Parent() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeLink, setActiveLink] = useState(1);
  const [displayName, setDisplayName] = useState("Rohit");
  const { t } = useTranslation();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("userDetails");
      if (!raw) return;
      const u = JSON.parse(raw) as Record<string, string | undefined>;
      const name = u.name || u.userName || u.userId || u.email;
      if (name) setDisplayName(String(name));
    } catch {
      /* keep default */
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed ? "true" : "false");
  }, [collapsed]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  const mainNavItems = [
    { no: 1, title: t("navigation.adMasters"), path: "/admasters", icon: <MdHearing size={20} className="shrink-0" /> },
    { no: 2, title: t("navigation.songMasters"), path: "/songmasters", icon: <GiMusicalNotes size={20} className="shrink-0" /> },
    { no: 3, title: t("navigation.broadcasts"), path: "/broadcasts", icon: <FaBroadcastTower size={20} className="shrink-0" /> },
    { no: 4, title: t("navigation.settings"), path: "/settings", icon: <PiGear size={20} className="shrink-0" /> },
  ];

  const handleLink = (path: string) => {
    if (["/admasters", "/broadcasts", "/login", "/songmasters"].includes(path)) {
      navigate(path);
      setMobileNavOpen(false);
    }
  };

  const handleLogout = () => {
    navigate("/login");
    setMobileNavOpen(false);
  };

  const getBorderRadiusClass = (no: number) => {
    if (no === activeLink - 1) return "rounded-br-xl";
    if (no === activeLink + 1) return "rounded-tr-xl";
    return "";
  };

  const showLabels = !collapsed || mobileNavOpen;
  const isCollapsedRail = collapsed && !mobileNavOpen;
  const sidebarWidth = collapsed ? "md:w-[3.75rem]" : "md:w-[17.5rem]";

  return (
    <div className="audioai-root flex min-h-dvh min-w-0 flex-col md:flex-row md:items-start">
      <Toaster />

      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={`relative z-50 flex h-[100dvh] max-h-[100dvh] shrink-0 flex-col overflow-hidden border-r border-neutral-900 bg-neutral-950 text-neutral-300 transition-[width] duration-300 ${sidebarWidth}
          fixed inset-y-0 left-0 w-[min(18rem,90vw)] -translate-x-full md:relative md:translate-x-0
          ${mobileNavOpen ? "translate-x-0" : ""}`}
      >
        {/* Mobile: drawer header */}
        <div className="flex items-start justify-between gap-3 border-b border-neutral-800/90 px-4 py-4 md:hidden">
          <div className="flex min-w-0 flex-1 gap-3">
            <div className="mt-0.5 h-11 w-1 shrink-0 rounded-full bg-orange-400/90" aria-hidden />
            <div className="min-w-0">
              <img
                src="/logo.png"
                alt="FINDOUT AI"
                className="h-9 w-auto max-w-[200px] object-contain object-left"
              />
              <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                {t("navigation.forAudio")}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            className="shrink-0 rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"
            onClick={() => setMobileNavOpen(false)}
          >
            <MdClose size={22} />
          </button>
        </div>

        {/* Desktop: brand — full logo expanded; favicon-only when collapsed */}
        <div
          className={`hidden border-b border-neutral-800/90 md:block ${isCollapsedRail ? "px-1.5 py-4" : "px-5 py-6"}`}
        >
          {isCollapsedRail ? (
            <div className="flex justify-center">
              <img
                src={APP_FAVICON}
                alt="FINDOUT AI"
                className="h-9 w-9 rounded-lg border border-neutral-700 bg-neutral-900 object-cover shadow-sm"
                title="FINDOUT AI"
              />
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="mt-1 h-12 w-1 shrink-0 rounded-full bg-orange-400/90" aria-hidden />
              <div className="min-w-0 flex-1">
                <img
                  src="/logo.png"
                  alt="FINDOUT AI"
                  className="h-10 max-h-11 w-auto max-w-[200px] object-contain object-left"
                />
                <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                  {t("navigation.forAudio")}
                </p>
              </div>
            </div>
          )}
        </div>

        <nav className="hide-scrollbar flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain py-3 md:py-4">
          {mainNavItems.map((obj) => (
            <a
              key={obj.path}
              href={obj.path}
              className={`flex cursor-pointer items-center gap-3 py-3.5 text-[15px] transition-colors md:py-4 md:text-base ${getBorderRadiusClass(obj.no)} ${
                activeLink === obj.no
                  ? "nav-gradient font-semibold text-white md:text-[1.05rem]"
                  : "text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-100"
              } ${collapsed ? "justify-center px-2 md:px-0" : "pl-5 md:pl-6"}`}
              onClick={(e) => {
                e.preventDefault();
                handleLink(obj.path);
              }}
              title={collapsed && !mobileNavOpen ? obj.title : undefined}
            >
              {obj.icon}
              {showLabels && <span className="truncate pr-3">{obj.title}</span>}
            </a>
          ))}
        </nav>

        {/* Bottom: profile + language + logout + credit (only nav scrolls above) */}
        <div className="shrink-0 border-t border-neutral-800/90 bg-black/50 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {isCollapsedRail ? (
            <div className="flex flex-col items-center gap-3 border-b border-neutral-800/60 px-1.5 py-3">
              <img
                src="/man.jpg"
                alt={displayName}
                className="h-8 w-8 shrink-0 rounded-full border border-neutral-700 object-cover"
                title={displayName}
              />
              <LanguageSwitcher variant="rail" className="mx-auto" />
            </div>
          ) : (
            <div className="border-b border-neutral-800/60 px-3 py-3.5 md:px-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src="/man.jpg"
                    alt={displayName}
                    className="h-9 w-9 shrink-0 rounded-full border border-neutral-700 object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-200">{displayName}</span>
                </div>
                <LanguageSwitcher className="flex-wrap justify-start" />
              </div>
            </div>
          )}

          <a
            href="/login"
            className={`flex cursor-pointer items-center gap-3 border-b border-neutral-800/80 text-neutral-400 transition-colors hover:bg-neutral-900/90 hover:text-orange-200 ${
              isCollapsedRail ? "justify-center py-2.5" : "py-3.5 pl-5 md:py-4 md:pl-6"
            }`}
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            title={isCollapsedRail ? t("navigation.logout") : undefined}
          >
            <MdLogout size={isCollapsedRail ? 18 : 20} className="shrink-0 text-orange-400/90" />
            {showLabels && <span className="truncate pr-3 text-sm font-medium">{t("navigation.logout")}</span>}
          </a>

          {isCollapsedRail ? (
            <div className="flex justify-center px-1 pt-2">
              <a
                href="https://www.neuriot.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-900 hover:text-neutral-400"
                title={`${t("footer.poweredBy")} ${t("footer.neurIOTLabs")}`}
                aria-label={`${t("footer.poweredBy")} ${t("footer.neurIOTLabs")}`}
              >
                <HiOutlineExternalLink className="size-4" />
              </a>
            </div>
          ) : (
            <div className="px-3 py-3.5 md:px-4 md:pb-4">
              <a
                href="https://www.neuriot.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-[11px] leading-relaxed text-neutral-600 transition-colors hover:text-neutral-400 md:text-xs"
              >
                {t("footer.poweredBy")}{" "}
                <span className="font-semibold text-neutral-500 hover:text-neutral-300">{t("footer.neurIOTLabs")}</span>
              </a>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-1/2 right-0 z-10 hidden cursor-pointer -translate-y-1/2 translate-x-1/2 rounded-full border border-neutral-700 bg-neutral-950 p-1.5 text-neutral-300 shadow-md hover:border-neutral-500 hover:bg-neutral-900 hover:text-white md:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <GoTriangleRight size={14} /> : <GoTriangleLeft size={14} />}
        </button>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col md:h-[100dvh] md:max-h-[100dvh] md:overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-neutral-800 bg-black px-4 py-3 md:hidden">
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-lg p-2 text-neutral-300 hover:bg-neutral-900"
            onClick={() => setMobileNavOpen(true)}
          >
            <MdMenu size={24} />
          </button>
          <img src="/logo.png" alt="FINDOUT AI" className="h-8 w-auto max-w-[160px] object-contain opacity-95" />
          <div className="w-10 shrink-0" aria-hidden />
        </header>

        <div className="hide-scrollbar min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          <Outlet context={{ setActiveLink }} />
        </div>
      </div>
    </div>
  );
}
