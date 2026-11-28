import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

const tabs = [
  { to: "/", label: "Inicio", icon: "🏠" },
  { to: "/rutas", label: "Rutas", icon: "🗺️" },
  { to: "/mapa", label: "Mapa", icon: "📍" },
  { to: "/caminar", label: "Caminar", icon: "🚶" },
  { to: "/estadisticas", label: "Stats", icon: "📊" },
  { to: "/historial", label: "Historial", icon: "📜" },
  { to: "/crear", label: "Crear", icon: "✏️" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState<boolean>(localStorage.getItem("theme") === "dark");
  const [large, setLarge] = useState<boolean>(localStorage.getItem("largeText") === "1");
  useEffect(() => {
    document.body.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    document.body.classList.toggle("large-text", large);
    localStorage.setItem("largeText", large ? "1" : "0");
  }, [large]);
  return (
    <div className="app">
      <header className="topbar">
        <h1>AYAMONTE A PIE</h1>
        <div style={{ position: "absolute", right: 12, top: 12, display: "flex", gap: 6 }}>
          <button onClick={() => setDark(!dark)} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, padding: "4px 8px", color: "white", cursor: "pointer" }}>{dark ? "☀️" : "🌙"}</button>
          <button onClick={() => setLarge(!large)} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, padding: "4px 8px", color: "white", cursor: "pointer" }}>A+</button>
        </div>
      </header>
      <main className="content">{children ?? <Outlet />}</main>
      <nav className="bottomnav">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => "navitem" + (isActive ? " active" : "")} end={t.to === "/"}>
            <span className="navicon">{t.icon}</span>
            <span className="navlabel">{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}