import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Yearly Totals", icon: "📊" },
    { path: "/yearly-by-category", label: "By Category", icon: "📈" },
    { path: "/category-share", label: "Category Share", icon: "📉" },
    { path: "/tag-breakdown", label: "By Tag", icon: "🏷️" },
    { path: "/decline-ranking", label: "Decline Rank", icon: "🏆" },
    { path: "/monthly-recent", label: "Monthly Recent", icon: "📆" },
    { path: "/engagement-trend", label: "Engagement", icon: "✨" },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg lg:hidden"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
            <h1 className="text-xl font-bold">SO Dashboard</h1>
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-1 hover:bg-slate-800 lg:hidden"
            >
              ✕
            </button>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left rounded-2xl px-4 py-3 font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-700 px-6 py-4 text-xs text-slate-400">
            <p>Stack Overflow Analysis</p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}
    </>
  );
}
