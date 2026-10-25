from sqlalchemy import (
    Column, BigInteger,
    ForeignKey, String,
    Integer, DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.database import Base

class FoodImage(Base):
    __tablename__ = "food_images"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    food_id = Column(
        BigInteger,
        ForeignKey(
            "foods.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    image_url = Column(
        String(500),
        nullable=False
    )

    alt_text = Column(String(255))
    display_order = Column(
        Integer,
        default=0
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    food = relationship(
        "Food",
        back_populates="images"
    )