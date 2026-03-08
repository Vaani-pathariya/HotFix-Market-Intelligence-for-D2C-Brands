from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from app.db.base_class import Base
from datetime import datetime

class Review(Base):
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(String, unique=True, index=True)  # Amazon review ID
    asin = Column(String, index=True)                    # Amazon product ASIN
    brand_id = Column(String, index=True, nullable=True)
    author = Column(String, nullable=True)
    title = Column(String, nullable=True)
    rating = Column(Float)
    text = Column(Text)
    date = Column(DateTime, nullable=True)
    verified_purchase = Column(Boolean, default=False)
    platform = Column(String, default='amazon')
    sentiment_score = Column(Float, nullable=True)       # -1.0 to 1.0
    complaint_themes = Column(String, nullable=True)     # comma-separated themes
    scraped_at = Column(DateTime, default=datetime.utcnow)
