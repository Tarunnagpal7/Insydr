"""add agent avatar and is_active fields

Revision ID: f7a2c3d4e5b6
Revises: 4fbddb84df07
Create Date: 2026-02-15 19:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f7a2c3d4e5b6'
down_revision: str = '95e8066f5eb3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add avatar columns
    op.add_column('agents', sa.Column('avatar_url', sa.String(), nullable=True))
    op.add_column('agents', sa.Column('avatar_public_id', sa.String(), nullable=True))
    
    # Add is_active column with default True for all existing agents
    op.add_column('agents', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')))


def downgrade() -> None:
    op.drop_column('agents', 'is_active')
    op.drop_column('agents', 'avatar_public_id')
    op.drop_column('agents', 'avatar_url')
