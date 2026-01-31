from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_auth_service, get_current_user
from app.services.auth_service import AuthService
from app.api.schemas.auth import (
    SignupRequest,
    LoginRequest,
    VerifyOTPRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ResendOTPRequest,
    AuthResponse,
    UserResponse,
    MessageResponse,
    OTPResponse
)
from app.db.models.user import User
from app.core.config import settings


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=OTPResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    request: SignupRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Register a new user account.
    An OTP will be sent for email verification (logged to console for now).
    """
    try:
        user, otp_code = await auth_service.signup(
            email=request.email,
            password=request.password,
            full_name=request.full_name
        )
        return OTPResponse(
            message="Account created successfully. Please verify your email with the OTP sent.",
            email=request.email,
            expires_in_minutes=settings.OTP_EXPIRY_MINUTES
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Authenticate and get JWT access token.
    """
    try:
        token, user = await auth_service.login(
            email=request.email,
            password=request.password
        )
        return AuthResponse(
            access_token=token,
            user=UserResponse.model_validate(user)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp(
    request: VerifyOTPRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Verify email with OTP code.
    Returns JWT token on successful verification.
    """
    from app.security.auth import create_access_token
    
    try:
        user = await auth_service.verify_email_otp(
            email=request.email,
            otp_code=request.otp_code
        )
        
        # Create token for verified user
        token = create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        return AuthResponse(
            access_token=token,
            user=UserResponse.model_validate(user)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Request password reset OTP.
    OTP will be logged to console for now.
    """
    await auth_service.forgot_password(email=request.email)
    # Always return success to not reveal if email exists
    return MessageResponse(
        message="If an account exists with this email, you will receive a password reset OTP."
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    request: ResetPasswordRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Reset password using OTP.
    """
    try:
        await auth_service.reset_password(
            email=request.email,
            otp_code=request.otp_code,
            new_password=request.new_password
        )
        return MessageResponse(
            message="Password reset successfully. You can now login with your new password."
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/resend-otp", response_model=OTPResponse)
async def resend_otp(
    request: ResendOTPRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Resend OTP for email verification or password reset.
    """
    try:
        await auth_service.resend_otp(
            email=request.email,
            purpose=request.purpose
        )
        return OTPResponse(
            message="OTP sent successfully.",
            email=request.email,
            expires_in_minutes=settings.OTP_EXPIRY_MINUTES
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user profile.
    """
    return UserResponse.model_validate(current_user)


@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout the current user.
    Client should discard the JWT token.
    """
    return MessageResponse(
        message="Logged out successfully. Please discard your access token."
    )
