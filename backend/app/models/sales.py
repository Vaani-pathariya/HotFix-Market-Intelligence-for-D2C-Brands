from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from app.db.base_class import Base

class SalesData(Base):
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(String, index=True)
    sku = Column(String, index=True)
    date = Column(DateTime, index=True)
    revenue = Column(Float)
    units_sold = Column(Integer)
    source = Column(String)  # shopify, amazon, etc.
