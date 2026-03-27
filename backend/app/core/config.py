from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import Optional
import warnings


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT Settings — JWT_SECRET_KEY MUST be set in .env (no insecure default)
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # OTP Settings
    OTP_EXPIRY_MINUTES: int = 10
    
    # Mail Settings
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int = 587
    MAIL_SERVER: str
    MAIL_FROM_NAME: str = "Insydr Support"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = True
    
    # CORS - Include widget dev server and allow any origin for widget endpoints
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,null"
    
    # App
    APP_NAME: str = "Insydr.AI"
    DEBUG: bool = False  # Must be explicitly set to True in .env for dev

    # AI Providers
    HF_TOKEN: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # Stripe Billing
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_ID_STARTER_MONTHLY: str = ""
    STRIPE_PRICE_ID_STARTER_ANNUAL: str = ""
    STRIPE_PRICE_ID_GROWTH_MONTHLY: str = ""
    STRIPE_PRICE_ID_GROWTH_ANNUAL: str = ""
    STRIPE_PRICE_ID_PRO_MONTHLY: str = ""
    STRIPE_PRICE_ID_PRO_ANNUAL: str = ""

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    @model_validator(mode="after")
    def _validate_security(self):
        weak_markers = ["change-in-production", "insydr-secret", "secret-key", "changeme"]
        if any(m in self.JWT_SECRET_KEY.lower() for m in weak_markers):
            if not self.DEBUG:
                raise ValueError(
                    "SECURITY ERROR: JWT_SECRET_KEY contains a weak/default value. "
                    "Generate a strong secret with: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
                )
            warnings.warn(
                "⚠️  JWT_SECRET_KEY looks weak. This is OK for local dev but MUST be changed for production.",
                stacklevel=2,
            )
        if len(self.JWT_SECRET_KEY) < 32:
            warnings.warn(
                "⚠️  JWT_SECRET_KEY is shorter than 32 characters. Use a longer secret for production.",
                stacklevel=2,
            )
        return self

    class Config:
        env_file = ".env"


settings = Settings()
