from sqlalchemy import (
    Column, BigInteger, String,
    Text, Boolean, DateTime,
    ForeignKey, DECIMAL, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.database import Base

class Food(Base):
    __tablename__ = "foods"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    category_id = Column(
        BigInteger,
        ForeignKey("categories.id", ondelete="SET NULL")
    )

    name = Column(String(150), nullable=False)
    slug = Column(String(180), unique=True, nullable=False)

    short_description = Column(String(500))
    description = Column(Text)

    origin = Column(String(150))
    average_price = Column(DECIMAL(12, 2))

    main_image_url = Column(String(500))

    is_featured = Column(Boolean, default=False)

    status = Column(
        Enum(
            "DRAFT",
            "PUBLISHED",
            "HIDDEN",
            name="food_status"
        ),
        default="DRAFT",
        nullable=False
    )

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

    category = relationship(
        "Category",
        back_populates="foods"
    )

    images = relationship(
        "FoodImage",
        back_populates="food",
        cascade="all, delete-orphan"
    )

    restaurants = relationship(
        "Restaurant",
        secondary="food_restaurants",
        back_populates="foods"
    )

    reviews = relationship(
        "Review",
        back_populates="food",
        cascade="all, delete-orphan"
    )

    favorited_by = relationship(
        "User",
        secondary="favorites",
        back_populates="favorites"
    )