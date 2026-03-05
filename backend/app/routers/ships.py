from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_async_session
from app.models.ship import Ship
from app.models.engine import Engine
from app.schemas.ship import ShipCreate, ShipRead, ShipUpdate, ShipList, EngineCreate, EngineRead

router = APIRouter(prefix="/api/ships", tags=["ships"])


@router.get("", response_model=list[ShipList])
async def list_ships(
    ship_type: str | None = None,
    flag_state: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_async_session),
):
    query = select(Ship)
    if ship_type:
        query = query.where(Ship.ship_type == ship_type)
    if flag_state:
        query = query.where(Ship.flag_state == flag_state)
    query = query.offset((page - 1) * size).limit(size)
    result = await session.execute(query)
    return result.scalars().all()


@router.post("", response_model=ShipRead, status_code=201)
async def create_ship(
    data: ShipCreate,
    session: AsyncSession = Depends(get_async_session),
):
    engines_data = data.engines
    ship_dict = data.model_dump(exclude={"engines"})
    ship = Ship(**ship_dict)
    session.add(ship)
    await session.flush()

    for eng_data in engines_data:
        engine = Engine(**eng_data.model_dump(), ship_id=ship.id)
        session.add(engine)

    await session.commit()

    result = await session.execute(
        select(Ship).where(Ship.id == ship.id).options(selectinload(Ship.engines))
    )
    return result.scalars().first()


@router.get("/{ship_id}", response_model=ShipRead)
async def get_ship(
    ship_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(Ship).where(Ship.id == ship_id).options(selectinload(Ship.engines))
    )
    ship = result.scalars().first()
    if not ship:
        raise HTTPException(status_code=404, detail="Ship not found")
    return ship


@router.put("/{ship_id}", response_model=ShipRead)
async def update_ship(
    ship_id: UUID,
    data: ShipUpdate,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(Ship).where(Ship.id == ship_id).options(selectinload(Ship.engines))
    )
    ship = result.scalars().first()
    if not ship:
        raise HTTPException(status_code=404, detail="Ship not found")

    update_data = data.model_dump(exclude_unset=True)
    engines_data = update_data.pop("engines", None)
    for key, value in update_data.items():
        setattr(ship, key, value)

    if engines_data is not None:
        for old_engine in ship.engines:
            await session.delete(old_engine)
        await session.flush()
        for eng_dict in engines_data:
            engine = Engine(**eng_dict, ship_id=ship.id)
            session.add(engine)

    await session.commit()
    result = await session.execute(
        select(Ship).where(Ship.id == ship_id)
        .options(selectinload(Ship.engines))
    )
    return result.scalars().first()


@router.delete("/{ship_id}", status_code=204)
async def delete_ship(
    ship_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(Ship).where(Ship.id == ship_id))
    ship = result.scalars().first()
    if not ship:
        raise HTTPException(status_code=404, detail="Ship not found")
    await session.delete(ship)
    await session.commit()


# Engine sub-routes
@router.get("/{ship_id}/engines", response_model=list[EngineRead])
async def list_engines(
    ship_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(Engine).where(Engine.ship_id == ship_id))
    return result.scalars().all()


@router.post("/{ship_id}/engines", response_model=EngineRead, status_code=201)
async def create_engine(
    ship_id: UUID,
    data: EngineCreate,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(Ship).where(Ship.id == ship_id))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Ship not found")

    engine = Engine(**data.model_dump(), ship_id=ship_id)
    session.add(engine)
    await session.commit()
    await session.refresh(engine)
    return engine
