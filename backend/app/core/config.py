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
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    
    # App
    APP_NAME: str = "Insydr.AI"
    DEBUG: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
