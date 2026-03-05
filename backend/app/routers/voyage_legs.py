from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_async_session
from app.models.voyage_leg import VoyageLeg
from app.models.track_point import TrackPoint
from app.models.fuel_consumption import FuelConsumption
from app.calculators.geo import track_distance_nm
from app.schemas.voyage import (
    VoyageLegRead, TrackPointCreate,
    FuelConsumptionCreate, FuelConsumptionRead,
)

router = APIRouter(prefix="/api/voyage-legs", tags=["voyage-legs"])


@router.get("/{leg_id}", response_model=VoyageLegRead)
async def get_leg(
    leg_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(VoyageLeg)
        .where(VoyageLeg.id == leg_id)
        .options(
            selectinload(VoyageLeg.track_points),
            selectinload(VoyageLeg.fuel_records),
        )
    )
    leg = result.scalars().first()
    if not leg:
        raise HTTPException(status_code=404, detail="Voyage leg not found")
    return leg


@router.post("/{leg_id}/track", response_model=VoyageLegRead)
async def add_track(
    leg_id: UUID,
    points: list[TrackPointCreate],
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(VoyageLeg).where(VoyageLeg.id == leg_id))
    leg = result.scalars().first()
    if not leg:
        raise HTTPException(status_code=404, detail="Voyage leg not found")

    # Delete existing track points
    existing = await session.execute(select(TrackPoint).where(TrackPoint.voyage_leg_id == leg_id))
    for tp in existing.scalars().all():
        await session.delete(tp)

    for i, pt in enumerate(points):
        tp = TrackPoint(
            voyage_leg_id=leg_id,
            point_order=i,
            latitude=pt.latitude,
            longitude=pt.longitude,
            timestamp=pt.timestamp,
            sog_knots=pt.sog_knots,
            heading_deg=pt.heading_deg,
        )
        session.add(tp)

    # Recompute distance
    pts = [{"latitude": p.latitude, "longitude": p.longitude} for p in points]
    leg.distance_nm = round(track_distance_nm(pts), 2)

    await session.commit()

    result = await session.execute(
        select(VoyageLeg)
        .where(VoyageLeg.id == leg_id)
        .options(
            selectinload(VoyageLeg.track_points),
            selectinload(VoyageLeg.fuel_records),
        )
    )
    return result.scalars().first()


@router.post("/{leg_id}/track/csv", response_model=VoyageLegRead)
async def upload_track_csv(
    leg_id: UUID,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_async_session),
):
    import csv
    import io

    result = await session.execute(select(VoyageLeg).where(VoyageLeg.id == leg_id))
    leg = result.scalars().first()
    if not leg:
        raise HTTPException(status_code=404, detail="Voyage leg not found")

    content = await file.read()
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))

    # Delete existing
    existing = await session.execute(select(TrackPoint).where(TrackPoint.voyage_leg_id == leg_id))
    for tp in existing.scalars().all():
        await session.delete(tp)

    points = []
    for i, row in enumerate(reader):
        tp = TrackPoint(
            voyage_leg_id=leg_id,
            point_order=i,
            latitude=float(row.get("latitude", row.get("lat", 0))),
            longitude=float(row.get("longitude", row.get("lon", 0))),
            sog_knots=float(row["sog"]) if "sog" in row and row["sog"] else None,
        )
        session.add(tp)
        points.append({"latitude": tp.latitude, "longitude": tp.longitude})

    leg.distance_nm = round(track_distance_nm(points), 2)
    await session.commit()

    result = await session.execute(
        select(VoyageLeg)
        .where(VoyageLeg.id == leg_id)
        .options(
            selectinload(VoyageLeg.track_points),
            selectinload(VoyageLeg.fuel_records),
        )
    )
    return result.scalars().first()


@router.delete("/{leg_id}/track", status_code=204)
async def delete_track(
    leg_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    existing = await session.execute(select(TrackPoint).where(TrackPoint.voyage_leg_id == leg_id))
    for tp in existing.scalars().all():
        await session.delete(tp)
    await session.commit()


@router.post("/{leg_id}/fuel", response_model=FuelConsumptionRead, status_code=201)
async def add_sea_fuel(
    leg_id: UUID,
    data: FuelConsumptionCreate,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(VoyageLeg).where(VoyageLeg.id == leg_id))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Voyage leg not found")

    fc = FuelConsumption(**data.model_dump(), voyage_leg_id=leg_id)
    session.add(fc)
    await session.commit()
    await session.refresh(fc)
    return fc
