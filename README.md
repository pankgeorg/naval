# Maritime Compliance Platform

A web application for managing maritime fleet compliance with international emissions regulations. Track ships, log voyages, and compute regulatory metrics across five frameworks — all in one place.

## What It Does

**Regulatory Calculators**
- **EEDI** — Energy Efficiency Design Index (IMO, phases 0-3)
- **EEXI** — Energy Efficiency Existing Ship Index (IMO 2023+)
- **CII** — Carbon Intensity Indicator with A-E ratings (IMO, annual)
- **FuelEU Maritime** — Well-to-Wake GHG intensity (EU, 2025+)
- **EU ETS** — Emissions Trading System allowance costs (EU, phased in 2024-2026)

**Fleet Management**
- Register ships with full technical specs (DWT, GT, engines, fuel types)
- Log multi-stop voyages with per-leg fuel consumption
- Automatic EU/non-EU leg classification for regulatory coverage
- Interactive maps with port search, route visualization, and ECA zone overlays

**Decision Support**
- What-if scenario modeler — slide speed and fuel mix to see CII, FuelEU, and ETS impacts in real time
- Forward projection to 2050 showing how tightening regulations affect your fleet
- Annual compliance reports combining all five metrics

## Screenshots

The UI is built around a fleet dashboard with drill-down into individual ships, their voyages, and compliance metrics. The scenario modeler lets you compare baseline vs. modified operations side-by-side.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 (async), PostgreSQL 16 |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Zustand |
| Maps | Leaflet.js + OpenStreetMap |
| Charts | Recharts |
| Auth | fastapi-users (JWT bearer tokens) |
| Deployment | Docker Compose + Nginx reverse proxy |

## Getting Started

### Prerequisites

- **Python 3.12+** with [uv](https://docs.astral.sh/uv/) package manager
- **Node.js 20+** with npm
- **PostgreSQL 16** (or use Docker)

### Option 1: Docker Compose (recommended)

```bash
cp .env.example .env
# Edit .env to set DB_PASSWORD and JWT_SECRET

# Dev mode (hot-reload on both backend and frontend)
docker compose up --build

# Production mode (static build, multi-worker uvicorn)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

The app will be available at `http://localhost:8080`. The database is automatically seeded with reference data (fuel types, 50 world ports, ECA zones, regulatory tables). PostgreSQL is exposed on `localhost:25432` for direct access.

|  | Dev (default) | Production |
|---|---|---|
| **Command** | `docker compose up --build` | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build` |
| **Backend** | uvicorn with `--reload`, source mounted | uvicorn with 4 workers, no mount |
| **Frontend** | Vite dev server with HMR, `src/` mounted | Static build served via `serve` |
| **Files** | `docker-compose.yml` + `Dockerfile.dev` | `docker-compose.prod.yml` override + `Dockerfile` |

### Option 2: Local Development

**Backend:**
```bash
cd backend
uv venv && uv pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/maritime"
export JWT_SECRET="your-secret-key"
export ALLOW_ANONYMOUS=true
export SEED_ON_STARTUP=true

uv run uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs on `http://localhost:3000` and proxies `/api/` requests to the backend on port 8000.

### API Documentation

Once the backend is running, interactive API docs are available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
maritime-compliance/
├── backend/
│   ├── app/
│   │   ├── auth/           # JWT authentication
│   │   ├── calculators/    # Regulatory engines (pure functions)
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── routers/        # API endpoints
│   │   ├── schemas/        # Pydantic request/response models
│   │   ├── seed/           # Database seed data
│   │   └── data/           # Static reference data (ports, ECA zones)
│   └── tests/              # Calculator unit tests
├── frontend/
│   └── src/
│       ├── api/            # HTTP client layer
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route pages
│       ├── stores/         # Zustand state management
│       ├── types/          # TypeScript interfaces
│       └── utils/          # Formatters and constants
├── nginx/                  # Reverse proxy configuration
└── docker-compose.yml
```

## Regulatory Calculators

All calculators are pure functions with no database dependencies, making them easy to test and reason about. They live in `backend/app/calculators/`.

| Calculator | Input | Output |
|-----------|-------|--------|
| EEDI | Ship specs, engines, fuel types | Attained & required EEDI, phase, compliance status |
| EEXI | Ship specs, engines, optional overrides | Attained & required EEXI, compliance method |
| CII | Fuel records, distance, year | AER value, A-E rating, rating boundaries |
| FuelEU | Voyage data with leg coverage, year | WtW GHG intensity, target, compliance balance, penalty |
| EU ETS | Voyage data with leg coverage, year, EUA price | CO2eq emissions, EUAs required, cost |

## Configuration

Environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PASSWORD` | `changeme` | PostgreSQL password |
| `JWT_SECRET` | — | Secret key for JWT token signing |
| `ALLOW_ANONYMOUS` | `true` | Allow unauthenticated API access |
| `SEED_ON_STARTUP` | `true` | Auto-seed reference data on first run |
| `EUA_DEFAULT_PRICE` | `75.0` | Default EU ETS allowance price (EUR/tonne) |

## Development

### Running Tests

```bash
cd backend
uv run pytest tests/ -v
```

28 unit tests cover all calculators: distance computation, leg classification, EEDI/CII/FuelEU/EU ETS calculations, scenario modeling, and multi-year projections.

### Linting

```bash
# Python
cd backend && uv run ruff check .

# TypeScript/React
cd frontend && npx eslint src/
```

### Building for Production

```bash
cd frontend
npm run build    # Type-checks then builds to dist/
```

## License

All rights reserved.
