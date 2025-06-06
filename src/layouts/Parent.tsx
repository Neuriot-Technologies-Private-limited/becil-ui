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
      <aside className="audioai-sidebar">
        <div className="audioai-logo-block">
          <img src="/findoutAi.jpg" alt="findoutAiLogo" className="audioai-logo-img" />
          <div className="audioai-logo-subtext">For Audio Media</div>
        </div>
        <nav className="audioai-nav">
          {sidebarLinks.map((obj) => (
            <a key={obj.path} className={`audioai-nav-link${activeLink === obj.path ? " active" : ""}`} onClick={() => handleLink(obj.path)}>
              {obj.title}
            </a>
          ))}
        </nav>
        <div className="audioai-sidebar-branding">
          <a href="https://www.neuriot.com/" target="_blank" rel="noopener noreferrer">
            Powered by <span className="audioai-branding-bold">neurIOT Labs</span>
          </a>
        </div>
      </aside>
      <Outlet context={{setActiveLink}}/>
    </div>
  );
}
