from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from app.db.base_class import Base
from datetime import datetime

class TrackedProduct(Base):
    """Stores products (own and competitors) being monitored by scraping."""
    id = Column(Integer, primary_key=True, index=True)
    asin = Column(String, unique=True, index=True)       # Amazon Standard ID
    url = Column(String, nullable=True)
    name = Column(String, nullable=True)
    brand_id = Column(String, index=True, nullable=True)
    is_competitor = Column(Boolean, default=False)       # True = competitor product
    competitor_label = Column(String, nullable=True)     # e.g. "Competitor X"

    # Scraped product data
    current_price = Column(Float, nullable=True)
    original_price = Column(Float, nullable=True)
    rating = Column(Float, nullable=True)
    review_count = Column(Integer, nullable=True)
    in_stock = Column(Boolean, nullable=True)
    product_title = Column(String, nullable=True)

    # Metadata
    last_scraped_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
