import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const navGroups = [
  {
    title: "Report",
    items: [
      { path: "/", label: "Overview", code: "OV", description: "Executive analytics" },
      { path: "/summary", label: "Summary", code: "SU", description: "KPI range view" },
    ],
  },
  {
    title: "Trend Analysis",
    items: [
      { path: "/yearly-by-category", label: "Yearly Category", code: "YC", description: "Category volume" },
      { path: "/category-share", label: "Category Share", code: "CS", description: "Share movement" },
      { path: "/monthly-recent", label: "Monthly Recent", code: "MR", description: "Recent momentum" },
    ],
  },
  {
    title: "Question Detail",
    items: [
      { path: "/tag-breakdown", label: "Tag Breakdown", code: "TB", description: "Top tag demand" },
      { path: "/decline-ranking", label: "Decline Ranking", code: "DR", description: "Largest changes" },
      { path: "/engagement-trend", label: "Engagement", code: "EN", description: "Score and answers" },
    ],
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const goTo = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 grid h-12 w-12 place-items-center rounded-2xl bg-[#5570d9] shadow-xl shadow-blue-300/70 lg:hidden"
        aria-label="Open navigation"
      >
        <span className="grid gap-1">
          <span className="block h-0.5 w-5 rounded-full bg-white" />
          <span className="block h-0.5 w-5 rounded-full bg-white" />
          <span className="block h-0.5 w-5 rounded-full bg-white" />
        </span>
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/70 bg-[#f8f9ff] text-slate-900 shadow-2xl shadow-blue-200/50 mx-3 my-5 rounded-3xl transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200/80 px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goTo("/")}
                className="flex min-w-0 items-center gap-3 text-left"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#5570d9] text-md font-bold text-white shadow-lg shadow-blue-300/60">
                  SO
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-bold tracking-tight">Stack Lens</span>
                  <span className="block truncate text-xs font-semibold uppercase tracking-[0.18em] text-[#5570d9]">
                    Data Warehouse
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg font-semibold text-slate-500 shadow-sm lg:hidden"
                aria-label="Close navigation"
              >
                x
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Dashboard Focus</p>
              <p className="mt-2 text-sm font-semibold leading-5 text-slate-700">
                Volume, category shift, tag demand, and engagement quality from live API responses.
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="px-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  {group.title}
                </p>
                <div className="mt-2 space-y-1.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => goTo(item.path)}
                        className={`grid w-full grid-cols-[2.25rem_1fr] items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                          isActive
                            ? "bg-[#5570d9] text-white shadow-lg shadow-blue-200"
                            : "bg-white/70 text-slate-700 hover:bg-white hover:shadow-sm"
                        }`}
                      >
                        <span
                          className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-bold ${
                            isActive ? "bg-white/20 text-white" : "bg-[#edf1ff] text-[#5570d9]"
                          }`}
                        >
                          {item.code}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold">{item.label}</span>
                          <span className={`block truncate text-xs ${isActive ? "text-white/75" : "text-slate-400"}`}>
                            {item.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          aria-label="Close navigation overlay"
        />
      )}
    </>
  );
}
