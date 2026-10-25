from sqlalchemy import (
    Column, BigInteger,
    String, Text, DateTime
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(120), unique=True, nullable=False)

    description = Column(Text)
    image_url = Column(String(500))

    created_at = Column(DateTime, server_default=func.now())

    foods = relationship(
        "Food",
        back_populates="category"
    )