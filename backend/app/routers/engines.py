from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.models.engine import Engine
from app.schemas.ship import EngineRead, EngineUpdate

router = APIRouter(prefix="/api/engines", tags=["engines"])


@router.put("/{engine_id}", response_model=EngineRead)
async def update_engine(
    engine_id: UUID,
    data: EngineUpdate,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(Engine).where(Engine.id == engine_id))
    engine = result.scalars().first()
    if not engine:
        raise HTTPException(status_code=404, detail="Engine not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(engine, key, value)

    await session.commit()
    await session.refresh(engine)
    return engine


@router.delete("/{engine_id}", status_code=204)
async def delete_engine(
    engine_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(Engine).where(Engine.id == engine_id))
    engine = result.scalars().first()
    if not engine:
        raise HTTPException(status_code=404, detail="Engine not found")
    await session.delete(engine)
    await session.commit()
