from sqlalchemy import Column, Integer, String, DateTime, Text
from app.db.base_class import Base
from datetime import datetime

class ScrapeJob(Base):
    """Tracks background scraping job status."""
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True)     # Celery task ID
    job_type = Column(String)                            # 'reviews' or 'competitor'
    asin = Column(String, index=True)
    status = Column(String, default='pending')           # pending/running/done/failed
    items_scraped = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
