import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "./api/api.js";

const compact = (value) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));

function normalize(row) {
  return Object.fromEntries(
    Object.entries(row || {}).map(([key, value]) => {
      if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) return [key, Number(value)];
      return [key, value];
    })
  );
}

function tag(row) {
  return row.tag_name || row.tag || row.TagName || "Unknown";
}

function category(row) {
  return row.tag_category || row.category || row.TagCategory || "Other";
}

function movementKey(row) {
  const preferred = ["decline_pct", "pct_change", "change_pct", "decline_percent", "question_drop", "drop_count"];
  return preferred.find((key) => row[key] !== undefined && Number.isFinite(Number(row[key]))) ||
    Object.keys(row).find((key) => {
      const lower = key.toLowerCase();
      return !["tag", "tag_name", "tagcategory", "tag_category", "category"].includes(lower) && Number.isFinite(Number(row[key]));
    });
}

function label(key) {
  return String(key || "movement").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function DeclineRanking() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/decline-ranking");
        if (!cancelled) setRows(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || "Failed to load decline ranking");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalized = useMemo(() => rows.map(normalize), [rows]);
  const categories = Array.from(new Set(normalized.map(category))).filter(Boolean).sort();
  const key = movementKey(normalized[0] || {});
  const filtered = normalized.filter((row) => !filterCategory || category(row) === filterCategory);
  const ranked = filtered
    .slice()
    .sort((a, b) => Math.abs(Number(b[key] || 0)) - Math.abs(Number(a[key] || 0)))
    .slice(0, 10)
    .map((row) => ({
      tag: tag(row),
      category: category(row),
      movement: Number(row[key] || 0),
    }));
  const strongest = ranked[0];
  const averageMovement =
    filtered.length > 0 ? filtered.reduce((sum, row) => sum + Math.abs(Number(row[key] || 0)), 0) / filtered.length : 0;

  return (
    <main className="min-h-screen bg-[#dfe7ff] px-3 py-5 text-slate-900 sm:px-6 lg:ml-64 lg:px-8">
      <section className="mx-auto max-w-7xl rounded-[28px] border border-white/70 bg-[#f8f9ff] p-4 shadow-2xl shadow-blue-200/70 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#f26d8f]">Question Detail</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Decline Ranking</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Finds tags with the strongest movement signal so the report can explain where demand changed.
            </p>
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-2xl bg-white px-5 py-3 text-sm font-bold shadow-sm outline-none">
            <option value="">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        {loading && <div className="mt-5 rounded-2xl bg-white p-5 text-sm text-slate-500">Loading decline ranking...</div>}
        {error && <div className="mt-5 rounded-2xl bg-rose-50 p-5 text-sm font-semibold text-rose-700">Error: {error}</div>}

        {!loading && !error && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl bg-gradient-to-br from-[#f26d8f] to-[#ff9db3] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Rows analyzed</p>
                <div className="mt-5 text-3xl font-semibold">{filtered.length}</div>
                <p className="mt-1 text-xs font-semibold text-white/80">{filterCategory || "All categories"}</p>
              </article>
              <article className="rounded-2xl bg-gradient-to-br from-[#5570d9] to-[#7892f0] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Strongest tag</p>
                <div className="mt-5 text-3xl font-semibold">{strongest?.tag || "N/A"}</div>
                <p className="mt-1 text-xs font-semibold text-white/80">{strongest ? compact(strongest.movement) : "No movement"}</p>
              </article>
              <article className="rounded-2xl bg-gradient-to-br from-[#43b6a8] to-[#7ad9cc] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Avg absolute movement</p>
                <div className="mt-5 text-3xl font-semibold">{compact(averageMovement)}</div>
                <p className="mt-1 text-xs font-semibold text-white/80">{label(key)}</p>
              </article>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">Largest Movement Tags</h2>
                <p className="mt-1 text-sm text-slate-500">Sorted by absolute {label(key).toLowerCase()}.</p>
                <div className="mt-4 h-[28rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ranked} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                      <CartesianGrid stroke="#edf0f7" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={compact} />
                      <YAxis dataKey="tag" type="category" width={130} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip formatter={(value) => [compact(value), label(key)]} />
                      <Bar dataKey="movement" fill="#f26d8f" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">Movement Details</h2>
                <p className="mt-1 text-sm text-slate-500">Top records with category context.</p>
                <div className="mt-4 space-y-3">
                  {ranked.map((row, index) => (
                    <div key={`${row.tag}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{index + 1}. {row.tag}</p>
                          <p className="mt-1 text-xs text-slate-500">{row.category}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#f26d8f] shadow-sm">
                          {compact(row.movement)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
