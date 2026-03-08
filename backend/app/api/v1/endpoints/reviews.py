"""
Reviews endpoint — serves real scraped data from DB, falls back to mock if DB is empty.
"""
from fastapi import APIRouter, Query
from app.db.session import SessionLocal
from app.models.review import Review
from collections import Counter, defaultdict

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────

def _build_real_response(reviews: list) -> dict:
    """Convert DB review rows into the response schema."""
    if not reviews:
        return None

    # Overall sentiment
    scores = [r.sentiment_score for r in reviews if r.sentiment_score is not None]
    avg_score = sum(scores) / len(scores) if scores else 0
    # Convert -1..1 → 1..5 scale for display
    avg_rating = round(((avg_score + 1) / 2) * 4 + 1, 1)

    # Complaint themes aggregate
    theme_counter: Counter = Counter()
    for r in reviews:
        if r.complaint_themes:
            for t in r.complaint_themes.split(","):
                t = t.strip()
                if t:
                    theme_counter[t] += 1

    NEGATIVE = {"Packaging / Leakage", "Skin Irritation", "Fragrance", "Delivery Delay"}
    complaint_themes = [
        {
            "theme": theme,
            "count": count,
            "sentiment": "negative" if theme in NEGATIVE else "positive",
            "change": 0,
        }
        for theme, count in theme_counter.most_common(8)
    ]

    # Weekly sentiment trend (group by scraped_at week)
    weekly: defaultdict = defaultdict(list)
    for r in reviews:
        if r.scraped_at:
            week_key = f"W{r.scraped_at.isocalendar()[1]}"
            if r.sentiment_score is not None:
                weekly[week_key].append(r.sentiment_score)
    sentiment_trend = [
        {"week": wk, "score": round(((sum(v)/len(v) + 1)/2)*4 + 1, 2)}
        for wk, v in sorted(weekly.items())[-6:]
    ]

    # Recent reviews (last 10)
    recent = []
    for i, r in enumerate(sorted(reviews, key=lambda x: x.scraped_at or x.date or "", reverse=True)[:10]):
        themes = [t.strip() for t in (r.complaint_themes or "").split(",") if t.strip()]
        recent.append({
            "id": r.id,
            "platform": r.platform or "amazon",
            "rating": r.rating,
            "author": r.author or "Anonymous",
            "text": r.text,
            "date": r.date.strftime("%b %d") if r.date else "Recent",
            "flagged_themes": themes,
        })

    return {
        "overall_sentiment": avg_rating,
        "sentiment_change": -0.3,
        "total_reviews_scraped": len(reviews),
        "data_source": "scraped",
        "complaint_themes": complaint_themes,
        "sentiment_trend": sentiment_trend,
        "recent_reviews": recent,
    }


@router.get("/reviews")
def get_reviews(
    asin: str = Query(None, description="Amazon ASIN to filter reviews"),
    branch: str = Query(None, description="Branch to filter reviews")
):
    db = SessionLocal()
    try:
        from app.db.dynamo import get_dynamo_table
        dynamo_table = get_dynamo_table()
        reviews = []
        
        # Try fetching from DynamoDB first
        if dynamo_table:
            try:
                from boto3.dynamodb.conditions import Key, Attr
                target_asin = branch.replace(" ", "").lower() if branch and branch != "All Branches" else asin
                
                if target_asin:
                    resp = dynamo_table.scan(FilterExpression=Attr('asin').eq(target_asin))
                else:
                    resp = dynamo_table.scan()
                    
                items = resp.get('Items', [])
                
                # Mock a Postgres Review object for each item so existing logic works
                class MockReview:
                    def __init__(self, d):
                        self.id = d.get("id")
                        self.asin = d.get("asin")
                        self.author = d.get("author")
                        self.title = d.get("title")
                        self.rating = float(d.get("rating", 0))
                        self.text = d.get("text")
                        
                        # Parse dates back from ISO string
                        from datetime import datetime
                        self.date = datetime.fromisoformat(d.get("date")) if d.get("date") else None
                        self.scraped_at = datetime.fromisoformat(d.get("scraped_at")) if d.get("scraped_at") else None
                        
                        self.verified_purchase = d.get("verified_purchase", False)
                        self.platform = d.get("platform")
                        self.sentiment_score = float(d.get("sentiment_score", 0))
                        self.complaint_themes = d.get("complaint_themes", "")
                        
                reviews = [MockReview(item) for item in items]
                # Sort descending by scraped_at or date
                reviews.sort(key=lambda x: x.scraped_at or x.date or datetime.min, reverse=True)
                reviews = reviews[:200]
            except Exception:
                reviews = [] # If DynamoDB fails, fallback to Postgres
                
        # Fallback to postgres
        if not reviews:
            query = db.query(Review)
            if branch and branch != "All Branches":
                asin_val = branch.replace(" ", "").lower()
                query = query.filter(Review.asin == asin_val)
            elif asin:
                query = query.filter(Review.asin == asin)
            reviews = query.order_by(Review.scraped_at.desc()).limit(200).all()

        real = _build_real_response(reviews)
        if real:
            return real

        # DB empty — return empty data
        return {
            "overall_sentiment": 0.0,
            "sentiment_change": 0.0,
            "total_reviews_scraped": 0,
            "data_source": "scraped",
            "complaint_themes": [],
            "sentiment_trend": [],
            "recent_reviews": [],
        }
    finally:
        db.close()
