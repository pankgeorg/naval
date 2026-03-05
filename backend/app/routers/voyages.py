from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_async_session
from app.models.voyage import Voyage
from app.models.port_call import PortCall
from app.models.voyage_leg import VoyageLeg
from app.models.fuel_consumption import FuelConsumption
from app.models.port import Port
from app.calculators.geo import classify_leg, great_circle_distance_nm
from app.schemas.voyage import (
    VoyageCreate, VoyageRead, VoyageUpdate,
)

router = APIRouter(tags=["voyages"])


@router.get("/api/ships/{ship_id}/voyages", response_model=list[VoyageRead])
async def list_voyages(
    ship_id: UUID,
    year: int | None = None,
    status: str | None = None,
    session: AsyncSession = Depends(get_async_session),
):
    query = (
        select(Voyage)
        .where(Voyage.ship_id == ship_id)
        .options(
            selectinload(Voyage.port_calls).selectinload(PortCall.fuel_records),
            selectinload(Voyage.legs).selectinload(VoyageLeg.fuel_records),
            selectinload(Voyage.legs).selectinload(VoyageLeg.track_points),
        )
    )
    if status:
        query = query.where(Voyage.status == status)
    result = await session.execute(query)
    return result.scalars().all()


@router.post("/api/ships/{ship_id}/voyages", response_model=VoyageRead, status_code=201)
async def create_voyage(
    ship_id: UUID,
    data: VoyageCreate,
    session: AsyncSession = Depends(get_async_session),
):
    voyage_dict = data.model_dump(exclude={"port_calls"})
    voyage = Voyage(**voyage_dict, ship_id=ship_id)
    session.add(voyage)
    await session.flush()

    port_calls_created = []
    for pc_data in data.port_calls:
        fuel_recs = pc_data.fuel_records
        pc_dict = pc_data.model_dump(exclude={"fuel_records"})
        pc = PortCall(**pc_dict, voyage_id=voyage.id)
        session.add(pc)
        await session.flush()
        port_calls_created.append(pc)

        for fr in fuel_recs:
            fc = FuelConsumption(**fr.model_dump(), port_call_id=pc.id)
            session.add(fc)

    # Auto-generate legs between consecutive port calls
    total_distance = 0.0
    for i in range(len(port_calls_created) - 1):
        from_pc = port_calls_created[i]
        to_pc = port_calls_created[i + 1]

        from_port_result = await session.execute(select(Port).where(Port.id == from_pc.port_id))
        to_port_result = await session.execute(select(Port).where(Port.id == to_pc.port_id))
        from_port = from_port_result.scalars().first()
        to_port = to_port_result.scalars().first()

        distance = 0.0
        leg_type = "non_eu"
        ets_coverage = 0.0
        fueleu_coverage = 0.0

        if from_port and to_port:
            distance = great_circle_distance_nm(
                {"latitude": from_port.latitude, "longitude": from_port.longitude},
                {"latitude": to_port.latitude, "longitude": to_port.longitude},
            )
            from_info = {
                "is_eu_eea": from_port.is_eu_eea,
                "is_outermost_region": from_port.is_outermost_region,
            }
            to_info = {
                "is_eu_eea": to_port.is_eu_eea,
                "is_outermost_region": to_port.is_outermost_region,
            }
            classification = classify_leg(from_info, to_info)
            leg_type = classification.leg_type
            ets_coverage = classification.eu_ets_coverage
            fueleu_coverage = classification.fueleu_coverage

        total_distance += distance

        leg = VoyageLeg(
            voyage_id=voyage.id,
            leg_order=i,
            from_port_call_id=from_pc.id,
            to_port_call_id=to_pc.id,
            distance_nm=round(distance, 2),
            leg_type=leg_type,
            eu_ets_coverage=ets_coverage,
            fueleu_coverage=fueleu_coverage,
        )
        session.add(leg)

    voyage.total_distance_nm = round(total_distance, 2)
    await session.commit()

    result = await session.execute(
        select(Voyage)
        .where(Voyage.id == voyage.id)
        .options(
            selectinload(Voyage.port_calls).selectinload(PortCall.fuel_records),
            selectinload(Voyage.legs).selectinload(VoyageLeg.fuel_records),
            selectinload(Voyage.legs).selectinload(VoyageLeg.track_points),
        )
    )
    return result.scalars().first()


@router.get("/api/voyages/{voyage_id}", response_model=VoyageRead)
async def get_voyage(
    voyage_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(Voyage)
        .where(Voyage.id == voyage_id)
        .options(
            selectinload(Voyage.port_calls).selectinload(PortCall.fuel_records),
            selectinload(Voyage.legs).selectinload(VoyageLeg.fuel_records),
            selectinload(Voyage.legs).selectinload(VoyageLeg.track_points),
        )
    )
    voyage = result.scalars().first()
    if not voyage:
        raise HTTPException(status_code=404, detail="Voyage not found")
    return voyage


@router.put("/api/voyages/{voyage_id}", response_model=VoyageRead)
async def update_voyage(
    voyage_id: UUID,
    data: VoyageUpdate,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(Voyage).where(Voyage.id == voyage_id))
    voyage = result.scalars().first()
    if not voyage:
        raise HTTPException(status_code=404, detail="Voyage not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(voyage, key, value)

    await session.commit()
    await session.refresh(voyage)
    return voyage


@router.delete("/api/voyages/{voyage_id}", status_code=204)
async def delete_voyage(
    voyage_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(Voyage).where(Voyage.id == voyage_id))
    voyage = result.scalars().first()
    if not voyage:
        raise HTTPException(status_code=404, detail="Voyage not found")
    await session.delete(voyage)
    await session.commit()
