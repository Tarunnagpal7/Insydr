"""add otp table

Revision ID: c8f4e5a2b3d1
Revises: abcda137239c
Create Date: 2026-01-24 22:55:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "c8f4e5a2b3d1"
down_revision = "abcda137239c"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "otps",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False, index=True),
        sa.Column("otp_code", sa.String(6), nullable=False),
        sa.Column("purpose", sa.String(), nullable=False),
        sa.Column("is_used", sa.Boolean(), default=False, nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_otps_email_purpose", "otps", ["email", "purpose"])


def downgrade():
    op.drop_index("ix_otps_email_purpose")
    op.drop_table("otps")
