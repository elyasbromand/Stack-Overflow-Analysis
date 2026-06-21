import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "./api/api.js";

export default function TagBreakdown() {
  const [tagData, setTagData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");

  const normalizeRow = (row) => {
    return Object.fromEntries(
      Object.entries(row).map(([k, v]) => {
        if (v === null || v === undefined) return [k, v];
        if (k.toLowerCase() === "year") return ["year", Number(v) || 0];
        if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
          return [k, Number(v)];
        }
        return [k, v];
      })
    );
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/tag-breakdown");
        if (cancelled) return;
        setTagData(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || "Failed to load tag breakdown");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => (cancelled = true);
  }, []);

  const normalizedRows = useMemo(() => tagData.map(normalizeRow), [tagData]);

  const years = useMemo(() => {
    const ys = new Set(normalizedRows.map((r) => r.year).filter(Boolean));
    return Array.from(ys).sort((a, b) => a - b);
  }, [normalizedRows]);

  const filteredData = useMemo(() => {
    if (!selectedYear) return normalizedRows;
    return normalizedRows.filter((r) => r.year === Number(selectedYear));
  }, [normalizedRows, selectedYear]);

  const tableColumns = useMemo(() => {
    const cols = new Set();
    filteredData.forEach((r) => Object.keys(r).forEach((k) => cols.add(k)));
    if (cols.size === 0) return ["year"];
    const ordered = Array.from(cols);
    const rest = ordered.filter((k) => k !== "year" && k !== "tag_name").sort();
    return ["year", "tag_name", ...rest];
  }, [filteredData]);

  const chartData = useMemo(() => {
    if (!selectedYear) return [];
    // show top 10 tags by question_count for selected year
    const rows = filteredData.slice();
    rows.sort((a, b) => (b.question_count || 0) - (a.question_count || 0));
    return rows.slice(0, 10).map((r) => ({ tag: r.tag_name || r.tag || "Unknown", count: r.question_count || 0 }));
  }, [filteredData, selectedYear]);

  return (
    <main className="min-h-screen px-4 py-10 bg-slate-50 text-slate-900 lg:ml-64">
      <section className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/80">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Tag breakdown</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600">Per-tag metrics (questions, avg score) — filter by year.</p>

        <div className="mt-6">
          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Year</span>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-40 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-500">
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
        </div>

        {loading && <div className="mt-6">Loading...</div>}
        {error && <div className="mt-6 text-rose-700">Error: {error}</div>}

        {!loading && !error && selectedYear && chartData.length > 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-xl font-semibold text-slate-900">Top tags by question count ({selectedYear})</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fill: "#475569" }} />
                  <YAxis dataKey="tag" type="category" width={180} tick={{ fill: "#475569" }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 10, 10]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {!loading && !error && !selectedYear && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">Select a year to view the chart for that year.</div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="mt-8 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
              <thead>
                <tr>
                  {tableColumns.map((c) => (
                    <th key={c} className="px-4 py-3 font-semibold uppercase tracking-wide text-slate-500">{c.replace(/_/g, " ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredData.length > 0 ? (
                  filteredData.map((r, idx) => (
                    <tr key={idx}>
                      {tableColumns.map((c) => (
                        <td key={c} className="px-4 py-3 text-slate-700">{typeof r[c] === 'number' ? r[c].toLocaleString() : r[c]}</td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={tableColumns.length} className="px-4 py-3 text-center text-slate-500">No data available</td>
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
