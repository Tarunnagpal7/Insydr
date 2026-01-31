from datetime import datetime, timedelta
from uuid import UUID
from typing import Optional

from app.db.models.user import User
from app.db.models.otp import OTP
from app.db.repositories.auth_repository import UserRepository, OTPRepository
from app.security.auth import (
    hash_password, 
    verify_password, 
    create_access_token, 
    generate_otp
)
from app.core.config import settings


class AuthService:
    def __init__(self, user_repo: UserRepository, otp_repo: OTPRepository):
        self.user_repo = user_repo
        self.otp_repo = otp_repo

    async def signup(self, email: str, password: str, full_name: str) -> tuple[User, str]:
        """
        Register a new user and send OTP for email verification.
        Returns the user and the OTP code (for console logging).
        """
        # Check if email already exists
        if await self.user_repo.email_exists(email):
            raise ValueError("This email is already registered. Please sign in instead.")

        # Create user
        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            email_verified=False
        )
        user = await self.user_repo.create(user)

        # Generate and save OTP
        otp_code = await self._create_otp(email, "email_verification")

        return user, otp_code

    async def login(self, email: str, password: str) -> tuple[str, User]:
        """
        Authenticate user and return JWT token.
        """
        user = await self.user_repo.get_by_email(email)
        
        if not user:
            raise ValueError("The email or password you entered is incorrect. Please try again.")

        if not verify_password(password, user.password_hash):
            raise ValueError("The email or password you entered is incorrect. Please try again.")

        if not user.email_verified:
            raise ValueError("Your email address hasn't been verified yet. Please check your inbox for the verification link.")

        # Update last login
        user.last_login_at = datetime.utcnow()
        await self.user_repo.update(user)

        # Create JWT token
        token = create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )

        return token, user

    async def verify_email_otp(self, email: str, otp_code: str) -> User:
        """
        Verify email using OTP.
        """
        otp = await self.otp_repo.get_valid_otp(email, otp_code, "email_verification")
        
        if not otp:
            raise ValueError("The code you entered is invalid or has expired. Please request a new one.")

        # Mark OTP as used
        await self.otp_repo.mark_as_used(otp)

        # Update user email verification status
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise ValueError("We couldn't find an account with that email address.")

        user.email_verified = True
        user.email_verified_at = datetime.utcnow()
        await self.user_repo.update(user)

        return user

    async def forgot_password(self, email: str) -> Optional[str]:
        """
        Send password reset OTP. Returns OTP code for console logging.
        """
        user = await self.user_repo.get_by_email(email)
        
        if not user:
            # Don't reveal if email exists for security
            return None

        otp_code = await self._create_otp(email, "password_reset")
        return otp_code

    async def reset_password(self, email: str, otp_code: str, new_password: str) -> User:
        """
        Reset password using OTP.
        """
        otp = await self.otp_repo.get_valid_otp(email, otp_code, "password_reset")
        
        if not otp:
            raise ValueError("The code you entered is invalid or has expired. Please request a new one.")

        user = await self.user_repo.get_by_email(email)
        if not user:
            raise ValueError("We couldn't find an account with that email address.")

        # Update password
        user.password_hash = hash_password(new_password)
        user.updated_at = datetime.utcnow()
        await self.user_repo.update(user)

        # Mark OTP as used
        await self.otp_repo.mark_as_used(otp)

        return user

    async def resend_otp(self, email: str, purpose: str) -> str:
        """
        Resend OTP for email verification or password reset.
        """
        user = await self.user_repo.get_by_email(email)
        
        if not user:
            raise ValueError("We couldn't find an account with that email address.")

        if purpose == "email_verification" and user.email_verified:
            raise ValueError("Your email is already verified. You can log in.")

        otp_code = await self._create_otp(email, purpose)
        return otp_code

    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        return await self.user_repo.get_by_id(user_id)

    async def _create_otp(self, email: str, purpose: str) -> str:
        """Create a new OTP and invalidate previous ones."""
        # Invalidate previous OTPs
        await self.otp_repo.invalidate_previous_otps(email, purpose)

        # Generate new OTP
        otp_code = generate_otp()
        otp = OTP(
            email=email,
            otp_code=otp_code,
            purpose=purpose,
            expires_at=datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
        )
        await self.otp_repo.create(otp)

        # Console log the OTP (for development)
        print("\n" + "=" * 50)
        print(f"📧 OTP for {email}")
        print(f"📝 Purpose: {purpose}")
        print(f"🔐 OTP Code: {otp_code}")
        print(f"⏰ Expires in: {settings.OTP_EXPIRY_MINUTES} minutes")
        print("=" * 50 + "\n")

        return otp_code
