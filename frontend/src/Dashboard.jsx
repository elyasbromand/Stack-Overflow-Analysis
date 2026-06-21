import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "./api/api.js";

const palette = [
  "#5570d9",
  "#ff8a62",
  "#f6c85f",
  "#43b6a8",
  "#9b7bea",
  "#f26d8f",
];

const endpoints = [
  ["summary", "/summary"],
  ["yearlyTotals", "/yearly-totals"],
  ["yearlyByCategory", "/yearly-by-category"],
  ["categoryShare", "/category-share"],
  ["tagBreakdown", "/tag-breakdown"],
  ["declineRanking", "/decline-ranking"],
  ["monthlyRecent", "/monthly-recent"],
  ["engagementTrend", "/engagement-trend"],
];

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeRow(row) {
  return Object.fromEntries(
    Object.entries(row || {}).map(([key, value]) => {
      if (value === null || value === undefined) return [key, value];
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
}

function compactNumber(value) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(toNumber(value));
}

function fullNumber(value) {
  return new Intl.NumberFormat("en").format(toNumber(value));
}

function pct(value, digits = 1) {
  if (!Number.isFinite(Number(value))) return "0%";
  return `${Number(value).toFixed(digits)}%`;
}

function labelize(key) {
  return String(key || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getYear(row) {
  return toNumber(row.year ?? row.Year ?? row.YEAR);
}

function getCount(row) {
  return toNumber(
    row.question_count ??
      row.QuestionCount ??
      row.total_count ??
      row.total ??
      row.cnt,
  );
}

function getTag(row) {
  return row.tag_name ?? row.tag ?? row.TagName ?? row.Tag ?? "Unknown";
}

function getCategory(row) {
  return (
    row.category ??
    row.tag_category ??
    row.Category ??
    row.TagCategory ??
    "Other"
  );
}

function findMetric(row, preferred = []) {
  for (const key of preferred) {
    if (row[key] !== undefined && Number.isFinite(Number(row[key]))) return key;
  }

  return Object.keys(row).find((key) => {
    const lower = key.toLowerCase();
    return (
      !["year", "tag", "tag_name", "category", "tag_category"].includes(
        lower,
      ) && Number.isFinite(Number(row[key]))
    );
  });
}

function buildCategorySeries(rows) {
  const normalized = rows.map(normalizeRow);
  const longForm = normalized.some(
    (row) => row.category || row.Category || row.tag_category,
  );

  if (longForm) {
    const byYear = new Map();
    normalized.forEach((row) => {
      const year = getYear(row);
      const category = getCategory(row);
      const metricKey = findMetric(row, [
        "question_count",
        "total_count",
        "total",
        "cnt",
      ]);
      if (!year || !metricKey) return;

      const existing = byYear.get(year) || { year };
      existing[category] = (existing[category] || 0) + toNumber(row[metricKey]);
      byYear.set(year, existing);
    });

    return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
  }

  return normalized
    .map((row) => ({ ...row, year: getYear(row) }))
    .filter((row) => row.year)
    .sort((a, b) => a.year - b.year);
}

function categoryKeys(series) {
  const keys = new Set();
  series.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (key !== "year" && Number.isFinite(Number(row[key]))) keys.add(key);
    });
  });
  return Array.from(keys).slice(0, 6);
}

export default function Dashboard() {
  const [data, setData] = useState({
    summary: null,
    yearlyTotals: [],
    yearlyByCategory: [],
    categoryShare: [],
    tagBreakdown: [],
    declineRanking: [],
    monthlyRecent: [],
    engagementTrend: [],
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setErrors([]);

      const results = await Promise.allSettled(
        endpoints.map(([, path]) => api.get(path)),
      );
      if (cancelled) return;

      const nextData = {};
      const nextErrors = [];

      results.forEach((result, index) => {
        const [key, path] = endpoints[index];
        if (result.status === "fulfilled") {
          nextData[key] = result.value.data || (key === "summary" ? null : []);
        } else {
          nextData[key] = key === "summary" ? null : [];
          nextErrors.push(
            `${path}: ${result.reason?.response?.data?.error || result.reason?.message}`,
          );
        }
      });

      setData((current) => ({ ...current, ...nextData }));
      setErrors(nextErrors);
      setLoading(false);
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const yearlyTotals = useMemo(
    () =>
      data.yearlyTotals
        .map(normalizeRow)
        .map((row) => ({ year: getYear(row), questions: getCount(row) }))
        .filter((row) => row.year)
        .sort((a, b) => a.year - b.year),
    [data.yearlyTotals],
  );

  const monthlyRecent = useMemo(
    () =>
      data.monthlyRecent
        .map(normalizeRow)
        .map((row) => ({
          period: `${row.year ?? row.Yr}-${String(row.month ?? row.Mo).padStart(2, "0")}`,
          questions: getCount(row),
        }))
        .slice(-18),
    [data.monthlyRecent],
  );

  const engagementTrend = useMemo(
    () =>
      data.engagementTrend
        .map(normalizeRow)
        .map((row) => ({
          year: getYear(row),
          score: toNumber(row.avg_score),
          answers: toNumber(row.avg_answer_count),
          views: toNumber(row.avg_view_count),
        }))
        .filter((row) => row.year)
        .sort((a, b) => a.year - b.year),
    [data.engagementTrend],
  );

  const categorySeries = useMemo(
    () => buildCategorySeries(data.yearlyByCategory),
    [data.yearlyByCategory],
  );

  const categoryChartKeys = useMemo(
    () => categoryKeys(categorySeries),
    [categorySeries],
  );

  const latestCategoryMix = useMemo(() => {
    const lastRow = categorySeries[categorySeries.length - 1];
    if (!lastRow) return [];

    return categoryChartKeys
      .map((key) => ({ name: labelize(key), value: toNumber(lastRow[key]) }))
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categoryChartKeys, categorySeries]);

  const topTags = useMemo(() => {
    const normalized = data.tagBreakdown.map(normalizeRow);
    const latestYear = Math.max(0, ...normalized.map(getYear));
    return normalized
      .filter((row) => getYear(row) === latestYear)
      .sort((a, b) => getCount(b) - getCount(a))
      .slice(0, 7)
      .map((row) => ({ tag: getTag(row), questions: getCount(row) }));
  }, [data.tagBreakdown]);

  const declineLeaders = useMemo(() => {
    const normalized = data.declineRanking.map(normalizeRow);
    const sample = normalized[0] || {};
    const metricKey = findMetric(sample, [
      "decline_pct",
      "pct_change",
      "change_pct",
      "decline_percent",
      "question_drop",
      "drop_count",
    ]);

    if (!metricKey) return [];

    return normalized
      .slice()
      .sort(
        (a, b) =>
          Math.abs(toNumber(b[metricKey])) - Math.abs(toNumber(a[metricKey])),
      )
      .slice(0, 5)
      .map((row) => ({
        tag: getTag(row),
        category: getCategory(row),
        value: toNumber(row[metricKey]),
        metric: labelize(metricKey),
      }));
  }, [data.declineRanking]);

  const shareChange = useMemo(() => {
    const rows = data.categoryShare
      .map(normalizeRow)
      .sort((a, b) => getYear(a) - getYear(b));
    const first = rows[0];
    const last = rows[rows.length - 1];
    if (!first || !last) return null;

    const preferredKey = Object.keys(last).find(
      (key) =>
        key.toLowerCase().includes("infra") &&
        key.toLowerCase().includes("pct"),
    );
    const metricKey = preferredKey || findMetric(last, []);
    if (!metricKey) return null;

    return {
      label: labelize(metricKey),
      startYear: getYear(first),
      endYear: getYear(last),
      start: toNumber(first[metricKey]),
      end: toNumber(last[metricKey]),
      delta: toNumber(last[metricKey]) - toNumber(first[metricKey]),
    };
  }, [data.categoryShare]);

  const headline = useMemo(() => {
    const totalQuestions =
      data.summary?.total_questions_sampled ??
      yearlyTotals.reduce((sum, row) => sum + row.questions, 0);
    const peak = yearlyTotals.reduce(
      (best, row) => (row.questions > best.questions ? row : best),
      {
        year: data.summary?.peak_year || 0,
        questions: data.summary?.peak_year_count || 0,
      },
    );
    const latest = yearlyTotals[yearlyTotals.length - 1] || {
      year: 0,
      questions: 0,
    };
    const previous = yearlyTotals[yearlyTotals.length - 2];
    const latestChange = previous
      ? ((latest.questions - previous.questions) / previous.questions) * 100
      : 0;
    const peakDrop = peak.questions
      ? ((latest.questions - peak.questions) / peak.questions) * 100
      : 0;
    const latestEngagement = engagementTrend[engagementTrend.length - 1] || {};

    return {
      totalQuestions,
      peak,
      latest,
      latestChange,
      peakDrop,
      latestEngagement,
    };
  }, [data.summary, engagementTrend, yearlyTotals]);

  const insightCards = [
    {
      label: "Total questions sampled",
      value: compactNumber(headline.totalQuestions),
      detail: `${fullNumber(headline.totalQuestions)} rows in the warehouse`,
      color: "from-[#5570d9] to-[#7892f0]",
    },
    {
      label: "Peak activity year",
      value: headline.peak.year || "N/A",
      detail: `${compactNumber(headline.peak.questions)} questions at the high point`,
      color: "from-[#ff8a62] to-[#ffb06f]",
    },
    {
      label: "Latest yearly volume",
      value: compactNumber(headline.latest.questions),
      detail: `${headline.latest.year || "Latest"} is ${pct(headline.latestChange)} vs previous year`,
      color: "from-[#f6c85f] to-[#ffe08a]",
    },
    {
      label: "Change from peak",
      value: pct(headline.peakDrop),
      detail: "Measures the current gap from the strongest year",
      color: "from-[#43b6a8] to-[#7ad9cc]",
    },
    {
      label: "Avg views per question",
      value: compactNumber(headline.latestEngagement.views),
      detail: `${headline.latestEngagement.year || "Latest"} engagement signal`,
      color: "from-[#9b7bea] to-[#c4b1ff]",
    },
  ];

  const decisionSummary = [
    {
      label: "Volume story",
      title: `${headline.latest.year || "Latest"} sits ${pct(Math.abs(headline.peakDrop))} from peak`,
      text: `Peak activity was ${headline.peak.year || "not available"} with ${compactNumber(
        headline.peak.questions,
      )} questions.`,
    },
    {
      label: "Demand concentration",
      title: topTags[0]
        ? `${topTags[0].tag} leads latest tag demand`
        : "Top tag not available",
      text: topTags[0]
        ? `${fullNumber(topTags[0].questions)} questions in the latest tag breakdown year.`
        : "Start the backend API to populate the tag breakdown.",
    },
    {
      label: "Category movement",
      title: shareChange
        ? `${shareChange.label} changed ${pct(shareChange.delta)} points`
        : "Category movement not available",
      text: shareChange
        ? `${shareChange.startYear} baseline was ${pct(shareChange.start)} and ${shareChange.endYear} is ${pct(
            shareChange.end,
          )}.`
        : "Category share endpoint did not return a numeric share metric.",
    },
    {
      label: "Largest movement",
      title: declineLeaders[0]
        ? `${declineLeaders[0].tag} has the strongest shift`
        : "Movement ranking unavailable",
      text: declineLeaders[0]
        ? `${declineLeaders[0].metric}: ${compactNumber(declineLeaders[0].value)} in ${declineLeaders[0].category}.`
        : "Decline ranking endpoint did not return a numeric movement metric.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#dfe7ff] px-3 py-5 text-slate-900 sm:px-6 lg:ml-64 lg:px-8">
      <section className="mx-auto max-w-7xl rounded-[28px] border border-white/70 bg-[#f8f9ff] p-4 shadow-2xl shadow-blue-200/70 sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#5570d9]">
                Analytics Report
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Stack Overflow Analytics Dashboard
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">
              {yearlyTotals[0]?.year || 2014}-{headline.latest.year || 2025}
            </span>
          </div>
        </header>

        {loading && (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-white px-5 py-4 text-sm text-slate-600">
            Loading live dashboard data...
          </div>
        )}

        {!loading && errors.length > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Some API sections could not load. The available charts are still
            shown from the endpoints that responded.
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {insightCards.map((card) => (
            <article
              key={card.label}
              className={`min-h-36 rounded-2xl bg-gradient-to-br ${card.color} p-5 text-white shadow-lg shadow-slate-200`}
            >
              <div className="flex h-full flex-col justify-between gap-6">
                <p className="max-w-32 text-sm font-semibold leading-snug text-white/90">
                  {card.label}
                </p>
                <div>
                  <div className="text-3xl font-black tracking-tight">
                    {card.value}
                  </div>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-white/85">
                    {card.detail}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Decision Summary
              </h2>
            </div>
            <span className="rounded-full bg-[#edf1ff] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#5570d9]">
              Live report
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {decisionSummary.map((item, index) => (
              <article key={item.label} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    {item.label}
                  </p>
                </div>
                <h3 className="mt-3 text-base font-semibold leading-5 text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_0.9fr_0.8fr]">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Question Volume Trend
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Annual activity shows the peak, latest drop, and recovery
                  pattern.
                </p>
              </div>
              <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#5570d9]">
                {pct(headline.peakDrop)} from peak
              </span>
            </div>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={yearlyTotals}
                  margin={{ top: 10, right: 18, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="volumeGradient"
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
                    tickFormatter={compactNumber}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [fullNumber(value), "Questions"]}
                  />
                  <Area
                    dataKey="questions"
                    fill="url(#volumeGradient)"
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
              Latest Category Mix
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Share of question volume by category in the latest year.
            </p>
            <div className="mt-4 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={latestCategoryMix}
                    dataKey="value"
                    innerRadius="55%"
                    outerRadius="82%"
                    paddingAngle={3}
                  >
                    {latestCategoryMix.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={palette[index % palette.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [compactNumber(value), "Questions"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {latestCategoryMix.slice(0, 4).map((entry, index) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2 text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: palette[index % palette.length],
                      }}
                    />
                    {entry.name}
                  </span>
                  <strong className="text-slate-900">
                    {compactNumber(entry.value)}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Category Share Signal
              </h2>
              {shareChange ? (
                <div className="mt-5">
                  <div className="text-4xl font-black text-slate-950">
                    {pct(shareChange.end)}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {shareChange.label} moved {pct(shareChange.delta)} points
                    from {shareChange.startYear} to {shareChange.endYear}.
                  </p>
                  <div className="mt-5 h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-[#ff8a62]"
                      style={{
                        width: `${Math.min(100, Math.max(4, shareChange.end))}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Category share data is not available.
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Analytics Takeaway
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The most important story is volume contraction: latest yearly
                questions are{" "}
                <strong className="text-slate-950">
                  {pct(Math.abs(headline.peakDrop))}
                </strong>{" "}
                away from the peak year. Use the tag and category charts below
                to see where that change is concentrated.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Category Trend by Year
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Multiple colored series compare each category over time.
            </p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={categorySeries}
                  margin={{ top: 10, right: 18, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="#edf0f7" vertical={false} />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={compactNumber}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      compactNumber(value),
                      labelize(name),
                    ]}
                  />
                  <Legend />
                  {categoryChartKeys.map((key, index) => (
                    <Line
                      key={key}
                      dataKey={key}
                      dot={false}
                      name={labelize(key)}
                      stroke={palette[index % palette.length]}
                      strokeWidth={3}
                      type="monotone"
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Recent Monthly Momentum
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              The last 18 monthly records reveal the near-term pattern.
            </p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyRecent}
                  margin={{ top: 10, right: 18, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="#edf0f7" vertical={false} />
                  <XAxis
                    dataKey="period"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={compactNumber}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [fullNumber(value), "Questions"]}
                  />
                  <Bar
                    dataKey="questions"
                    fill="#5570d9"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1fr_1fr]">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Engagement Quality
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Average score and answers per question by year.
            </p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={engagementTrend}
                  margin={{ top: 10, right: 18, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="#edf0f7" vertical={false} />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    dataKey="score"
                    name="Avg score"
                    stroke="#43b6a8"
                    strokeWidth={3}
                    type="monotone"
                  />
                  <Line
                    dataKey="answers"
                    name="Avg answers"
                    stroke="#ff8a62"
                    strokeWidth={3}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Top Tags in Latest Year
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Highest question count tags from the tag breakdown endpoint.
            </p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topTags}
                  layout="vertical"
                  margin={{ top: 10, right: 18, left: 20, bottom: 0 }}
                >
                  <CartesianGrid stroke="#edf0f7" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={compactNumber}
                  />
                  <YAxis
                    dataKey="tag"
                    type="category"
                    width={118}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [fullNumber(value), "Questions"]}
                  />
                  <Bar
                    dataKey="questions"
                    fill="#9b7bea"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Largest Movement Tags
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ranking based on the strongest numeric decline signal available.
            </p>
            <div className="mt-5 space-y-3">
              {declineLeaders.length > 0 ? (
                declineLeaders.map((row, index) => (
                  <div
                    key={`${row.tag}-${index}`}
                    className="rounded-2xl bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{row.tag}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.category}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-[#ff8a62] shadow-sm">
                        {compactNumber(row.value)}
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white">
                      <div
                        className="h-2 rounded-full bg-[#ff8a62]"
                        style={{
                          width: `${Math.min(100, Math.max(8, Math.abs(row.value)))}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{row.metric}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Decline ranking data is not available.
                </p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
