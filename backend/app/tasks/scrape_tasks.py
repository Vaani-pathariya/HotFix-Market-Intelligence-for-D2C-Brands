"""
Celery background tasks for Amazon scraping.
These run asynchronously without blocking the API.
"""

import asyncio
import uuid
from datetime import datetime
from app.db.session import SessionLocal
from app.models.review import Review
from app.models.product import TrackedProduct
from app.models.scrape_job import ScrapeJob
from app.services.amazon_scraper import scrape_reviews, scrape_product_info
from app.services.sentiment import analyze_review


def _run_async(coro):
    """Helper to run async functions inside sync Celery tasks."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


def run_review_scrape(asin: str, job_id: str, brand_id: str = None):
    """
    Background task: scrape Amazon reviews for an ASIN and persist to DB.
    Returns a summary dict with items_scraped and status.
    """
    db = SessionLocal()
    job = None

    try:
        # Create scrape job record
        job = ScrapeJob(
            job_id=job_id,
            job_type="reviews",
            asin=asin,
            status="running",
            started_at=datetime.utcnow(),
        )
        db.add(job)
        db.commit()

        # Run the Playwright scraper
        raw_reviews = _run_async(scrape_reviews(asin, max_pages=5))

        saved = 0
        for r in raw_reviews:
            # Skip if already in DB
            existing = db.query(Review).filter(Review.review_id == r["review_id"]).first()
            if existing:
                continue

            # Run sentiment analysis
            score, themes = analyze_review(r.get("text", ""), r.get("rating", 3.0))

            review = Review(
                review_id=r["review_id"],
                asin=r["asin"],
                brand_id=brand_id,
                author=r.get("author"),
                title=r.get("title"),
                rating=r["rating"],
                text=r.get("text", ""),
                date=r.get("date"),
                verified_purchase=r.get("verified_purchase", False),
                platform="amazon",
                sentiment_score=score,
                complaint_themes=",".join(themes) if themes else "",
                scraped_at=datetime.utcnow(),
            )
            db.add(review)
            saved += 1

        db.commit()

        # Update job status
        job.status = "done"
        job.items_scraped = saved
        job.finished_at = datetime.utcnow()
        db.commit()

        return {"status": "done", "asin": asin, "items_scraped": saved}

    except Exception as e:
        if job:
            job.status = "failed"
            job.error_message = str(e)
            job.finished_at = datetime.utcnow()
            db.commit()
        raise
    finally:
        db.close()


def run_competitor_scrape(asin: str, job_id: str, label: str = "Competitor", brand_id: str = None):
    """
    Background task: scrape competitor product info from Amazon and persist to DB.
    """
    db = SessionLocal()
    job = None

    try:
        job = ScrapeJob(
            job_id=job_id,
            job_type="competitor",
            asin=asin,
            status="running",
            started_at=datetime.utcnow(),
        )
        db.add(job)
        db.commit()

        product_info = _run_async(scrape_product_info(asin))

        if product_info:
            # Upsert: update if exists, insert if not
            existing = db.query(TrackedProduct).filter(TrackedProduct.asin == asin).first()
            if existing:
                for k, v in product_info.items():
                    setattr(existing, k, v)
                existing.is_competitor = True
                existing.competitor_label = label
                existing.brand_id = brand_id
            else:
                product = TrackedProduct(
                    asin=asin,
                    brand_id=brand_id,
                    is_competitor=True,
                    competitor_label=label,
                    **product_info,
                )
                db.add(product)

            db.commit()

            job.status = "done"
            job.items_scraped = 1
        else:
            job.status = "done"
            job.items_scraped = 0
            job.error_message = "No data returned — possible CAPTCHA block"

        job.finished_at = datetime.utcnow()
        db.commit()

        return {"status": "done", "asin": asin, "data": product_info}

    except Exception as e:
        if job:
            job.status = "failed"
            job.error_message = str(e)
            job.finished_at = datetime.utcnow()
            db.commit()
        raise
    finally:
        db.close()
