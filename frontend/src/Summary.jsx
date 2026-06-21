import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "./api/api.js";

const fmt = (value) => Number(value || 0).toLocaleString();
const compact = (value) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

export default function Summary() {
  const [summary, setSummary] = useState(null);
  const [shareRows, setShareRows] = useState([]);
  const [yearlyTotals, setYearlyTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, shareRes, totalsRes] = await Promise.all([
          api.get("/summary"),
          api.get("/category-share"),
          api.get("/yearly-totals"),
        ]);
        if (cancelled) return;
        setSummary(summaryRes.data || null);
        setShareRows(shareRes.data || []);
        setYearlyTotals(totalsRes.data || []);
      } catch (err) {
        setError(
          err?.response?.data?.error || err.message || "Failed to load summary",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const years = useMemo(() => {
    const set = new Set();
    shareRows.forEach((row) => set.add(Number(row.year)));
    yearlyTotals.forEach((row) => set.add(Number(row.year)));
    return Array.from(set)
      .filter(Boolean)
      .sort((a, b) => a - b);
  }, [shareRows, yearlyTotals]);

  const activeStartYear = Number(startYear || years[0]) || -Infinity;
  const activeEndYear = Number(endYear || years[years.length - 1]) || Infinity;

  const filteredTotals = useMemo(
    () =>
      yearlyTotals
        .map((row) => ({
          year: Number(row.year),
          question_count: Number(row.question_count || 0),
        }))
        .filter(
          (row) => row.year >= activeStartYear && row.year <= activeEndYear,
        ),
    [activeEndYear, activeStartYear, yearlyTotals],
  );

  const filteredShare = useMemo(
    () =>
      shareRows
        .map((row) => ({
          ...row,
          year: Number(row.year),
          infra_pct: Number(row.infra_pct || 0),
        }))
        .filter(
          (row) => row.year >= activeStartYear && row.year <= activeEndYear,
        ),
    [activeEndYear, activeStartYear, shareRows],
  );

  const rangeTotal = filteredTotals.reduce(
    (sum, row) => sum + row.question_count,
    0,
  );
  const rangePeak = filteredTotals.reduce(
    (best, row) => (row.question_count > best.question_count ? row : best),
    { year: "N/A", question_count: 0 },
  );
  const latest = filteredTotals[filteredTotals.length - 1] || {
    year: "N/A",
    question_count: 0,
  };
  const firstShare = filteredShare[0];
  const lastShare = filteredShare[filteredShare.length - 1];
  const shareDelta =
    firstShare && lastShare ? lastShare.infra_pct - firstShare.infra_pct : 0;

  const cards = [
    [
      "Warehouse rows",
      compact(summary?.total_questions_sampled || rangeTotal),
      `${fmt(summary?.total_questions_sampled || rangeTotal)} questions`,
      "from-[#5570d9] to-[#7892f0]",
    ],
    [
      "Peak year",
      summary?.peak_year || rangePeak.year,
      `${compact(summary?.peak_year_count || rangePeak.question_count)} questions`,
      "from-[#ff8a62] to-[#ffb06f]",
    ],
    [
      "Latest in range",
      latest.year,
      `${compact(latest.question_count)} questions`,
      "from-[#43b6a8] to-[#7ad9cc]",
    ],
    [
      "Infra share shift",
      `${shareDelta.toFixed(1)} pts`,
      `${firstShare?.year || "N/A"} to ${lastShare?.year || "N/A"}`,
      "from-[#9b7bea] to-[#c4b1ff]",
    ],
  ];

  return (
    <main className="min-h-screen bg-[#dfe7ff] px-3 py-5 text-slate-900 sm:px-6 lg:ml-64 lg:px-8">
      <section className="mx-auto max-w-7xl rounded-[28px] border border-white/70 bg-[#f8f9ff] p-4 shadow-2xl shadow-blue-200/70 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#5570d9]">
              Executive Report
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Summary Analytics
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Range-level KPI view combining summary, category share, and yearly
              totals endpoints.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <select
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              className="rounded-xl bg-slate-50 px-4 py-2 text-sm font-semibold outline-none"
            >
              <option value="">Start auto</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={endYear}
              onChange={(e) => setEndYear(e.target.value)}
              className="rounded-xl bg-slate-50 px-4 py-2 text-sm font-semibold outline-none"
            >
              <option value="">End auto</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="mt-5 rounded-2xl bg-white p-5 text-sm text-slate-500">
            Loading summary data...
          </div>
        )}
        {error && (
          <div className="mt-5 rounded-2xl bg-rose-50 p-5 text-sm font-semibold text-rose-700">
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {cards.map(([label, value, detail, color]) => (
                <article
                  key={label}
                  className={`rounded-2xl bg-gradient-to-br ${color} p-5 text-white shadow-lg shadow-slate-200`}
                >
                  <p className="text-sm font-bold text-white/85">{label}</p>
                  <div className="mt-5 text-3xl font-semibold">{value}</div>
                  <p className="mt-1 text-xs font-semibold text-white/80">
                    {detail}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">
                  Total Questions Per Year
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Shows the selected range volume curve.
                </p>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={filteredTotals}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="summaryVolume"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#5570d9"
                            stopOpacity={0.42}
                          />
                          <stop
                            offset="100%"
                            stopColor="#5570d9"
                            stopOpacity={0.03}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#edf0f7" vertical={false} />
                      <XAxis
                        dataKey="year"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        tickFormatter={compact}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [fmt(value), "Questions"]}
                      />
                      <Area
                        dataKey="question_count"
                        fill="url(#summaryVolume)"
                        stroke="#5570d9"
                        strokeWidth={3}
                        type="monotone"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">
                  Infrastructure Share
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tracks infra percentage movement in the selected range.
                </p>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={filteredShare}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#edf0f7" vertical={false} />
                      <XAxis
                        dataKey="year"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toFixed(2)}%`,
                          "Infra share",
                        ]}
                      />
                      <Line
                        dataKey="infra_pct"
                        stroke="#ff8a62"
                        strokeWidth={3}
                        type="monotone"
                      />
                    </LineChart>
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
