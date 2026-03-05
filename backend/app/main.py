"""Maritime Compliance Platform — FastAPI application."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, async_session_maker, Base
from app.auth.backend import auth_backend, fastapi_users
from app.auth.schemas import UserCreate, UserRead, UserUpdate
from app.auth.models import User  # noqa: F401 — ensure model is registered
from app.models import (  # noqa: F401 — register all models with Base
    Ship, Engine, Port, Voyage, PortCall, VoyageLeg,
    TrackPoint, FuelConsumption, PoolingGroup,
    FuelType, EEDIRefLine, CIIRefLine, CIIRatingBoundary,
)
from app.routers import (
    ships, engines, voyages, port_calls, voyage_legs,
    ports, calculations, scenarios, reference,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed data
    if settings.seed_on_startup:
        async with async_session_maker() as session:
            from app.seed.reference_tables import seed_reference_tables
            from app.seed.ports import seed_ports
            await seed_reference_tables(session)
            await seed_ports(session)

    yield


app = FastAPI(
    title="Maritime Compliance Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/api/auth/jwt",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/api/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/api/users",
    tags=["users"],
)

# Application routes
app.include_router(ships.router)
app.include_router(engines.router)
app.include_router(voyages.router)
app.include_router(port_calls.router)
app.include_router(voyage_legs.router)
app.include_router(ports.router)
app.include_router(calculations.router)
app.include_router(scenarios.router)
app.include_router(reference.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
