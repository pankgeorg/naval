"""Seed ports from JSON file."""
import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.port import Port


async def seed_ports(session: AsyncSession) -> None:
    """Seed ports from ports_seed.json if the ports table is empty."""
    result = await session.execute(select(Port).limit(1))
    if result.scalars().first() is not None:
        return

    seed_file = Path(__file__).parent.parent / "data" / "ports_seed.json"
    if not seed_file.exists():
        return

    with open(seed_file) as f:
        ports_data = json.load(f)

    for p in ports_data:
        port = Port(
            name=p["name"],
            unlocode=p["unlocode"],
            country_iso=p["country_iso"],
            latitude=p["latitude"],
            longitude=p["longitude"],
            is_eu_eea=p.get("is_eu_eea", False),
            is_ten_t_core=p.get("is_ten_t_core", False),
            is_ten_t_comprehensive=p.get("is_ten_t_comprehensive", False),
            is_outermost_region=p.get("is_outermost_region", False),
            ops_available=p.get("ops_available", False),
            in_sox_eca=p.get("in_sox_eca", False),
            in_nox_eca=p.get("in_nox_eca", False),
        )
        session.add(port)

    await session.commit()
