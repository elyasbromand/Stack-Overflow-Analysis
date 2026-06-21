import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "./api/api.js";

const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (value) => Number(value || 0).toLocaleString();
const compact = (value) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));

function normalize(row) {
  return Object.fromEntries(
    Object.entries(row || {}).map(([key, value]) => {
      const lower = key.toLowerCase();
      if (lower === "yr" || lower === "year") return ["year", Number(value) || 0];
      if (lower === "mo" || lower === "month") return ["month", Number(value) || 0];
      if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) return [key, Number(value)];
      return [key, value];
    })
  );
}

export default function MonthlyRecent() {
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
        const res = await api.get("/monthly-recent");
        if (!cancelled) setRows(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || "Failed to load monthly recent");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalized = useMemo(
    () =>
      rows
        .map(normalize)
        .map((row) => ({
          ...row,
          question_count: Number(row.question_count ?? row.QuestionCount ?? 0),
          period: `${row.year}-${String(row.month).padStart(2, "0")}`,
          month_label: monthNames[row.month] || row.month,
        }))
        .sort((a, b) => a.year - b.year || a.month - b.month),
    [rows]
  );

  const years = useMemo(() => Array.from(new Set(normalized.map((row) => row.year))).filter(Boolean), [normalized]);
  const activeYear = Number(selectedYear || years[years.length - 1]) || 0;
  const yearRows = normalized.filter((row) => row.year === activeYear);
  const recentRows = normalized.slice(-18);
  const yearTotal = yearRows.reduce((sum, row) => sum + row.question_count, 0);
  const bestMonth = yearRows.reduce((best, row) => (row.question_count > best.question_count ? row : best), {
    month_label: "N/A",
    question_count: 0,
  });
  const previousYearTotal = normalized
    .filter((row) => row.year === activeYear - 1)
    .reduce((sum, row) => sum + row.question_count, 0);
  const yearlyChange = previousYearTotal ? ((yearTotal - previousYearTotal) / previousYearTotal) * 100 : 0;

  return (
    <main className="min-h-screen bg-[#dfe7ff] px-3 py-5 text-slate-900 sm:px-6 lg:ml-64 lg:px-8">
      <section className="mx-auto max-w-7xl rounded-[28px] border border-white/70 bg-[#f8f9ff] p-4 shadow-2xl shadow-blue-200/70 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#43b6a8]">Recent Momentum</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Monthly Recent</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Month-level view for the latest period, useful for spotting recent cliffs or recoveries.
            </p>
          </div>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="rounded-2xl bg-white px-5 py-3 text-sm font-bold shadow-sm outline-none">
            <option value="">Latest year</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>

        {loading && <div className="mt-5 rounded-2xl bg-white p-5 text-sm text-slate-500">Loading monthly data...</div>}
        {error && <div className="mt-5 rounded-2xl bg-rose-50 p-5 text-sm font-semibold text-rose-700">Error: {error}</div>}

        {!loading && !error && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl bg-gradient-to-br from-[#43b6a8] to-[#7ad9cc] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Year total</p>
                <div className="mt-5 text-3xl font-semibold">{compact(yearTotal)}</div>
                <p className="mt-1 text-xs font-semibold text-white/80">{activeYear} monthly questions</p>
              </article>
              <article className="rounded-2xl bg-gradient-to-br from-[#5570d9] to-[#7892f0] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Best month</p>
                <div className="mt-5 text-3xl font-semibold">{bestMonth.month_label}</div>
                <p className="mt-1 text-xs font-semibold text-white/80">{fmt(bestMonth.question_count)} questions</p>
              </article>
              <article className="rounded-2xl bg-gradient-to-br from-[#ff8a62] to-[#ffb06f] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Vs previous year</p>
                <div className="mt-5 text-3xl font-semibold">{yearlyChange.toFixed(1)}%</div>
                <p className="mt-1 text-xs font-semibold text-white/80">Compared with {activeYear - 1}</p>
              </article>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">{activeYear} Monthly Pattern</h2>
                <p className="mt-1 text-sm text-slate-500">Month-by-month count for the selected year.</p>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yearRows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#edf0f7" vertical={false} />
                      <XAxis dataKey="month_label" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={compact} tickLine={false} />
                      <Tooltip formatter={(value) => [fmt(value), "Questions"]} />
                      <Line dataKey="question_count" stroke="#43b6a8" strokeWidth={4} type="monotone" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">Last 18 Records</h2>
                <p className="mt-1 text-sm text-slate-500">A compact view of the most recent monthly momentum.</p>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recentRows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#edf0f7" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={compact} tickLine={false} />
                      <Tooltip formatter={(value) => [fmt(value), "Questions"]} />
                      <Bar dataKey="question_count" fill="#5570d9" radius={[8, 8, 0, 0]} />
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
