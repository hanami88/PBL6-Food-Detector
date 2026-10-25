from sqlalchemy import Column, BigInteger, String
from sqlalchemy.orm import relationship

from database.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))

    users = relationship(
        "User",
        secondary="user_roles",
        back_populates="roles"
    )