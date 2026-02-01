from typing import Optional, List
from uuid import UUID
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.api_key import ApiKey

class ApiKeyRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, api_key: ApiKey) -> ApiKey:
        self.db.add(api_key)
        await self.db.commit()
        await self.db.refresh(api_key)
        return api_key

    async def get_by_id(self, key_id: UUID) -> Optional[ApiKey]:
        result = await self.db.execute(
            select(ApiKey).where(ApiKey.id == key_id)
        )
        return result.scalar_one_or_none()

    async def get_by_workspace(self, workspace_id: UUID) -> List[ApiKey]:
        result = await self.db.execute(
            select(ApiKey)
            .where(ApiKey.workspace_id == workspace_id)
            .order_by(ApiKey.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_hash(self, key_hash: str) -> Optional[ApiKey]:
        result = await self.db.execute(
            select(ApiKey).where(ApiKey.key_hash == key_hash)
        )
        return result.scalar_one_or_none()

    async def update(self, api_key: ApiKey) -> ApiKey:
        await self.db.commit()
        await self.db.refresh(api_key)
        return api_key

    async def delete(self, key_id: UUID) -> bool:
        api_key = await self.get_by_id(key_id)
        if api_key:
            await self.db.delete(api_key)
            await self.db.commit()
            return True
        return False
