from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from alembic import context
import asyncio

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

# import ALL models so Alembic sees them
from app.db.models import (
    user,
    workspace,
    workspace_member,
    api_key,
    agent,
    knowledge,
    agent_knowledge_collection,
    document,
    document_version,
    document_chunk,
    embedding,
    conversation,
    message,
    message_source,
    message_feedback,
    conversation_feedback,
    analytics_event,
    usage_metric,
    webhook,
    webhook_log,
    widget_config,
    unanswered_question,
    otp,
)

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online():
    async with engine.begin() as conn:
        await conn.run_sync(do_run_migrations)

    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
