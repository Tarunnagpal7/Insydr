"""
Seed script to create the admin user (admin@gmail.com / admin@123).
Run with: python -m app.scripts.seed_admin
"""
import asyncio
import sys
import os

# Add parent dir to path so `app` module is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import async_session
from app.db.models.user import User
from app.security.auth import hash_password
from sqlalchemy import select
from datetime import datetime


async def seed_admin():
    """Create admin user if it doesn't already exist."""
    async with async_session() as session:
        # Check if admin already exists
        result = await session.execute(
            select(User).where(User.email == "admin@gmail.com")
        )
        existing = result.scalar_one_or_none()

        if existing:
            print("✅ Admin user already exists (admin@gmail.com)")
            return

        # Create admin user
        admin = User(
            email="admin@gmail.com",
            password_hash=hash_password("admin@123"),
            full_name="Admin",
            email_verified=True,
            email_verified_at=datetime.utcnow(),
            last_login_at=datetime.utcnow(),
        )
        session.add(admin)
        await session.commit()
        print("✅ Admin user created successfully!")
        print("   Email: admin@gmail.com")
        print("   Password: admin@123")


if __name__ == "__main__":
    asyncio.run(seed_admin())
