"""
Competitors endpoint — serves real scraped data from DB, falls back to mock if DB is empty.
"""
from fastapi import APIRouter, Query
from app.db.session import SessionLocal
from app.models.product import TrackedProduct
from datetime import datetime

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────

def _time_ago(dt: datetime) -> str:
    if not dt:
        return "unknown"
    delta = datetime.utcnow() - dt
    hours = int(delta.total_seconds() / 3600)
    if hours < 1:
        return "just now"
    if hours == 1:
        return "1 hour ago"
    if hours < 24:
        return f"{hours} hours ago"
    return f"{int(hours/24)} days ago"


@router.get("/competitors")
def get_competitors(branch: str = Query(None)):
    db = SessionLocal()
    try:
        query = db.query(TrackedProduct).filter(TrackedProduct.is_competitor == True)
        if branch and branch != "All Branches":
            query = query.filter(TrackedProduct.name.ilike(f"%{branch}%"))
            
        products = query.order_by(TrackedProduct.last_scraped_at.desc()).all()

        if not products:
            return {
                "data_source": "scraped",
                "competitors": [],
                "price_comparison_trend": [],
            }

        competitors = []
        for i, p in enumerate(products):
            # Calculate price change
            price_change = 0.0
            if p.current_price and p.original_price and p.original_price > 0:
                price_change = round(((p.current_price - p.original_price) / p.original_price) * 100, 1)

            # Generate smart alert
            alert = None
            if not p.in_stock:
                alert = "Out of stock — opportunity to capture their customers"
            elif price_change < -10:
                alert = f"Price dropped {abs(price_change):.0f}% — may be undercutting you"

            competitors.append({
                "id": p.id,
                "name": p.competitor_label or f"Competitor {i+1}",
                "brand": p.product_title.split(" ")[0] if p.product_title else "Unknown",
                "product": p.product_title or p.asin,
                "platform": "Amazon",
                "current_price": p.current_price,
                "original_price": p.original_price,
                "price_change": price_change,
                "rating": p.rating,
                "review_count": p.review_count,
                "in_stock": p.in_stock if p.in_stock is not None else True,
                "running_ad": False,  # Ad detection not scraped yet
                "last_scraped": _time_ago(p.last_scraped_at),
                "alert": alert,
                "asin": p.asin,
                "url": p.url or f"https://www.amazon.in/dp/{p.asin}"
            })

        return {
            "data_source": "scraped",
            "competitors": competitors,
            "price_comparison_trend": [],
        }
    finally:
        db.close()
