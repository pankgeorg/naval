from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_async_session
from app.models.port_call import PortCall
from app.models.fuel_consumption import FuelConsumption
from app.schemas.voyage import (
    PortCallCreate, PortCallRead,
    FuelConsumptionCreate, FuelConsumptionRead,
)

router = APIRouter(prefix="/api/port-calls", tags=["port-calls"])


@router.post("/{voyage_id}", response_model=PortCallRead, status_code=201)
async def add_port_call(
    voyage_id: UUID,
    data: PortCallCreate,
    session: AsyncSession = Depends(get_async_session),
):
    fuel_recs = data.fuel_records
    pc_dict = data.model_dump(exclude={"fuel_records"})
    pc = PortCall(**pc_dict, voyage_id=voyage_id)
    session.add(pc)
    await session.flush()

    for fr in fuel_recs:
        fc = FuelConsumption(**fr.model_dump(), port_call_id=pc.id)
        session.add(fc)

    await session.commit()

    result = await session.execute(
        select(PortCall).where(PortCall.id == pc.id).options(selectinload(PortCall.fuel_records))
    )
    return result.scalars().first()


@router.put("/{pc_id}", response_model=PortCallRead)
async def update_port_call(
    pc_id: UUID,
    data: PortCallCreate,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(PortCall).where(PortCall.id == pc_id).options(selectinload(PortCall.fuel_records))
    )
    pc = result.scalars().first()
    if not pc:
        raise HTTPException(status_code=404, detail="Port call not found")

    update_data = data.model_dump(exclude={"fuel_records"})
    for key, value in update_data.items():
        setattr(pc, key, value)

    await session.commit()
    await session.refresh(pc)
    return pc


@router.delete("/{pc_id}", status_code=204)
async def delete_port_call(
    pc_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(PortCall).where(PortCall.id == pc_id))
    pc = result.scalars().first()
    if not pc:
        raise HTTPException(status_code=404, detail="Port call not found")
    await session.delete(pc)
    await session.commit()


@router.post("/{pc_id}/fuel", response_model=FuelConsumptionRead, status_code=201)
async def add_berth_fuel(
    pc_id: UUID,
    data: FuelConsumptionCreate,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(PortCall).where(PortCall.id == pc_id))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Port call not found")

    fc = FuelConsumption(**data.model_dump(), port_call_id=pc_id)
    session.add(fc)
    await session.commit()
    await session.refresh(fc)
    return fc
