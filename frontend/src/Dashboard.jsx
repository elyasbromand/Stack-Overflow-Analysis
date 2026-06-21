import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "./api/api.js";

export default function Dashboard() {
  const [yearlyTotals, setYearlyTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startYear, setStartYear] = useState(2014);
  const [endYear, setEndYear] = useState(2025);

  useEffect(() => {
    async function loadTotals() {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/yearly-totals");
        setYearlyTotals(response.data || []);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadTotals();
  }, []);

  const filteredTotals = useMemo(() => {
    return yearlyTotals.filter((row) => row.year >= startYear && row.year <= endYear);
  }, [yearlyTotals, startYear, endYear]);

  const yearOptions = useMemo(() => {
    const years = yearlyTotals.map((row) => row.year).sort((a, b) => a - b);
    return [...new Set(years)];
  }, [yearlyTotals]);

  return (
    <main className="min-h-screen px-4 py-10 bg-slate-50 text-slate-900 lg:ml-64">
      <section className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/80">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Stack Overflow Analysis Dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Yearly total questions from 2014 through 2025, with filters and charting.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="font-medium text-slate-900">Data rows</div>
              <div className="mt-1 text-2xl font-semibold">
                {yearlyTotals.length}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="font-medium text-slate-900">Filtered rows</div>
              <div className="mt-1 text-2xl font-semibold">{filteredTotals.length}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span className="font-medium text-slate-900">Start year</span>
                  <select
                    value={startYear}
                    onChange={(event) => setStartYear(Number(event.target.value))}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-500"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm text-slate-700">
                  <span className="font-medium text-slate-900">End year</span>
                  <select
                    value={endYear}
                    onChange={(event) => setEndYear(Number(event.target.value))}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-500"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-600">
                  Select a date range to filter the yearly data.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Highest year</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {filteredTotals.length > 0
                      ? Math.max(...filteredTotals.map((row) => row.year))
                      : "—"}
                  </div>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Max questions</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {filteredTotals.length > 0
                      ? Math.max(...filteredTotals.map((row) => row.question_count))
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-xl font-semibold text-slate-900">Questions by year</h2>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredTotals} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{ fill: "#475569" }} />
                  <YAxis tick={{ fill: "#475569" }} />
                  <Tooltip />
                  <Bar dataKey="question_count" fill="#14b8a6" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wide text-slate-500">Year</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wide text-slate-500">Total Questions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTotals.map((row) => (
                  <tr key={row.year}>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.year}</td>
                    <td className="px-4 py-3">{row.question_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
