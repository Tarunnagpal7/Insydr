"""Sync workspace tables

Revision ID: 50b50e730f67
Revises: 0be00c6626cb
Create Date: 2026-01-26 13:38:05.579668

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '50b50e730f67'
down_revision: Union[str, Sequence[str], None] = '0be00c6626cb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
