from sqlalchemy import (
    Column, BigInteger,
    ForeignKey, Text,
    DateTime, SmallInteger
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    user_id = Column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    food_id = Column(
        BigInteger,
        ForeignKey("foods.id", ondelete="CASCADE"),
        nullable=False
    )

    rating = Column(
        SmallInteger,
        nullable=False
    )

    comment = Column(Text)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

    user = relationship(
        "User",
        back_populates="reviews"
    )

    food = relationship(
        "Food",
        back_populates="reviews"
    )