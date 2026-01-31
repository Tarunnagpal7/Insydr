from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.db.models.user import User
from app.db.models.otp import OTP


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        stmt = select(User).where(User.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        stmt = select(User).where(User.id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, user: User) -> User:
        """Create a new user."""
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def update(self, user: User) -> User:
        """Update an existing user."""
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def email_exists(self, email: str) -> bool:
        """Check if email already exists."""
        stmt = select(User.id).where(User.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None


class OTPRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, otp: OTP) -> OTP:
        """Create a new OTP."""
        self.session.add(otp)
        await self.session.commit()
        await self.session.refresh(otp)
        return otp

    async def get_valid_otp(self, email: str, otp_code: str, purpose: str) -> Optional[OTP]:
        """Get a valid (unused, not expired) OTP."""
        stmt = select(OTP).where(
            OTP.email == email,
            OTP.otp_code == otp_code,
            OTP.purpose == purpose,
            OTP.is_used == False,
            OTP.expires_at > datetime.utcnow()
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def invalidate_previous_otps(self, email: str, purpose: str) -> None:
        """Mark all previous OTPs for this email and purpose as used."""
        stmt = select(OTP).where(
            OTP.email == email,
            OTP.purpose == purpose,
            OTP.is_used == False
        )
        result = await self.session.execute(stmt)
        otps = result.scalars().all()
        for otp in otps:
            otp.is_used = True
        await self.session.commit()

    async def mark_as_used(self, otp: OTP) -> None:
        """Mark an OTP as used."""
        otp.is_used = True
        await self.session.commit()
