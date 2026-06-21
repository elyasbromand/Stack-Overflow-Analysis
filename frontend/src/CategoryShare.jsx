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

export default function CategoryShare() {
  const [categoryShareData, setCategoryShareData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");

  const getYear = (row) => {
    if (typeof row.year === "number") return row.year;
    if (typeof row.Year === "number") return row.Year;
    if (typeof row.YEAR === "number") return row.YEAR;
    return Number(row.year || row.Year || row.YEAR) || 0;
  };

  const normalizeRow = (row) => {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => {
        if (key.toLowerCase() === "year") {
          return ["year", Number(value) || 0];
        }

        if (typeof value === "string" && value !== "" && !Number.isNaN(Number(value))) {
          return [key, Number(value)];
        }

        return [key, value];
      })
    );
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/category-share");
        setCategoryShareData(response.data || []);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const normalizedRows = useMemo(
    () => categoryShareData.map(normalizeRow),
    [categoryShareData]
  );

  const years = useMemo(() => {
    const yearSet = new Set(normalizedRows.map((row) => row.year).filter(Boolean));
    return Array.from(yearSet).sort((a, b) => a - b);
  }, [normalizedRows]);

  const filteredData = useMemo(() => {
    if (!selectedYear) return normalizedRows;
    return normalizedRows.filter((row) => row.year === Number(selectedYear));
  }, [normalizedRows, selectedYear]);

  const tableColumns = useMemo(() => {
    const columns = new Set();
    filteredData.forEach((row) => Object.keys(row).forEach((key) => columns.add(key)));
    if (columns.size === 0) return ["year"];
    const ordered = Array.from(columns);
    const rest = ordered.filter((key) => key !== "year").sort();
    return ["year", ...rest];
  }, [filteredData]);

  const chartData = useMemo(() => {
    if (!selectedYear || filteredData.length === 0) return [];
    const row = filteredData[0];
    return Object.entries(row)
      .filter(([key]) => key.toLowerCase() !== "year")
      .map(([key, value]) => ({
        metric: key,
        value: typeof value === "number" ? value : Number(value) || 0,
      }));
  }, [filteredData, selectedYear]);

  return (
    <main className="min-h-screen px-4 py-10 bg-slate-50 text-slate-900 lg:ml-64">
      <section className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/80">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
          Category Share Over Time
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600">
          Track the percentage share of questions across categories over the years.
        </p>

        {/* Summary cards */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="font-medium text-slate-900">Total records</div>
            <div className="mt-1 text-2xl font-semibold">{categoryShareData.length}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="font-medium text-slate-900">Filtered records</div>
            <div className="mt-1 text-2xl font-semibold">{filteredData.length}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="font-medium text-slate-900">Years covered</div>
            <div className="mt-1 text-2xl font-semibold">{years.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Year</span>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-500"
            >
              <option value="">All years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Loading and error states */}
        {loading && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-slate-700">
            Loading category share data...
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-rose-700">
            Error: {error}
          </div>
        )}

        {/* Chart */}
        {!loading && !error && selectedYear && chartData.length > 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-xl font-semibold text-slate-900">
              {`Year ${selectedYear} raw row breakdown`}
            </h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="metric"
                    tick={{ fill: "#475569", angle: -45, textAnchor: "end", height: 80 }}
                  />
                  <YAxis tick={{ fill: "#475569" }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {!loading && !error && !selectedYear && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
            Select a year to view the raw row breakdown chart.
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="mt-8 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
              <thead>
                <tr>
                  {tableColumns.map((column) => (
                    <th key={column} className="px-4 py-3 font-semibold uppercase tracking-wide text-slate-500">
                      {column.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredData.length > 0 ? (
                  filteredData.map((row, idx) => (
                    <tr key={idx}>
                      {tableColumns.map((column) => (
                        <td key={column} className="px-4 py-3 text-slate-700">
                          {typeof row[column] === "number"
                            ? row[column].toLocaleString()
                            : row[column]}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={tableColumns.length} className="px-4 py-3 text-center text-slate-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
