import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "./api/api.js";

export default function DeclineRanking() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTag, setFilterTag] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

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
        const res = await api.get('/decline-ranking');
        if (cancelled) return;
        setRows(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || 'Failed to load decline ranking');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => (cancelled = true);
  }, []);

  const normalized = useMemo(() => rows.map(normalizeRow), [rows]);

  const tagNames = useMemo(() => {
    const s = new Set(normalized.map(r => r.tag_name || r.tag || '').filter(Boolean));
    return Array.from(s).sort();
  }, [normalized]);

  const tagCategories = useMemo(() => {
    const s = new Set(normalized.map(r => r.tag_category || r.category || '').filter(Boolean));
    return Array.from(s).sort();
  }, [normalized]);

  const filtered = useMemo(() => {
    return normalized.filter(r => {
      if (filterTag && (r.tag_name || r.tag) !== filterTag) return false;
      if (filterCategory && (r.tag_category || r.category) !== filterCategory) return false;
      return true;
    });
  }, [normalized, filterTag, filterCategory]);

  // choose a numeric metric for chart (first numeric field that's not year)
  const metricKey = useMemo(() => {
    if (normalized.length === 0) return null;
    const sample = normalized[0];
    for (const k of Object.keys(sample)) {
      if (k === 'year' || k === 'tag_name' || k === 'tag_category' || k === 'tag') continue;
      if (typeof sample[k] === 'number') return k;
    }
    return null;
  }, [normalized]);

  const chartData = useMemo(() => {
    if (!metricKey) return [];
    const rows = filtered.slice();
    rows.sort((a, b) => (b[metricKey] || 0) - (a[metricKey] || 0));
    return rows.slice(0, 10).map(r => ({ name: r.tag_name || r.tag || 'Unknown', value: r[metricKey] || 0 }));
  }, [filtered, metricKey]);

  const tableColumns = useMemo(() => {
    const cols = new Set();
    filtered.forEach(r => Object.keys(r).forEach(k => cols.add(k)));
    if (cols.size === 0) return ['tag_name', 'tag_category'];
    const ordered = Array.from(cols);
    const rest = ordered.filter(k => k !== 'tag_name' && k !== 'tag_category').sort();
    return ['tag_name', 'tag_category', ...rest];
  }, [filtered]);

  return (
    <main className="min-h-screen px-4 py-10 bg-slate-50 text-slate-900 lg:ml-64">
      <section className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/80">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Decline Ranking</h1>
        <p className="mt-2 text-sm text-slate-600">Winners / losers leaderboard. Filter by tag name and tag category.</p>

        <div className="mt-6 flex gap-4">
          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Tag name</span>
            <select value={filterTag} onChange={e => setFilterTag(e.target.value)} className="w-60 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none">
              <option value="">All tags</option>
              {tagNames.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Tag category</span>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-60 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none">
              <option value="">All categories</option>
              {tagCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>

        {loading && <div className="mt-6">Loading...</div>}
        {error && <div className="mt-6 text-rose-700">Error: {error}</div>}

        {!loading && !error && metricKey && chartData.length > 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-xl font-semibold text-slate-900">Top by {metricKey}</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fill: "#475569" }} />
                  <YAxis dataKey="name" type="category" width={200} tick={{ fill: "#475569" }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ef4444" radius={[8,8,8,8]} />
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
