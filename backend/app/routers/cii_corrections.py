from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.models.cii_correction import CIICorrection
from app.models.voyage import Voyage
from app.schemas.cii_correction import (
    CIICorrectionCreate, CIICorrectionRead, CIICorrectionUpdate,
)

router = APIRouter(tags=["cii_corrections"])


@router.get(
    "/api/voyages/{voyage_id}/cii-corrections",
    response_model=list[CIICorrectionRead],
)
async def list_corrections(
    voyage_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(CIICorrection)
        .where(CIICorrection.voyage_id == voyage_id)
        .order_by(CIICorrection.start_time)
    )
    return result.scalars().all()


@router.post(
    "/api/voyages/{voyage_id}/cii-corrections",
    response_model=CIICorrectionRead,
    status_code=201,
)
async def create_correction(
    voyage_id: UUID,
    data: CIICorrectionCreate,
    session: AsyncSession = Depends(get_async_session),
):
    voyage = await session.get(Voyage, voyage_id)
    if not voyage:
        raise HTTPException(status_code=404, detail="Voyage not found")

    correction = CIICorrection(**data.model_dump(), voyage_id=voyage_id)
    session.add(correction)
    await session.commit()
    await session.refresh(correction)
    return correction


@router.put("/api/cii-corrections/{correction_id}", response_model=CIICorrectionRead)
async def update_correction(
    correction_id: UUID,
    data: CIICorrectionUpdate,
    session: AsyncSession = Depends(get_async_session),
):
    correction = await session.get(CIICorrection, correction_id)
    if not correction:
        raise HTTPException(status_code=404, detail="Correction not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(correction, key, value)

    await session.commit()
    await session.refresh(correction)
    return correction


@router.delete("/api/cii-corrections/{correction_id}", status_code=204)
async def delete_correction(
    correction_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    correction = await session.get(CIICorrection, correction_id)
    if not correction:
        raise HTTPException(status_code=404, detail="Correction not found")
    await session.delete(correction)
    await session.commit()
