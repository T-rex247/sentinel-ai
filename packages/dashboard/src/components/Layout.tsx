import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/agents", label: "Agents" },
  { to: "/alerts", label: "Alerts" },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-sentinel-bg">
      <nav className="border-b border-sentinel-border bg-sentinel-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-8">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="text-sentinel-accent">Sentinel</span>
            <span className="text-sentinel-purple">AI</span>
          </div>
          <div className="flex gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sentinel-accent/10 text-sentinel-accent"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
          <div className="ml-auto text-xs text-gray-500">
            AI Agent Security Monitor
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
