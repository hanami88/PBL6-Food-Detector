from sqlalchemy import (
    Column, BigInteger, String,
    Text, DateTime, DECIMAL
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database.database import Base

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    name = Column(String(150), nullable=False)

    slug = Column(
        String(180),
        unique=True,
        nullable=False
    )

    address = Column(String(255), nullable=False)

    ward = Column(String(100))
    district = Column(String(100))

    phone = Column(String(20))
    opening_hours = Column(String(255))

    latitude = Column(DECIMAL(10, 7))
    longitude = Column(DECIMAL(10, 7))

    description = Column(Text)

    image_url = Column(String(500))

    created_at = Column(DateTime, server_default=func.now())

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

    foods = relationship(
        "Food",
        secondary="food_restaurants",
        back_populates="restaurants"
    )