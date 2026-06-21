# SO_DW Dashboard — Setup & Run

This is a two-piece app: a Node/Express backend that queries your MySQL `SO_DW`
warehouse, and a static HTML/JS frontend (Chart.js) that calls it.

## Prerequisites

- XAMPP MySQL running, with `SO_DW` and `so_staging` databases already built
  (fact_questions, dim_time, dim_tags, and the 4 views all created).
- Node.js installed. Check with: `node -v` (if missing, download from nodejs.org).

## 1. Backend setup

Open a terminal (cmd / PowerShell) in the `backend` folder:

```bash
cd backend
npm install
```

Check `.env` matches your XAMPP MySQL setup. Defaults assume the standard
XAMPP config (user `root`, no password, port 3306). If your XAMPP MySQL uses
a different port or you set a root password, edit `.env` accordingly:

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=SO_DW
PORT=4000
```

Start the server:

```bash
npm start
```

You should see:
```
SO_DW API running at http://localhost:4000
Try: http://localhost:4000/api/health
```

Open `http://localhost:4000/api/health` in a browser — it should return
`{"status":"ok","database":"SO_DW"}`. If it errors, the message will tell you
whether it's a connection problem (XAMPP MySQL not running, wrong
port/password) or something else.

**Keep this terminal window open** — closing it stops the API.

## 2. Frontend

No build step needed — it's a single static HTML file.

Just open `frontend/index.html` directly in your browser (double-click it,
or right-click → Open with → your browser).

The page will automatically call `http://localhost:4000/api/...` to pull
live data from your warehouse. If you see a red error banner at the top, it
means the backend isn't reachable — go back and confirm step 1 is running.

## 3. What to check before presenting

- [ ] XAMPP MySQL service is started (green in XAMPP control panel)
- [ ] Backend terminal still open and showing no errors
- [ ] `http://localhost:4000/api/summary` returns real numbers (not an error)
- [ ] `frontend/index.html` loads and all 4 charts populate (not stuck on "Loading...")
- [ ] Browser console (F12) has no red errors

## Troubleshooting

**"Could not reach the backend API" banner on the page**
→ The Express server isn't running, or is running on a different port than
4000. Check the backend terminal.

**`/api/health` shows a database error**
→ Usually means MySQL isn't running in XAMPP, or `.env` credentials are
wrong. Open XAMPP control panel and confirm MySQL shows "Running".

**Charts load but show zero/empty data**
→ Means the connection works but the views are empty or named differently
than expected. Run `SELECT * FROM vw_category_share;` directly in
phpMyAdmin/Workbench to confirm the views still have data.

**CORS error in browser console**
→ Shouldn't happen since the backend has `cors()` enabled for all origins,
but if it does, make sure you're hitting `index.html` via `file://` or a
simple static server — not through some proxy that strips headers.

## Project structure

```
so-dashboard/
├── backend/
│   ├── server.js       ← Express API, all warehouse queries live here
│   ├── package.json
│   └── .env             ← DB connection config
└── frontend/
    └── index.html        ← Dashboard UI (HTML+CSS+JS+Chart.js, single file)
```
