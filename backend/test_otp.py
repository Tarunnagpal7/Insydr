import asyncio
from httpx import AsyncClient

async def run():
    async with AsyncClient() as client:
        # We need an auth token!
        login = await client.post("http://127.0.0.1:8000/api/v1/auth/login", data={"username": "agent-test-user-abcd1@test.com", "password": "SecurePass123!"})
        token = login.json().get("access_token")
        
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        resp = await client.post("http://127.0.0.1:8000/api/v1/agents/1aafb95c-b356-4429-b9b5-cb6c8c97eb4b/cta-email/send-otp", headers=headers, json={"email": "test@test.com"})
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")

asyncio.run(run())
