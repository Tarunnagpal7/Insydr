from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    
    # JWT Settings
    JWT_SECRET_KEY: str = "insydr-secret-key-change-in-production-2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # OTP Settings
    OTP_EXPIRY_MINUTES: int = 10
    
    # CORS - Include widget dev server and allow any origin for widget endpoints
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,null"
    
    # App
    APP_NAME: str = "Insydr.AI"
    DEBUG: bool = True

    # AI Providers
    HF_TOKEN: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    class Config:
        env_file = ".env"


settings = Settings()
