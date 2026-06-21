import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "./api/api.js";

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

export default function EngagementTrend() {
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
        const res = await api.get("/engagement-trend");
        if (!cancelled) setRows(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || "Failed to load engagement trend");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo(
    () =>
      rows
        .map(normalize)
        .map((row) => ({
          year: row.year,
          avg_score: Number(row.avg_score || 0),
          avg_answer_count: Number(row.avg_answer_count || 0),
          avg_view_count: Number(row.avg_view_count || 0),
        }))
        .sort((a, b) => a.year - b.year),
    [rows]
  );
  const years = data.map((row) => row.year);
  const activeYear = Number(selectedYear || years[years.length - 1]) || 0;
  const activeRow = data.find((row) => row.year === activeYear) || {};
  const metricBars = [
    { metric: "Score", value: activeRow.avg_score || 0, fill: "#43b6a8" },
    { metric: "Answers", value: activeRow.avg_answer_count || 0, fill: "#ff8a62" },
    { metric: "Views / 100", value: (activeRow.avg_view_count || 0) / 100, fill: "#5570d9" },
  ];

  return (
    <main className="min-h-screen bg-[#dfe7ff] px-3 py-5 text-slate-900 sm:px-6 lg:ml-64 lg:px-8">
      <section className="mx-auto max-w-7xl rounded-[28px] border border-white/70 bg-[#f8f9ff] p-4 shadow-2xl shadow-blue-200/70 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ff8a62]">Quality Signal</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Engagement Trend</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Average score, answers, and views show whether questions are still attracting useful attention.
            </p>
          </div>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="rounded-2xl bg-white px-5 py-3 text-sm font-bold shadow-sm outline-none">
            <option value="">Latest year</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>

        {loading && <div className="mt-5 rounded-2xl bg-white p-5 text-sm text-slate-500">Loading engagement data...</div>}
        {error && <div className="mt-5 rounded-2xl bg-rose-50 p-5 text-sm font-semibold text-rose-700">Error: {error}</div>}

        {!loading && !error && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl bg-gradient-to-br from-[#43b6a8] to-[#7ad9cc] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Avg score</p>
                <div className="mt-5 text-3xl font-semibold">{Number(activeRow.avg_score || 0).toFixed(2)}</div>
                <p className="mt-1 text-xs font-semibold text-white/80">{activeYear}</p>
              </article>
              <article className="rounded-2xl bg-gradient-to-br from-[#ff8a62] to-[#ffb06f] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Avg answers</p>
                <div className="mt-5 text-3xl font-semibold">{Number(activeRow.avg_answer_count || 0).toFixed(2)}</div>
                <p className="mt-1 text-xs font-semibold text-white/80">Per question</p>
              </article>
              <article className="rounded-2xl bg-gradient-to-br from-[#5570d9] to-[#7892f0] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Avg views</p>
                <div className="mt-5 text-3xl font-semibold">{compact(activeRow.avg_view_count)}</div>
                <p className="mt-1 text-xs font-semibold text-white/80">Per question</p>
              </article>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">Engagement Over Time</h2>
                <p className="mt-1 text-sm text-slate-500">Score and answer trend by year.</p>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#edf0f7" vertical={false} />
                      <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} />
                      <Tooltip />
                      <Legend />
                      <Line dataKey="avg_score" name="Avg score" stroke="#43b6a8" strokeWidth={3} type="monotone" />
                      <Line dataKey="avg_answer_count" name="Avg answers" stroke="#ff8a62" strokeWidth={3} type="monotone" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">{activeYear} Metric Snapshot</h2>
                <p className="mt-1 text-sm text-slate-500">Views are scaled by 100 so all metrics compare visually.</p>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metricBars} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#edf0f7" vertical={false} />
                      <XAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {metricBars.map((entry) => <Cell key={entry.metric} fill={entry.fill} />)}
                      </Bar>
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
