import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "./api/api.js";

export default function EngagementTrend() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");

  const normalizeRow = (row) => Object.fromEntries(
    Object.entries(row).map(([k, v]) => {
      if (v === null || v === undefined) return [k, v];
      if (k.toLowerCase() === "year") return ["year", Number(v) || 0];
      if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
        return [k, Number(v)];
      }
      return [k, v];
    })
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/engagement-trend');
        if (cancelled) return;
        setRows(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || 'Failed to load engagement trend');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => (cancelled = true);
  }, []);

  const normalized = useMemo(() => rows.map(normalizeRow), [rows]);

  const years = useMemo(() => {
    const s = new Set(normalized.map(r => r.year).filter(Boolean));
    return Array.from(s).sort((a,b)=>a-b);
  }, [normalized]);

  const selectedRow = useMemo(() => {
    if (!selectedYear) return null;
    return normalized.find(r => r.year === Number(selectedYear)) || null;
  }, [normalized, selectedYear]);

  const chartData = useMemo(() => {
    if (!selectedRow) return [];
    const keys = ['avg_score','avg_answer_count','avg_view_count'];
    return keys.map(k => ({ metric: k, value: selectedRow[k] || 0 }));
  }, [selectedRow]);

  const tableColumns = useMemo(() => {
    if (normalized.length === 0) return ['year','avg_score','avg_answer_count','avg_view_count'];
    const cols = new Set();
    normalized.forEach(r => Object.keys(r).forEach(k => cols.add(k)));
    const ordered = Array.from(cols);
    const rest = ordered.filter(k => k !== 'year').sort();
    return ['year', ...rest];
  }, [normalized]);

  const filtered = useMemo(() => {
    if (!selectedYear) return normalized;
    return normalized.filter(r => r.year === Number(selectedYear));
  }, [normalized, selectedYear]);

  return (
    <main className="min-h-screen px-4 py-10 bg-slate-50 text-slate-900 lg:ml-64">
      <section className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/80">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Engagement Trend</h1>
        <p className="mt-2 text-sm text-slate-600">Average score, answers, and views per year. Filter by a single year.</p>

        <div className="mt-6">
          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Year</span>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-40 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none">
              <option value="">All years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
        </div>

        {loading && <div className="mt-6">Loading...</div>}
        {error && <div className="mt-6 text-rose-700">Error: {error}</div>}

        {!loading && !error && selectedRow && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-xl font-semibold text-slate-900">Metrics for {selectedYear}</h2>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="metric" tick={{ fill: '#475569' }} />
                  <YAxis tick={{ fill: '#475569' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#06b6d4" radius={[8,8,8,8]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="mt-8 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
              <thead>
                <tr>
                  {tableColumns.map(c => (
                    <th key={c} className="px-4 py-3 font-semibold uppercase tracking-wide text-slate-500">{c.replace(/_/g, ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.length > 0 ? (
                  filtered.map((r, idx) => (
                    <tr key={idx}>
                      {tableColumns.map(c => (
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
