import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "./api/api.js";

const compact = (value) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const fullNumber = (value) => Number(value || 0).toLocaleString();

function getValue(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return 0;
}

function normalizeRow(row) {
  const normalized = Object.fromEntries(
    Object.entries(row || {}).map(([key, value]) => {
      if (
        typeof value === "string" &&
        value.trim() !== "" &&
        !Number.isNaN(Number(value))
      ) {
        return [key, Number(value)];
      }
      return [key, value];
    }),
  );

  return {
    year: Number(getValue(normalized, ["year", "Year", "YEAR"])) || 0,
    infra_count:
      Number(
        getValue(normalized, [
          "infra_count",
          "InfraCount",
          "infraCount",
          "infrastructure_count",
        ]),
      ) || 0,
    infra_pct:
      Number(
        getValue(normalized, [
          "infra_pct",
          "InfraPct",
          "infraPct",
          "infrastructure_pct",
        ]),
      ) || 0,
    syntax_count:
      Number(
        getValue(normalized, ["syntax_count", "SyntaxCount", "syntaxCount"]),
      ) || 0,
    total_count:
      Number(
        getValue(normalized, [
          "total_count",
          "TotalCount",
          "totalCount",
          "question_count",
          "total",
        ]),
      ) || 0,
  };
}

export default function CategoryShare() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/category-share");
        if (!cancelled) setRows(response.data || []);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err.message ||
            "Failed to load category share",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo(
    () =>
      rows
        .map(normalizeRow)
        .filter((row) => row.year)
        .sort((a, b) => a.year - b.year),
    [rows],
  );

  const years = useMemo(() => data.map((row) => row.year), [data]);
  const activeYear = Number(selectedYear || years[years.length - 1]) || 0;
  const activeRow = data.find((row) => row.year === activeYear) || {
    year: activeYear,
    infra_count: 0,
    infra_pct: 0,
    syntax_count: 0,
    total_count: 0,
  };

  const comparisonData = [
    { metric: "Infra Count", value: activeRow.infra_count, fill: "#5570d9" },
    { metric: "Syntax Count", value: activeRow.syntax_count, fill: "#ff8a62" },
    { metric: "Total Count", value: activeRow.total_count, fill: "#43b6a8" },
  ];

  const firstRow = data[0];
  const previousRow =
    data[data.findIndex((row) => row.year === activeYear) - 1];
  const infraShareChangeFromStart = firstRow
    ? activeRow.infra_pct - firstRow.infra_pct
    : 0;
  const infraShareChangeFromPrevious = previousRow
    ? activeRow.infra_pct - previousRow.infra_pct
    : 0;

  const cards = [
    {
      label: "Year",
      value: activeRow.year || "N/A",
      detail: "Selected report year",
      color: "from-[#5570d9] to-[#7892f0]",
    },
    {
      label: "Infra Count",
      value: compact(activeRow.infra_count),
      detail: `${fullNumber(activeRow.infra_count)} infrastructure questions`,
      color: "from-[#43b6a8] to-[#7ad9cc]",
    },
    {
      label: "Infra Pct",
      value: `${activeRow.infra_pct.toFixed(2)}%`,
      detail: `${infraShareChangeFromPrevious.toFixed(2)} pts vs previous year`,
      color: "from-[#9b7bea] to-[#c4b1ff]",
    },
    {
      label: "Syntax Count",
      value: compact(activeRow.syntax_count),
      detail: `${fullNumber(activeRow.syntax_count)} syntax questions`,
      color: "from-[#ff8a62] to-[#ffb06f]",
    },
    {
      label: "Total Count",
      value: compact(activeRow.total_count),
      detail: `${fullNumber(activeRow.total_count)} total questions`,
      color: "from-[#f6c85f] to-[#ffe08a]",
    },
  ];

  return (
    <main className="min-h-screen bg-[#dfe7ff] px-3 py-5 text-slate-900 sm:px-6 lg:ml-64 lg:px-8">
      <section className="mx-auto max-w-7xl rounded-[28px] border border-white/70 bg-[#f8f9ff] p-4 shadow-2xl shadow-blue-200/70 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#5570d9]">
              Trend Analysis
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Category Share
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Clear yearly view of infrastructure count, infrastructure
              percentage, syntax count, and total count.
            </p>
          </div>

          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
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
            Loading category share data...
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl bg-rose-50 p-5 text-sm font-semibold text-rose-700">
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {cards.map((card) => (
                <article
                  key={card.label}
                  className={`rounded-2xl bg-gradient-to-br ${card.color} p-5 text-white shadow-lg shadow-slate-200`}
                >
                  <p className="text-sm font-bold text-white/85">
                    {card.label}
                  </p>
                  <div className="mt-5 text-3xl font-semibold">
                    {card.value}
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-5 text-white/80">
                    {card.detail}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">
                  Infrastructure Share Over Time
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Infra percentage by year.
                </p>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="infraPctGradient"
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
                            stopOpacity={0.04}
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
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toFixed(2)}%`,
                          "Infra Pct",
                        ]}
                      />
                      <Area
                        dataKey="infra_pct"
                        fill="url(#infraPctGradient)"
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
                  {activeRow.year} Counts
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Infra, syntax, and total counts for the selected year.
                </p>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#edf0f7" vertical={false} />
                      <XAxis
                        dataKey="metric"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        tickFormatter={compact}
                      />
                      <Tooltip
                        formatter={(value) => [fullNumber(value), "Count"]}
                      />
                      <Bar
                        dataKey="value"
                        fill="#43b6a8"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            <section className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-950">
                  Category Share Table
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Exact values returned by the API, filtered by year selection.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-400">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Year</th>
                      <th className="px-5 py-4 font-semibold">Infra Count</th>
                      <th className="px-5 py-4 font-semibold">Infra Pct</th>
                      <th className="px-5 py-4 font-semibold">Syntax Count</th>
                      <th className="px-5 py-4 font-semibold">Total Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {(selectedYear ? [activeRow] : data).map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4 font-semibold text-slate-950">
                          {row.year}
                        </td>
                        <td className="px-5 py-4">
                          {fullNumber(row.infra_count)}
                        </td>
                        <td className="px-5 py-4">
                          {row.infra_pct.toFixed(2)}%
                        </td>
                        <td className="px-5 py-4">
                          {fullNumber(row.syntax_count)}
                        </td>
                        <td className="px-5 py-4">
                          {fullNumber(row.total_count)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
