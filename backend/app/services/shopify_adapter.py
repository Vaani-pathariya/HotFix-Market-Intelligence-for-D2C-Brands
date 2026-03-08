from datetime import datetime, timedelta
from typing import List
from app.models.sales import SalesData
import random

class ShopifyAdapter:
    def __init__(self, shop_url: str, access_token: str):
        self.shop_url = shop_url
        self.access_token = access_token

    def fetch_sales_data(self, start_date: datetime, end_date: datetime) -> List[SalesData]:
        # MOCK IMPLEMENTATION FOR MVP
        sales_records = []
        current_date = start_date
        while current_date <= end_date:
            sales_records.append(SalesData(
                brand_id="test_brand",
                sku="SKU-123",
                date=current_date,
                revenue=random.uniform(100.0, 500.0),
                units_sold=random.randint(1, 10),
                source="shopify"
            ))
            current_date += timedelta(days=1)
        return sales_records
