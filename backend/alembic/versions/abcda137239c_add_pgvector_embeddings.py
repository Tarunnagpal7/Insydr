"""add pgvector embeddings

Revision ID: abcda137239c
Revises: 9d3d19a87e6a
Create Date: 2026-01-24 22:27:54.375313

"""
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision = "abcda137239c"
down_revision = "9d3d19a87e6a"
branch_labels = None
depends_on = None

def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "embeddings",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("chunk_id", sa.UUID(), nullable=False),
        sa.Column("workspace_id", sa.UUID(), nullable=False),
        sa.Column("embedding", Vector(1536), nullable=False),
        sa.Column("model_name", sa.String(), nullable=False),
        sa.Column("dimension", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_index(
        "ix_embeddings_embedding",
        "embeddings",
        ["embedding"],
        postgresql_using="ivfflat",
        postgresql_with={"lists": 100},
    )


def downgrade():
    op.drop_index("ix_embeddings_embedding")
    op.drop_table("embeddings")
