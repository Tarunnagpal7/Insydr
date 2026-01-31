from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


# ============== Request Schemas ==============

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    full_name: str = Field(..., min_length=2, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)


class ResendOTPRequest(BaseModel):
    email: EmailStr
    purpose: str = Field(..., pattern="^(email_verification|password_reset)$")


# ============== Response Schemas ==============

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    email_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class OTPResponse(BaseModel):
    message: str
    email: str
    expires_in_minutes: int
