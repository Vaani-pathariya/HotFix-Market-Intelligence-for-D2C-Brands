"""
Create all database tables on startup.
This replaces the need for Alembic migrations for the initial demo setup.
Run: python -m app.db.init_db
Or import create_tables() in startup events.
"""
from app.db.base_class import Base
from app.db.session import engine

# Import all models so SQLAlchemy registers them with Base.metadata
from app.models.review import Review           # noqa: F401
from app.models.sales import SalesData         # noqa: F401
from app.models.product import TrackedProduct  # noqa: F401
from app.models.scrape_job import ScrapeJob    # noqa: F401


def create_tables():
    print("[DB] Creating tables if they don't exist...")
    Base.metadata.create_all(bind=engine)
    print("[DB] Tables ready.")


if __name__ == "__main__":
    create_tables()
