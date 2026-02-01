import secrets
import hashlib
from typing import List, Tuple, Optional
from uuid import UUID
from datetime import datetime

from app.db.models.api_key import ApiKey
from app.db.repositories.api_key_repository import ApiKeyRepository
from app.db.repositories.workspace_repository import WorkspaceRepository

class ApiKeyService:
    def __init__(
        self,
        api_key_repo: ApiKeyRepository,
        workspace_repo: WorkspaceRepository
    ):
        self.api_key_repo = api_key_repo
        self.workspace_repo = workspace_repo

    def _generate_key(self) -> Tuple[str, str, str]:
        """Generate a random key, its hash, and prefix."""
        # Key format: sk_live_<random_32_chars>
        raw_key = secrets.token_urlsafe(32)
        full_key = f"sk_live_{raw_key}"
        key_prefix = full_key[:12] # sk_live_XXXX
        
        # Hash the full key for storage
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()
        
        return full_key, key_hash, key_prefix

    async def create_api_key(
        self,
        workspace_id: UUID,
        user_id: UUID,
        name: str,
        allowed_domains: List[str]
    ) -> Tuple[ApiKey, str]:
        """Create a new API key. Returns (ApiKey, full_key)."""
        # Verify access
        role = await self.workspace_repo.get_user_role(workspace_id, user_id)
        if role not in ["OWNER", "ADMIN"]:
            raise PermissionError("Only owners and admins can create API keys")

        full_key, key_hash, key_prefix = self._generate_key()

        api_key = ApiKey(
            workspace_id=workspace_id,
            name=name,
            key_hash=key_hash,
            key_prefix=key_prefix,
            allowed_domains=allowed_domains,
            is_active=True
        )

        created_key = await self.api_key_repo.create(api_key)
        return created_key, full_key

    async def get_workspace_keys(
        self,
        workspace_id: UUID,
        user_id: UUID
    ) -> List[ApiKey]:
        """Get all API keys for a workspace."""
        has_access = await self.workspace_repo.user_has_access(workspace_id, user_id)
        if not has_access:
            raise PermissionError("You don't have access to this workspace")

        return await self.api_key_repo.get_by_workspace(workspace_id)

    async def revoke_api_key(
        self,
        workspace_id: UUID, 
        key_id: UUID,
        user_id: UUID
    ) -> bool:
        """Revoke (delete) an API key."""
        role = await self.workspace_repo.get_user_role(workspace_id, user_id)
        if role not in ["OWNER", "ADMIN"]:
            raise PermissionError("Only owners and admins can revoke API keys")

        # Verify key belongs to workspace
        key = await self.api_key_repo.get_by_id(key_id)
        if not key or key.workspace_id != workspace_id:
            raise ValueError("API key not found")

        return await self.api_key_repo.delete(key_id)

    async def update_api_key(
        self,
        workspace_id: UUID,
        key_id: UUID,
        user_id: UUID,
        name: Optional[str] = None,
        allowed_domains: Optional[List[str]] = None,
        is_active: Optional[bool] = None
    ) -> ApiKey:
        """Update API key details."""
        role = await self.workspace_repo.get_user_role(workspace_id, user_id)
        if role not in ["OWNER", "ADMIN"]:
            raise PermissionError("Only owners and admins can update API keys")

        key = await self.api_key_repo.get_by_id(key_id)
        if not key or key.workspace_id != workspace_id:
            raise ValueError("API key not found")

        if name is not None:
            key.name = name
        if allowed_domains is not None:
            key.allowed_domains = allowed_domains
        if is_active is not None:
            key.is_active = is_active

        return await self.api_key_repo.update(key)

    async def validate_api_key(self, full_key: str, domain: Optional[str] = None) -> Optional[ApiKey]:
        """Validate an API key and optionally its domain."""
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()
        key = await self.api_key_repo.get_by_hash(key_hash)

        if not key or not key.is_active:
            return None

        if key.allowed_domains and domain:
             # Basic domain check logic
             # If allowed_domains is empty, allow all (or maybe strict? user requirement says whitelist)
             # If user set whitelist, we enforce it.
             # Logic: if allowed_domains is not empty, domain must match one.
             if domain not in key.allowed_domains:
                 # TODO: Add wildcard support or cleaner matching
                 return None
        
        # Update usage stats (async fire and forget usually, but here simple)
        key.last_used_at = datetime.utcnow()
        key.requests_count += 1
        await self.api_key_repo.update(key) # This commits! might be slow for every request. Ideally background task.
        
        return key
