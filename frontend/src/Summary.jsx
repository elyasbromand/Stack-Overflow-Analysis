import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import api from "./api/api.js";

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
        const [sRes, shareRes, yRes] = await Promise.all([
          api.get('/summary'),
          api.get('/category-share'),
          api.get('/yearly-totals')
        ]);
        if (cancelled) return;
        setSummary(sRes.data || null);
        setShareRows(shareRes.data || []);
        setYearlyTotals(yRes.data || []);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || 'Failed to load summary');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => (cancelled = true);
  }, []);

  const years = useMemo(() => {
    const s = new Set();
    shareRows.forEach(r => s.add(r.year));
    yearlyTotals.forEach(r => s.add(r.year));
    const arr = Array.from(s).filter(Boolean).sort((a,b)=>a-b);
    return arr;
  }, [shareRows, yearlyTotals]);

  useEffect(() => {
    if (years.length === 0) return;
    if (!startYear) setStartYear(years[0]);
    if (!endYear) setEndYear(years[years.length - 1]);
  }, [years]);

  const filteredShare = useMemo(() => {
    if (!startYear && !endYear) return shareRows;
    const s = Number(startYear) || -Infinity;
    const e = Number(endYear) || Infinity;
    return shareRows.filter(r => r.year >= s && r.year <= e);
  }, [shareRows, startYear, endYear]);

  const filteredTotals = useMemo(() => {
    if (!startYear && !endYear) return yearlyTotals;
    const s = Number(startYear) || -Infinity;
    const e = Number(endYear) || Infinity;
    return yearlyTotals.filter(r => r.year >= s && r.year <= e);
  }, [yearlyTotals, startYear, endYear]);

  return (
    <main className="min-h-screen px-4 py-10 bg-slate-50 text-slate-900 lg:ml-64">
      <section className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/80">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Summary</h1>
        <p className="mt-2 text-sm text-slate-600">High-level KPIs and quick charts. Use the year range filter to focus charts.</p>

        <div className="mt-6 flex flex-wrap gap-4">
          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Start year</span>
            <select value={startYear} onChange={e => setStartYear(e.target.value)} className="w-40 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none">
              <option value="">(auto)</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium text-slate-900">End year</span>
            <select value={endYear} onChange={e => setEndYear(e.target.value)} className="w-40 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none">
              <option value="">(auto)</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
        </div>

        {loading && <div className="mt-6">Loading...</div>}
        {error && <div className="mt-6 text-rose-700">Error: {error}</div>}

        {!loading && !error && summary && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Total questions sampled</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{summary.total_questions_sampled?.toLocaleString?.() ?? summary.total_questions_sampled}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Peak year</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{summary.peak_year ?? '—'}</div>
              <div className="text-sm text-slate-500">{summary.peak_year_count ? `${summary.peak_year_count.toLocaleString?.() ?? summary.peak_year_count} questions` : ''}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">2024 count</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{summary.year_2024_count ?? '—'}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Infra share (start → end)</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{summary.infra_share_start?.pct ?? '—'}% → {summary.infra_share_end?.pct ?? '—'}%</div>
              <div className="text-sm text-slate-500">{summary.infra_share_start ? `${summary.infra_share_start.year} → ${summary.infra_share_end?.year ?? ''}` : ''}</div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Infra share over time</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredShare} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="year" tick={{ fill: '#475569' }} />
                    <YAxis tick={{ fill: '#475569' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="infra_pct" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Total questions per year</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredTotals} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="year" tick={{ fill: '#475569' }} />
                    <YAxis tick={{ fill: '#475569' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="question_count" stroke="#3b82f6" fill="#bfdbfe" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}
