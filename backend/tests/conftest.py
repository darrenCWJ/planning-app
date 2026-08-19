import asyncio
from typing import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = settings.database_url.replace("/planapp", "/planapp_test")

engine_test = create_async_engine(TEST_DATABASE_URL, echo=False)
async_session_test = async_sessionmaker(engine_test, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def setup_db():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_test() as session:
        yield session


@pytest.fixture
async def client(setup_db: None, db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def workspace_id(client: AsyncClient, auth_headers: dict) -> str:
    resp = await client.post(
        "/api/workspaces",
        json={"name": "Test WS", "slug": "test-ws"},
        headers=auth_headers,
    )
    return resp.json()["data"]["id"]


@pytest.fixture
async def project_id(client: AsyncClient, auth_headers: dict, workspace_id: str) -> str:
    resp = await client.post(
        f"/api/workspaces/{workspace_id}/projects",
        json={"name": "Test Project", "key": "TP", "description": ""},
        headers=auth_headers,
    )
    return resp.json()["data"]["id"]


@pytest.fixture
async def auth_headers(client: AsyncClient) -> dict:
    resp = await client.post(
        "/api/auth/register",
        json={
            "email": "fixture@example.com",
            "password": "testpass123",
            "full_name": "Fixture User",
        },
    )
    token = resp.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}
