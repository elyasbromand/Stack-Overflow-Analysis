import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "./api/api.js";

const colors = [
  "#5570d9",
  "#ff8a62",
  "#43b6a8",
  "#9b7bea",
  "#f6c85f",
  "#f26d8f",
];
const compact = (value) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function label(key) {
  return String(key || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalize(row) {
  return Object.fromEntries(
    Object.entries(row || {}).map(([key, value]) => {
      if (key.toLowerCase() === "year") return ["year", number(value)];
      if (
        typeof value === "string" &&
        value.trim() !== "" &&
        !Number.isNaN(Number(value))
      )
        return [key, Number(value)];
      return [key, value];
    }),
  );
}

function categoryName(row) {
  return (
    row.category ||
    row.Category ||
    row.tag_category ||
    row.TagCategory ||
    "Other"
  );
}

function metricKey(row) {
  return (
    ["question_count", "total_count", "total", "cnt"].find(
      (key) => row[key] !== undefined,
    ) ||
    Object.keys(row).find(
      (key) =>
        key !== "year" &&
        key !== "category" &&
        Number.isFinite(Number(row[key])),
    )
  );
}

function buildSeries(rows) {
  const normalized = rows.map(normalize);
  const longForm = normalized.some(
    (row) =>
      row.category || row.Category || row.tag_category || row.TagCategory,
  );

  if (!longForm) {
    return normalized.filter((row) => row.year).sort((a, b) => a.year - b.year);
  }

  const byYear = new Map();
  normalized.forEach((row) => {
    const year = number(row.year);
    const key = metricKey(row);
    if (!year || !key) return;
    const current = byYear.get(year) || { year };
    const category = categoryName(row);
    current[category] = (current[category] || 0) + number(row[key]);
    byYear.set(year, current);
  });
  return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
}

export default function YearlyByCategory() {
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
        const res = await api.get("/yearly-by-category");
        if (!cancelled) setRows(res.data || []);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err.message ||
            "Failed to load yearly category data",
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

  const series = useMemo(() => buildSeries(rows), [rows]);
  const years = series.map((row) => row.year).filter(Boolean);
  const activeYear = Number(selectedYear || years[years.length - 1]) || 0;
  const keys = Array.from(
    new Set(
      series.flatMap((row) =>
        Object.keys(row).filter(
          (key) => key !== "year" && Number.isFinite(Number(row[key])),
        ),
      ),
    ),
  ).slice(0, 6);
  const activeRow = series.find((row) => row.year === activeYear) || {};
  const activeBars = keys.map((key) => ({
    category: label(key),
    value: number(activeRow[key]),
  }));
  const totalsByYear = series.map((row) => ({
    year: row.year,
    total: keys.reduce((sum, key) => sum + number(row[key]), 0),
  }));
  const peak = totalsByYear.reduce(
    (best, row) => (row.total > best.total ? row : best),
    { year: "N/A", total: 0 },
  );

  return (
    <main className="min-h-screen bg-[#dfe7ff] px-3 py-5 text-slate-900 sm:px-6 lg:ml-64 lg:px-8">
      <section className="mx-auto max-w-7xl rounded-[28px] border border-white/70 bg-[#f8f9ff] p-4 shadow-2xl shadow-blue-200/70 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#5570d9]">
              Trend Analysis
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Yearly Category
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Compares category volume year by year and highlights the latest
              category distribution.
            </p>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-bold shadow-sm outline-none"
          >
            <option value="">Latest year</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="mt-5 rounded-2xl bg-white p-5 text-sm text-slate-500">
            Loading yearly category data...
          </div>
        )}
        {error && (
          <div className="mt-5 rounded-2xl bg-rose-50 p-5 text-sm font-semibold text-rose-700">
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl bg-gradient-to-br from-[#5570d9] to-[#7892f0] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Years covered</p>
                <div className="mt-5 text-3xl font-semibold">
                  {years.length}
                </div>
                <p className="mt-1 text-xs font-semibold text-white/80">
                  {years[0] || "N/A"} to {years[years.length - 1] || "N/A"}
                </p>
              </article>
              <article className="rounded-2xl bg-gradient-to-br from-[#ff8a62] to-[#ffb06f] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Peak year</p>
                <div className="mt-5 text-3xl font-semibold">{peak.year}</div>
                <p className="mt-1 text-xs font-semibold text-white/80">
                  {compact(peak.total)} questions
                </p>
              </article>
              <article className="rounded-2xl bg-gradient-to-br from-[#43b6a8] to-[#7ad9cc] p-5 text-white shadow-lg shadow-slate-200">
                <p className="text-sm font-bold text-white/85">Categories</p>
                <div className="mt-5 text-3xl font-semibold">{keys.length}</div>
                <p className="mt-1 text-xs font-semibold text-white/80">
                  Numeric series detected
                </p>
              </article>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">
                  Category Lines Over Time
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Each color is a category series from the API.
                </p>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={series}
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
                        tickFormatter={compact}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          compact(value),
                          label(name),
                        ]}
                      />
                      <Legend />
                      {keys.map((key, index) => (
                        <Line
                          key={key}
                          dataKey={key}
                          name={label(key)}
                          stroke={colors[index % colors.length]}
                          strokeWidth={3}
                          type="monotone"
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">
                  {activeYear} Category Split
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Bar view for the selected year.
                </p>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activeBars}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#edf0f7" vertical={false} />
                      <XAxis
                        dataKey="category"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        tickFormatter={compact}
                      />
                      <Tooltip
                        formatter={(value) => [compact(value), "Questions"]}
                      />
                      <Bar
                        dataKey="value"
                        fill="#5570d9"
                        radius={[8, 8, 0, 0]}
                      />
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
