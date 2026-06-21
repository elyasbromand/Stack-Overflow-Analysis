import { useEffect, useMemo, useState } from "react";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "./api/api.js";

export default function MonthlyRecent() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const normalizeRow = (row) => Object.fromEntries(
    Object.entries(row).map(([k, v]) => {
      if (v === null || v === undefined) return [k, v];
      if (k.toLowerCase() === "year" || k.toLowerCase() === "yr") return ["year", Number(v) || 0];
      if (k.toLowerCase() === "month" || k.toLowerCase() === "mo") return ["month", Number(v) || 0];
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
        const res = await api.get('/monthly-recent');
        if (cancelled) return;
        setRows(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || 'Failed to load monthly recent');
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

  const months = useMemo(() => {
    const s = new Set(normalized.map(r => r.month).filter(Boolean));
    return Array.from(s).sort((a,b)=>a-b);
  }, [normalized]);

  const filtered = useMemo(() => {
    return normalized.filter(r => {
      if (selectedYear && r.year !== Number(selectedYear)) return false;
      if (selectedMonth && r.month !== Number(selectedMonth)) return false;
      return true;
    });
  }, [normalized, selectedYear, selectedMonth]);

  const tableColumns = useMemo(() => {
    const cols = new Set();
    filtered.forEach(r => Object.keys(r).forEach(k => cols.add(k)));
    if (cols.size === 0) return ['year','month','question_count'];
    const ordered = Array.from(cols);
    const rest = ordered.filter(k => k !== 'year' && k !== 'month').sort();
    return ['year','month', ...rest];
  }, [filtered]);

  const chartData = useMemo(() => {
    // if a year is selected, show monthly trend for that year
    if (!selectedYear) return [];
    const rowsForYear = normalized.filter(r => r.year === Number(selectedYear));
    const byMonth = {};
    rowsForYear.forEach(r => {
      const m = r.month || 0;
      byMonth[m] = (byMonth[m] || 0) + (r.question_count || 0);
    });
    const data = Object.keys(byMonth).map(m => ({ month: Number(m), question_count: byMonth[m] }));
    data.sort((a,b) => a.month - b.month);
    return data;
  }, [normalized, selectedYear]);

  return (
    <main className="min-h-screen px-4 py-10 bg-slate-50 text-slate-900 lg:ml-64">
      <section className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/80">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Monthly Recent (2021-2025)</h1>
        <p className="mt-2 text-sm text-slate-600">Monthly resolution of recent question counts. Filter by year and month.</p>

        <div className="mt-6 flex gap-4">
          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Year</span>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-40 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none">
              <option value="">All years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Month</span>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-40 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none">
              <option value="">All months</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </div>

        {loading && <div className="mt-6">Loading...</div>}
        {error && <div className="mt-6 text-rose-700">Error: {error}</div>}

        {!loading && !error && selectedYear && chartData.length > 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-xl font-semibold text-slate-900">Monthly trend for {selectedYear}</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fill: '#475569' }} />
                  <YAxis tick={{ fill: '#475569' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="question_count" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
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
