from datetime import datetime
from uuid import uuid4, UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TrackPoint(Base):
    __tablename__ = "track_points"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    voyage_leg_id: Mapped[UUID] = mapped_column(ForeignKey("voyage_legs.id"))
    point_order: Mapped[int]
    latitude: Mapped[float]
    longitude: Mapped[float]
    timestamp: Mapped[datetime | None] = mapped_column(nullable=True)
    sog_knots: Mapped[float | None] = mapped_column(nullable=True)
    heading_deg: Mapped[float | None] = mapped_column(nullable=True)

    leg: Mapped["VoyageLeg"] = relationship(back_populates="track_points")
