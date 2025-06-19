import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router";

export default function Parent() {
  const navigate = useNavigate();
  const sidebarLinks = [
    { title: "Ad Masters", path: "/admasters" },
    { title: "Song Masters", path: "/songmasters" },
    { title: "Broadcasts", path: "/broadcasts" },
    { title: "Settings", path: "/settings" },
    { title: "Logout", path: "/logout" },
  ];

  const [activeLink, setActiveLink] = useState("/admasters");

  const handleLink = (path: string) => {
    if(path == '/admasters' || path == '/broadcasts')
      navigate(path)
  }

  return (
    <div className="audioai-root">
      <aside className="w-80 text-white bg-black flex flex-col pt-12 shrink-0">
        <div className="flex flex-col gap-2 justify-end !mb-8 pl-8">
          <img src="/findoutAi.jpg" alt="findoutAiLogo" className="w-2/3" />
          <div className="text-sm text-neutral-300 font-light tracking-wide">For Audio Media</div>
        </div>
        <nav className="flex flex-col gap-2 px-4">
          {sidebarLinks.map((obj) => (
            <a key={obj.path} className={`p-5 rounded-md hover:bg-neutral-800 cursor-pointer text-lg ${activeLink === obj.path ? " font-bold text-xl" : ""}`} onClick={() => handleLink(obj.path)}>
              {obj.title}
            </a>
          ))}
        </nav>
        <div className="text-center !mt-12 text-sm text-neutral-500">
          <a href="https://www.neuriot.com/" target="_blank" rel="noopener noreferrer">
            Powered by <span className="font-bold">neurIOT Labs</span>
          </a>
        </div>
      </aside>
      <Outlet context={{setActiveLink}}/>
    </div>
  );
}
