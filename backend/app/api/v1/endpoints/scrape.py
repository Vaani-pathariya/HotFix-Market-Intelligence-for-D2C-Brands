"""
Scrape trigger API — allows frontend to kick off background scraping jobs.
"""
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.tasks.scrape_tasks import run_review_scrape, run_competitor_scrape
from app.db.session import SessionLocal
from app.models.scrape_job import ScrapeJob
import re

router = APIRouter()


def extract_asin(url_or_asin: str) -> str | None:
    """
    Extract ASIN from an Amazon URL or return the value if it's already an ASIN.
    ASINs are 10-char alphanumeric codes.
    """
    # Already an ASIN
    if re.match(r'^[A-Z0-9]{10}$', url_or_asin.strip()):
        return url_or_asin.strip()

    # Try to extract from URL patterns like /dp/B0XXXXXXXX or /product/B0XXXXXXXX
    match = re.search(r'/(?:dp|product|gp/product)/([A-Z0-9]{10})', url_or_asin)
    if match:
        return match.group(1)

    return None


class ScrapeRequest(BaseModel):
    url: str           # Amazon product URL or ASIN
    label: str = "Competitor"
    brand_id: str = None
    is_competitor: bool = False


@router.post("/scrape/reviews")
def trigger_review_scrape(req: ScrapeRequest):
    """Trigger a background job to scrape reviews for an Amazon product."""
    asin = extract_asin(req.url)
    if not asin:
        raise HTTPException(status_code=400, detail="Could not extract a valid Amazon ASIN from the URL.")

    task = run_review_scrape.delay(asin, req.brand_id)
    return {
        "job_id": task.id,
        "asin": asin,
        "status": "pending",
        "message": f"Review scraping started for ASIN {asin}. Check /api/v1/scrape/status/{task.id} for progress."
    }


@router.post("/scrape/competitor")
def trigger_competitor_scrape(req: ScrapeRequest):
    """Trigger a background job to scrape competitor product info."""
    asin = extract_asin(req.url)
    if not asin:
        raise HTTPException(status_code=400, detail="Could not extract a valid Amazon ASIN from the URL.")

    task = run_competitor_scrape.delay(asin, req.label, req.brand_id)
    return {
        "job_id": task.id,
        "asin": asin,
        "status": "pending",
        "message": f"Competitor scraping started for ASIN {asin}."
    }


@router.get("/scrape/status/{job_id}")
def get_scrape_status(job_id: str):
    """Poll the status of a running scrape job."""
    db = SessionLocal()
    try:
        job = db.query(ScrapeJob).filter(ScrapeJob.job_id == job_id).first()
        if not job:
            # Fall back to Celery task state
            from app.tasks import celery_app
            result = celery_app.AsyncResult(job_id)
            return {
                "job_id": job_id,
                "status": result.state.lower(),
                "items_scraped": 0,
            }

        return {
            "job_id": job.job_id,
            "job_type": job.job_type,
            "asin": job.asin,
            "status": job.status,
            "items_scraped": job.items_scraped,
            "error": job.error_message,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "finished_at": job.finished_at.isoformat() if job.finished_at else None,
        }
    finally:
        db.close()
