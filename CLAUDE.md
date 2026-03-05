# Maritime Compliance Platform

Full-stack maritime fleet compliance web application implementing IMO and EU regulations.

## Project Structure

```
maritime-compliance/
├── backend/          # FastAPI + SQLAlchemy async backend
├── frontend/         # React 18 + TypeScript + Vite frontend
├── nginx/            # Nginx reverse proxy config
├── docker-compose.yml
└── .env.example
```

Specification lives at `../SPEC.md` (one level up).

## Quick Start

### Backend
```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm run dev        # dev server on port 3000
npm run build      # production build (tsc + vite)
```

### Docker (full stack)
```bash
cp .env.example .env
docker compose up --build
```

## Commands

### Backend
- **Lint**: `cd backend && uv run ruff check .`
- **Lint fix**: `cd backend && uv run ruff check . --fix`
- **Test**: `cd backend && uv run pytest tests/ -v`
- **Run single test**: `cd backend && uv run pytest tests/test_calculators.py::TestEEDI -v`

### Frontend
- **Lint**: `cd frontend && npx eslint src/`
- **Type check**: `cd frontend && npx tsc --noEmit`
- **Build**: `cd frontend && npm run build`
- **Dev server**: `cd frontend && npm run dev`

## Tech Stack

### Backend
- Python 3.12+ / FastAPI / SQLAlchemy 2.x (async) / Alembic / asyncpg
- Auth: fastapi-users with JWT bearer tokens
- Package manager: **uv** (not pip directly)
- Linter: **ruff** (config in `backend/ruff.toml`, line-length=100)
- Tests: pytest + pytest-asyncio

### Frontend
- React 19 / TypeScript 5.9 / Vite 7 / Tailwind CSS v4
- State: Zustand / HTTP: Axios / Charts: Recharts / Maps: react-leaflet
- Package manager: **npm** (use `--legacy-peer-deps` if conflicts arise)
- Linter: ESLint 9 flat config (`eslint.config.js`)
- Tailwind v4 uses `@tailwindcss/postcss` plugin and `@theme` directive in CSS

## Architecture

### Backend Layout
- `app/models/` - SQLAlchemy ORM models (Ship, Engine, Voyage, PortCall, VoyageLeg, etc.)
- `app/routers/` - FastAPI routers (ships, engines, voyages, ports, calculations, scenarios, reference)
- `app/calculators/` - Pure-function regulatory calculators (EEDI, EEXI, CII, FuelEU, EU ETS, scenario, projection)
- `app/schemas/` - Pydantic v2 request/response schemas
- `app/auth/` - fastapi-users auth (JWT backend, user manager, anonymous middleware)
- `app/seed/` - Database seed data (fuel types, reference tables, ports, ECA zones)
- `app/data/` - Static data files (ports_seed.json, eca_zones.geojson)

### Frontend Layout
- `src/api/` - Axios API client and endpoint functions
- `src/pages/` - Route pages (FleetDashboard, ShipDetail, ShipEditor, VoyageCreator, etc.)
- `src/components/` - Reusable components (layout, fleet, compliance, maps, scenarios, voyage, shared)
- `src/stores/` - Zustand stores (auth, fleet, voyage)
- `src/types/` - TypeScript interfaces (ship, voyage, port, fuel, calculations)
- `src/utils/` - Formatters and constants

### Calculators (pure functions, no DB dependency)
All calculators live in `backend/app/calculators/` and take plain dicts as input:
- `eedi.py` - Energy Efficiency Design Index
- `eexi.py` - Energy Efficiency Existing Ship Index (reuses EEDI logic)
- `cii.py` - Carbon Intensity Indicator with A-E ratings
- `fueleu.py` - FuelEU Maritime GHG intensity
- `eu_ets.py` - EU Emissions Trading System allowances
- `scenario.py` - What-if engine (speed/fuel changes)
- `projection.py` - Multi-year forward projection
- `constants.py` - All regulatory reference data
- `geo.py` - Haversine, track distance, leg classification

## Conventions

- Calculators are **pure functions** - they take dicts, return dataclasses, and never touch the DB
- SQLAlchemy models use **string-quoted forward references** (F821 is intentionally ignored in ruff)
- All API routes are prefixed with `/api/`
- Frontend proxies `/api/` to `localhost:8000` in dev mode (vite.config.ts)
- Custom color palette `maritime-*` defined via `@theme` in `src/index.css`
- Docker compose mounts `backend/app` as volume for hot-reload in dev
