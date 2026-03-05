from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.models.port import Port
from app.schemas.port import PortCreate, PortRead, PortList

router = APIRouter(prefix="/api/ports", tags=["ports"])


@router.get("", response_model=list[PortList])
async def list_ports(
    q: str | None = None,
    country: str | None = None,
    is_eu_eea: bool | None = None,
    is_ten_t_core: bool | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_async_session),
):
    query = select(Port)
    if q:
        pattern = f"%{q}%"
        query = query.where(or_(Port.name.ilike(pattern), Port.unlocode.ilike(pattern)))
    if country:
        query = query.where(Port.country_iso == country.upper())
    if is_eu_eea is not None:
        query = query.where(Port.is_eu_eea == is_eu_eea)
    if is_ten_t_core is not None:
        query = query.where(Port.is_ten_t_core == is_ten_t_core)
    query = query.order_by(Port.name).offset((page - 1) * size).limit(size)
    result = await session.execute(query)
    return result.scalars().all()


@router.get("/{port_id}", response_model=PortRead)
async def get_port(
    port_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(Port).where(Port.id == port_id))
    port = result.scalars().first()
    if not port:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Port not found")
    return port


@router.post("", response_model=PortRead, status_code=201)
async def create_port(
    data: PortCreate,
    session: AsyncSession = Depends(get_async_session),
):
    port = Port(**data.model_dump(), is_user_added=True)
    session.add(port)
    await session.commit()
    await session.refresh(port)
    return port
