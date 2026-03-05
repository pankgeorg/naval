# Backend - Maritime Compliance API

FastAPI async backend with SQLAlchemy ORM and regulatory calculators.

## Commands
- **Run**: `uv run uvicorn app.main:app --reload --port 8000`
- **Lint**: `uv run ruff check .`
- **Lint fix**: `uv run ruff check . --fix`
- **Test all**: `uv run pytest tests/ -v`
- **Test one class**: `uv run pytest tests/test_calculators.py::TestCII -v`
- **Install deps**: `uv pip install -r requirements.txt`

## Key Patterns

### Linting (ruff)
- Config: `ruff.toml` (line-length=100)
- F821 ignored globally (SQLAlchemy forward references like `Mapped["Ship"]`)
- F401 ignored in `app/main.py` and `alembic/env.py` (imports for model registration)
- E501 ignored in `app/seed/reference_tables.py` and `app/calculators/constants.py` (data tables)

### Models
- All models inherit from `app.database.Base`
- UUIDs as primary keys (`default=uuid4`)
- Forward references use strings: `Mapped["Ship"]`
- Models must be imported in `app/main.py` for table creation

### Calculators
- Pure functions in `app/calculators/` - no DB, no imports from models/routers
- Input: plain dicts (fuel_types dict, voyage dicts, ship params)
- Output: dataclasses (EEDIResult, CIIResult, FuelEUResult, etc.)
- All regulatory constants in `app/calculators/constants.py`
- Test coverage in `tests/test_calculators.py` (28 tests)

### Routers
- All routes prefixed with `/api/`
- Shared helpers in `app/routers/calculations.py`: `_get_fuel_types_dict`, `_get_ship_with_engines`, `_get_voyages_for_year`
- The scenario router imports these helpers

### Auth
- fastapi-users with JWT bearer strategy
- Anonymous access middleware allows unauthenticated requests when `ALLOW_ANONYMOUS=true`
- User model in `app/auth/models.py`

### Database
- Async SQLAlchemy with asyncpg
- Tables auto-created on startup via `Base.metadata.create_all()`
- Seed data runs on startup when `SEED_ON_STARTUP=true`
- Alembic configured for async migrations
