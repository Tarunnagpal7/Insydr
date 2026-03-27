from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # V6 FIX: Only log SQL in debug mode
    pool_size=20,
    max_overflow=10,
    pool_timeout=30,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
)
