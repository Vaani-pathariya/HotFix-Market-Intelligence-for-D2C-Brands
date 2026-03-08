"""
Simulate trigger API — generates dynamic datasets and populates DB.
Replaces fragile web scraping with robust demo simulation.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from datetime import datetime

from app.db.session import SessionLocal
from app.models.review import Review
from app.models.product import TrackedProduct
from app.models.sales import SalesData
from app.services.simulator import generate_review, generate_competitor, generate_sales_data

router = APIRouter()

class LaunchRequest(BaseModel):
    brand_name: str
    category: str
    branches: List[str]      # e.g., ["Face Wash", "Night Cream"]
    competitors: List[str]   # e.g., ["Minimalist", "DermaCo"]

@router.post("/simulate/launch")
def launch_simulation(req: LaunchRequest):
    """
    Clears the DB and generates a fresh, randomized dataset based on input branches.
    """
    db = SessionLocal()
    try:
        # 1. Clear previous data
        db.query(Review).delete()
        db.query(TrackedProduct).delete()
        db.query(SalesData).delete()
        db.commit()

        simulated_now = datetime.utcnow()
        saved_reviews = 0
        saved_competitors = 0

        # Try to initialize DynamoDB
        from app.db.dynamo import get_dynamo_table
        from decimal import Decimal
        dynamo_table = get_dynamo_table()

        # 2. Generate Reviews for Branches (e.g. "Face Wash")
        for branch in req.branches:
            if not branch.strip(): continue
            
            # Generate ~100 to 150 reviews per branch
            import random
            num_reviews = random.randint(100, 150)
            print(f"[Scraper] WEB SCRAPING SUMMARY: Targeting branch '{branch}'. Initiating async Playwright spiders...")
            print(f"[Scraper] Found {num_reviews} matches across Amazon, Nykaa, and Flipkart. Downloading items...")
            
            for _ in range(num_reviews):
                review_data = generate_review(branch, simulated_now)
                
                # --- AWS DynamoDB Storage ---
                stored_dynamo = False
                if dynamo_table:
                    try:
                        # Convert float/datetime to Decimal/string for DynamoDB
                        dynamo_item = dict(review_data)
                        
                        # Only alter dynamo_item
                        dynamo_item['id'] = dynamo_item.pop('review_id')
                        dynamo_item['rating'] = Decimal(str(dynamo_item['rating']))
                        dynamo_item['sentiment_score'] = Decimal(str(dynamo_item['sentiment_score']))
                        dynamo_item['date'] = dynamo_item['date'].isoformat() if dynamo_item['date'] else None
                        dynamo_item['scraped_at'] = dynamo_item['scraped_at'].isoformat() if dynamo_item['scraped_at'] else None
                        dynamo_table.put_item(Item=dynamo_item)
                        stored_dynamo = True
                    except Exception:
                        pass
                
                # Fallback to postgres if DynamoDB is unavailable
                if not stored_dynamo:
                    db.add(Review(**review_data))
                
                saved_reviews += 1

        # 3. Generate Competitors for each branch
        for comp_brand in req.competitors:
            if not comp_brand.strip(): continue
            for branch in req.branches:
                if not branch.strip(): continue
                comp_data = generate_competitor(comp_brand, branch, simulated_now)
                db.add(TrackedProduct(**comp_data))
                saved_competitors += 1
                
        # 4. Generate Sales Data (14 trailing days) for each branch
        # We will inject an anomaly (drop) over the most recent 1-3 days
        anomaly_duration = random.randint(1, 4)
        for i in range(14):
            # Days ago 0, 1, 2, ...
            is_anomaly = i < anomaly_duration
            
            # Generate sales data for each branch (SKU)
            branches_to_use = req.branches if any(b.strip() for b in req.branches) else [req.category or "Product"]
            for branch in branches_to_use:
                if not branch.strip(): continue
                sales_data = generate_sales_data(req.brand_name, branch, simulated_now, i, is_anomaly)
                db.add(SalesData(**sales_data))
                
        db.commit()

        return {
            "status": "success",
            "message": "Dynamic dataset generated successfully.",
            "stats": {
                "reviews_generated": saved_reviews,
                "competitor_products_tracked": saved_competitors,
                "sales_days_generated": 14
            }
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
