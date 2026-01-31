from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db.session import AsyncSessionLocal
from app.security.auth import decode_access_token
from app.db.repositories.auth_repository import UserRepository, OTPRepository
from app.services.auth_service import AuthService
from app.db.models.user import User


# HTTP Bearer token security
security = HTTPBearer()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    """Dependency to get auth service."""
    user_repo = UserRepository(db)
    otp_repo = OTPRepository(db)
    return AuthService(user_repo, otp_repo)


async def get_workspace_service(db: AsyncSession = Depends(get_db)):
    """Dependency to get workspace service."""
    from app.db.repositories.workspace_repository import WorkspaceRepository, WorkspaceMemberRepository
    from app.services.workspace_service import WorkspaceService
    
    workspace_repo = WorkspaceRepository(db)
    member_repo = WorkspaceMemberRepository(db)
    user_repo = UserRepository(db)
    return WorkspaceService(workspace_repo, member_repo, user_repo)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    """
    token = credentials.credentials
    
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(UUID(user_id))
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )

    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User | None:
    """
    Optional dependency to get current user (returns None if not authenticated).
    """
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None
