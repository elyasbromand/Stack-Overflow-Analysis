// server.js
// Backend API for the Stack Overflow Data Warehouse dashboard.
// Talks to MySQL (SO_DW database) and exposes clean JSON endpoints
// for each analytical question the dashboard needs to answer.

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// --- DB connection pool ---
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'SO_DW',
  waitForConnections: true,
  connectionLimit: 10,
});

// Small helper so every route doesn't repeat try/catch boilerplate
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

// --- Health check ---
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: process.env.DB_NAME });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// --- 1. Headline trend: total questions per year, all categories combined ---
app.get('/api/yearly-totals', async (req, res) => {
  try {
    const rows = await query(`
      SELECT tm.year AS year, COUNT(*) AS question_count
      FROM fact_questions f
      JOIN dim_time tm ON f.time_key = tm.time_key
      WHERE tm.year BETWEEN 2014 AND 2025
      GROUP BY tm.year
      ORDER BY tm.year
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2. Yearly totals split by category (the core comparison chart) ---
app.get('/api/yearly-by-category', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM vw_yearly_by_category');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. Category share over time (the "9.4% vs 1.3%" headline stat) ---
app.get('/api/category-share', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM vw_category_share');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 4. Per-tag breakdown ---
app.get('/api/tag-breakdown', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM vw_tag_breakdown');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 5. Decline ranking (winners/losers leaderboard) ---
app.get('/api/decline-ranking', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM vw_decline_ranking');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 6. Monthly resolution for the recent cliff (2021-2025) ---
app.get('/api/monthly-recent', async (req, res) => {
  try {
    const rows = await query(`
      SELECT Yr AS year, Mo AS month, QuestionCount AS question_count
      FROM so_staging.stg_monthly_recent
      ORDER BY Yr, Mo
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 7. Engagement quality trend: avg score / answers / views per year ---
app.get('/api/engagement-trend', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        tm.year AS year,
        ROUND(AVG(f.score), 2) AS avg_score,
        ROUND(AVG(f.answer_count), 2) AS avg_answer_count,
        ROUND(AVG(f.view_count), 0) AS avg_view_count
      FROM fact_questions f
      JOIN dim_time tm ON f.time_key = tm.time_key
      WHERE tm.year BETWEEN 2014 AND 2025
      GROUP BY tm.year
      ORDER BY tm.year
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 8. Summary stats for the top KPI cards ---
app.get('/api/summary', async (req, res) => {
  try {
    const [totals] = await query(`SELECT COUNT(*) AS total_questions FROM fact_questions`);
    const [peak] = await query(`
      SELECT tm.year AS year, COUNT(*) AS cnt
      FROM fact_questions f JOIN dim_time tm ON f.time_key = tm.time_key
      WHERE tm.year BETWEEN 2014 AND 2024
      GROUP BY tm.year ORDER BY cnt DESC LIMIT 1
    `);
    const [latest] = await query(`
      SELECT tm.year AS year, COUNT(*) AS cnt
      FROM fact_questions f JOIN dim_time tm ON f.time_key = tm.time_key
      WHERE tm.year = 2024
      GROUP BY tm.year
    `);
    const shareRows = await query('SELECT * FROM vw_category_share ORDER BY year');
    const first = shareRows[0];
    const last = shareRows[shareRows.length - 1];

    res.json({
      total_questions_sampled: totals.total_questions,
      peak_year: peak ? peak.year : null,
      peak_year_count: peak ? peak.cnt : null,
      year_2024_count: latest ? latest.cnt : null,
      infra_share_start: first ? { year: first.year, pct: first.infra_pct } : null,
      infra_share_end: last ? { year: last.year, pct: last.infra_pct } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`SO_DW API running at http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/api/health`);
});
