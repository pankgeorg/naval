from datetime import datetime
from uuid import uuid4, UUID

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CIICorrection(Base):
    __tablename__ = "cii_corrections"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    voyage_id: Mapped[UUID] = mapped_column(ForeignKey("voyages.id", ondelete="CASCADE"))
    correction_type: Mapped[str]
    start_time: Mapped[datetime | None] = mapped_column(nullable=True)
    end_time: Mapped[datetime | None] = mapped_column(nullable=True)
    quantity: Mapped[float | None] = mapped_column(nullable=True)
    unit: Mapped[str | None] = mapped_column(nullable=True)
    co2_offset_tonnes: Mapped[float] = mapped_column(default=0.0)
    notes: Mapped[str | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    voyage: Mapped["Voyage"] = relationship(back_populates="corrections")
