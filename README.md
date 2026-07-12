# SO Dashboard — Stack Overflow Data Warehouse

An analytics dashboard that visualizes trends and topic movement from a
Stack Overflow data warehouse. 
It analysis 50000 records from 2014 to end of 2025. Proves with real data the downfall of Stack Overflow after launch of AI chatbots
The project contains a Node/Express backend that exposes analytical endpoints and a React + Vite frontend that consumes them.

**Repository layout**

- `backend/` — Express API (server.js) that queries MySQL views/tables.
- `frontend/` — React + Vite dashboard (Recharts, Axios, Tailwind).
- `Warehouse/` — SQL dumps used to create the `SO_DW` schema and staging data.

**Prerequisites**

- Node.js (18+ recommended)
- MySQL server with the `SO_DW` database loaded from `Warehouse/*.sql`

**Configuration**
Create a `.env` file in `backend/` with the following variables (example):

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=SO_DW
PORT=4000

**Run (development)**

- Start backend:

  cd backend
  npm install
  npm run dev

- Start frontend:

  cd frontend
  npm install
  npm run dev

The frontend (Vite) runs on its default dev port (e.g. http://localhost:5173) and
the backend listens on the port set in `backend/.env` (default `4000`).

**Notes & next steps**

- Load the SQL files in `Warehouse/` to create the `SO_DW` schema before running
  the backend.
- See `frontend/README.md` for a detailed description of the dashboard pages.

If you want, I can: add a Docker compose, create a sample `.env.example`, or
improve the contributing notes — which would you prefer next?
