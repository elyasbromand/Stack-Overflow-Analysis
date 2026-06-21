import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "./api/api.js";

const colors = ["#5570d9", "#ff8a62", "#43b6a8", "#9b7bea", "#f6c85f", "#f26d8f"];

function normalize(row) {
  return Object.fromEntries(
    Object.entries(row || {}).map(([key, value]) => {
      if (key.toLowerCase() === "year") return ["year", Number(value) || 0];
      if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) return [key, Number(value)];
      return [key, value];
    })
  );
}

function label(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function CategoryShare() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/category-share");
        if (!cancelled) setRows(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || "Failed to load category share");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo(() => rows.map(normalize).sort((a, b) => a.year - b.year), [rows]);
  const years = data.map((row) => row.year).filter(Boolean);
  const activeYear = Number(selectedYear || years[years.length - 1]) || 0;
  const activeRow = data.find((row) => row.year === activeYear) || {};
  const shareKeys = Object.keys(activeRow).filter((key) => key !== "year" && Number.isFinite(Number(activeRow[key])));
  const pieData = shareKeys.map((key) => ({ name: label(key), value: Number(activeRow[key] || 0) }));
  const movementData = shareKeys.map((key) => {
    const first = data[0] || {};
    return { metric: label(key), change: Number(activeRow[key] || 0) - Number(first[key] || 0) };
  });
  const leader = pieData.slice().sort((a, b) => b.value - a.value)[0];

  return (
    <main className="min-h-screen bg-[#dfe7ff] px-3 py-5 text-slate-900 sm:px-6 lg:ml-64 lg:px-8">
      <section className="mx-auto max-w-7xl rounded-[28px] border border-white/70 bg-[#f8f9ff] p-4 shadow-2xl shadow-blue-200/70 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <p className="text-xs font-normal uppercase tracking-[0.25em] text-[#5570d9]">Trend Analysis</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Category Share</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Percentage composition view for understanding how topic share changes over time.
            </p>
          </div>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="rounded-2xl bg-white px-5 py-3 text-sm font-bold shadow-sm outline-none">
            <option value="">Latest year</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>

        {loading && <div className="mt-5 rounded-2xl bg-white p-5 text-sm text-slate-500">Loading category share...</div>}
        {error && <div className="mt-5 rounded-2xl bg-rose-50 p-5 text-sm font-semibold text-rose-700">Error: {error}</div>}

        {!loading && !error && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl bg-gradient-to-br from-[#5570d9] to-[#7892f0] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Selected year</p>
                <div className="mt-5 text-3xl font-semibold">{activeYear || "N/A"}</div>
                <p className="mt-1 text-xs font-semibold text-white/80">Share snapshot</p>
              </article>
              <article className="rounded-2xl bg-gradient-to-br from-[#ff8a62] to-[#ffb06f] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Leading share</p>
                <div className="mt-5 text-3xl font-semibold">{leader ? `${leader.value.toFixed(1)}%` : "N/A"}</div>
                <p className="mt-1 text-xs font-semibold text-white/80">{leader?.name || "No metric"}</p>
              </article>
              <article className="rounded-2xl bg-gradient-to-br from-[#43b6a8] to-[#7ad9cc] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Metrics tracked</p>
                <div className="mt-5 text-3xl font-semibold">{shareKeys.length}</div>
                <p className="mt-1 text-xs font-semibold text-white/80">Numeric share fields</p>
              </article>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">{activeYear} Share Mix</h2>
                <p className="mt-1 text-sm text-slate-500">Donut chart from the selected API row.</p>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" innerRadius="55%" outerRadius="82%" paddingAngle={3}>
                        {pieData.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, "Share"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">Change From First Year</h2>
                <p className="mt-1 text-sm text-slate-500">Positive and negative share movement in percentage points.</p>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={movementData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#edf0f7" vertical={false} />
                      <XAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} pts`, "Change"]} />
                      <Legend />
                      <Bar dataKey="change" name="Share point change" fill="#5570d9" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
