import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "./api/api.js";

const fmt = (value) => Number(value || 0).toLocaleString();
const compact = (value) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));

function normalize(row) {
  return Object.fromEntries(
    Object.entries(row || {}).map(([key, value]) => {
      if (key.toLowerCase() === "year") return ["year", Number(value) || 0];
      if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) return [key, Number(value)];
      return [key, value];
    })
  );
}

export default function TagBreakdown() {
  const [tagData, setTagData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/tag-breakdown");
        if (!cancelled) setTagData(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || "Failed to load tag breakdown");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalized = useMemo(() => tagData.map(normalize), [tagData]);
  const years = useMemo(() => Array.from(new Set(normalized.map((row) => row.year))).filter(Boolean).sort((a, b) => a - b), [normalized]);
  const activeYear = Number(selectedYear || years[years.length - 1]) || 0;
  const filtered = normalized.filter((row) => row.year === activeYear);
  const topTags = filtered
    .slice()
    .sort((a, b) => Number(b.question_count || 0) - Number(a.question_count || 0))
    .slice(0, 10)
    .map((row) => ({
      tag: row.tag_name || row.tag || "Unknown",
      questions: Number(row.question_count || 0),
      score: Number(row.avg_score || 0),
    }));
  const totalQuestions = filtered.reduce((sum, row) => sum + Number(row.question_count || 0), 0);
  const avgScore =
    filtered.length > 0 ? filtered.reduce((sum, row) => sum + Number(row.avg_score || 0), 0) / filtered.length : 0;

  return (
    <main className="min-h-screen bg-[#dfe7ff] px-3 py-5 text-slate-900 sm:px-6 lg:ml-64 lg:px-8">
      <section className="mx-auto max-w-7xl rounded-[28px] border border-white/70 bg-[#f8f9ff] p-4 shadow-2xl shadow-blue-200/70 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9b7bea]">Question Detail</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Tag Breakdown</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Ranking of tag demand and average quality signals for the selected year.
            </p>
          </div>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="rounded-2xl bg-white px-5 py-3 text-sm font-bold shadow-sm outline-none">
            <option value="">Latest year</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>

        {loading && <div className="mt-5 rounded-2xl bg-white p-5 text-sm text-slate-500">Loading tag data...</div>}
        {error && <div className="mt-5 rounded-2xl bg-rose-50 p-5 text-sm font-semibold text-rose-700">Error: {error}</div>}

        {!loading && !error && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl bg-gradient-to-br from-[#9b7bea] to-[#c4b1ff] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Tags in year</p>
                <div className="mt-5 text-3xl font-semibold">{filtered.length}</div>
                <p className="mt-1 text-xs font-semibold text-white/80">{activeYear} records</p>
              </article>
              <article className="rounded-2xl bg-gradient-to-br from-[#5570d9] to-[#7892f0] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Question volume</p>
                <div className="mt-5 text-3xl font-semibold">{compact(totalQuestions)}</div>
                <p className="mt-1 text-xs font-semibold text-white/80">Across selected tags</p>
              </article>
              <article className="rounded-2xl bg-gradient-to-br from-[#ff8a62] to-[#ffb06f] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Average score</p>
                <div className="mt-5 text-3xl font-semibold">{avgScore.toFixed(2)}</div>
                <p className="mt-1 text-xs font-semibold text-white/80">Mean tag score signal</p>
              </article>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">Top Tags by Questions</h2>
                <p className="mt-1 text-sm text-slate-500">Highest demand tags in {activeYear}.</p>
                <div className="mt-4 h-[28rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topTags} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                      <CartesianGrid stroke="#edf0f7" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={compact} />
                      <YAxis dataKey="tag" type="category" width={130} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip formatter={(value) => [fmt(value), "Questions"]} />
                      <Bar dataKey="questions" fill="#9b7bea" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">Tag Leaderboard</h2>
                <p className="mt-1 text-sm text-slate-500">Readable ranking with score context.</p>
                <div className="mt-4 space-y-3">
                  {topTags.map((row, index) => (
                    <div key={row.tag} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{index + 1}. {row.tag}</p>
                          <p className="mt-1 text-xs text-slate-500">Avg score {row.score.toFixed(2)}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#5570d9] shadow-sm">
                          {compact(row.questions)}
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
