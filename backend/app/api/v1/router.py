from fastapi import APIRouter
from app.api.v1.endpoints import dashboard, reviews, competitors, diagnostics, simulate

api_router = APIRouter()

api_router.include_router(dashboard.router, tags=["dashboard"])
api_router.include_router(reviews.router, tags=["reviews"])
api_router.include_router(competitors.router, tags=["competitors"])
api_router.include_router(diagnostics.router, tags=["diagnostics"])
api_router.include_router(simulate.router, tags=["simulate"])


