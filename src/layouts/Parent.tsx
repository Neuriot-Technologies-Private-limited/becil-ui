import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner"
import { GiMusicalNotes } from "react-icons/gi";
import { FaBroadcastTower } from "react-icons/fa";
import { MdHearing, MdLogout } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router";
import { PiGear } from "react-icons/pi";
import { GoTriangleLeft, GoTriangleRight } from "react-icons/go";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@components/LanguageSwitcher';

export default function Parent() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<boolean>();
  const [activeLink, setActiveLink] = useState(1);
  const { t } = useTranslation();

  // Load sidebar state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed ? collapsed.toString() : "false");
  }, [collapsed]);

  const sidebarLinks = [
    { no: 1, title: t('navigation.adMasters'), path: "/admasters", icon: <MdHearing size={18} className="shrink-0" /> },
    { no: 2, title: t('navigation.songMasters'), path: "/songmasters", icon: <GiMusicalNotes size={18} className="shrink-0" /> },
    { no: 3, title: t('navigation.broadcasts'), path: "/broadcasts", icon: <FaBroadcastTower size={18} className="shrink-0" /> },
    { no: 4, title: t('navigation.settings'), path: "/settings", icon: <PiGear size={18} className="shrink-0" /> },
    { no: 5, title: t('navigation.logout'), path: "/login", icon: <MdLogout size={18} className="shrink-0" /> },
  ];

  const handleLink = (path: string) => {
    if (["/admasters", "/broadcasts", "/login", "/songmasters"].includes(path)) navigate(path);
  };

  const getBorderRadiusClass = (no: number) => {
    if (no === activeLink - 1) return "rounded-br-xl";
    if (no === activeLink + 1) return "rounded-tr-xl";
    return "";
  };

  return (
    <div className="audioai-root flex">
      <Toaster />
      
      <aside className={`text-neutral-300 flex flex-col shrink-0 bg-black transition-all duration-300 ${collapsed ? "w-32" : "w-68"}`}>
        {/* Logo and Header */}
        <div className={`relative left-0 flex flex-col gap-2 pt-8 pb-6 ${getBorderRadiusClass(0)} ${collapsed ? "items-center" : "items-start left-8"}`}>
          <img
            src="/logo.png"
            alt="findoutAiLogo"
            className={`transition-all duration-300 ${collapsed ? "w-24" : "w-3/5"}`}
          />
          <div className="text-sm text-neutral-300 font-light tracking-wide text-center whitespace-nowrap">
            {t('navigation.forAudio')}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex flex-col">
          {sidebarLinks.map((obj) => (
            <a
              key={obj.path}
              className={`flex gap-4 items-center py-5 cursor-pointer text-lg transition-all duration-300 whitespace-nowrap ${getBorderRadiusClass(obj.no)} ${activeLink === obj.no ? "font-bold text-xl nav-gradient" : "hover:bg-neutral-900"} ${collapsed ? "justify-center pl-4" : "pl-8"}`}
              onClick={() => handleLink(obj.path)}
              title={collapsed ? obj.title : ""}
            >
              {obj.icon}
              {!collapsed && obj.title}
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div className={"relative bg-black grow flex items-start justify-center pt-6 " + getBorderRadiusClass(6)}>
          <div className="text-center text-sm text-neutral-500 px-2">
            <a href="https://www.neuriot.com/" target="_blank" rel="noopener noreferrer">
              {t('footer.poweredBy')} <span className="font-bold">{t('footer.neurIOTLabs')}</span>
            </a>
          </div>

          {/* Collapse Toggle Arrow */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-24 -right-3 bg-black border border-neutral-700 rounded-full p-1 hover:bg-neutral-800"
          >
            {collapsed ? <GoTriangleRight /> : <GoTriangleLeft />}
          </button>
        </div>
      </aside>

      <Outlet context={{ setActiveLink }} />
    </div>
  );
}

