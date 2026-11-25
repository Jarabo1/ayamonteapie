import { NavLink, Outlet } from "react-router-dom";

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
  return (
    <div className="app">
      <header className="topbar">
        <h1>AYAMONTE A PIE</h1>
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