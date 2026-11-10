from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.sql import func

from database.database import Base


class SearchHistory(Base):
    __tablename__ = "search_history"
    __table_args__ = (
        Index("idx_search_history_user_time", "user_id", "searched_at"),
        Index("idx_search_history_keyword", "keyword"),
        Index("idx_search_history_time", "searched_at"),
        CheckConstraint("result_count >= 0", name="chk_search_history_result_count"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )
    keyword = Column(String(255), nullable=False)
    search_type = Column(
        Enum("FOOD", "RESTAURANT", "ALL", name="search_history_type"),
        nullable=False,
        server_default="ALL",
    )
    result_count = Column(Integer, nullable=False, server_default="0")
    searched_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())
