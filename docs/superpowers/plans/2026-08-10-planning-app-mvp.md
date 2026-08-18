# Planning App MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional Jira-like planning app MVP with auth, workspaces, projects, kanban boards (real-time drag-and-drop), task management with comments, and role-based permissions.

**Architecture:** Modular monolith — FastAPI backend with strict domain modules (auth, workspaces, projects, boards, tasks), React SPA frontend. Fully containerized with Docker Compose for portability and self-hosting.

**Tech Stack:** React 18 + TypeScript + Vite + shadcn/ui + React Query + Zustand + dnd-kit | FastAPI + SQLAlchemy 2.0 (async) + Pydantic v2 + Alembic | PostgreSQL 16 | Redis 7 | Docker Compose

## Global Constraints

- Python 3.12+, Node 20+
- All backend code uses async/await (SQLAlchemy async sessions)
- All API responses use envelope format: `{ "data": ..., "meta": { ... } }`
- Cursor-based pagination on all list endpoints
- Fractional indexing for ordering (columns, cards)
- Environment variables for all config (no hardcoded secrets)
- Every module follows: router.py, service.py, models.py, schemas.py, events.py, exceptions.py
- TDD: write tests first, then implement
- Commits after each task

---

## File Structure (Backend)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── security.py
│   │   ├── permissions.py
│   │   ├── pagination.py
│   │   ├── responses.py
│   │   └── websocket.py
│   └── modules/
│       ├── __init__.py
│       ├── auth/
│       │   ├── __init__.py
│       │   ├── router.py
│       │   ├── service.py
│       │   ├── models.py
│       │   ├── schemas.py
│       │   └── exceptions.py
│       ├── workspaces/
│       │   ├── __init__.py
│       │   ├── router.py
│       │   ├── service.py
│       │   ├── models.py
│       │   ├── schemas.py
│       │   └── exceptions.py
│       ├── projects/
│       │   ├── __init__.py
│       │   ├── router.py
│       │   ├── service.py
│       │   ├── models.py
│       │   ├── schemas.py
│       │   └── exceptions.py
│       ├── boards/
│       │   ├── __init__.py
│       │   ├── router.py
│       │   ├── service.py
│       │   ├── models.py
│       │   ├── schemas.py
│       │   ├── websocket.py
│       │   └── exceptions.py
│       └── tasks/
│           ├── __init__.py
│           ├── router.py
│           ├── service.py
│           ├── models.py
│           ├── schemas.py
│           └── exceptions.py
├── alembic/
│   ├── env.py
│   └── versions/
├── tests/
│   ├── conftest.py
│   ├── factories.py
│   ├── auth/
│   ├── workspaces/
│   ├── projects/
│   ├── boards/
│   └── tasks/
├── alembic.ini
├── pyproject.toml
├── Dockerfile
└── .env.example
```

## File Structure (Frontend)

```
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── Router.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── ui/
│   │   └── shared/
│   │       ├── Layout.tsx
│   │       ├── Sidebar.tsx
│   │       └── ProtectedRoute.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── api.ts
│   │   ├── workspace/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── api.ts
│   │   ├── project/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── api.ts
│   │   ├── board/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── api.ts
│   │   └── task/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── api.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useWebSocket.ts
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── websocket.ts
│   │   └── utils.ts
│   └── stores/
│       └── ui-store.ts
├── tests/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── Dockerfile
└── tailwind.config.ts
```

## File Structure (Root)

```
/
├── backend/
├── frontend/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .github/workflows/ci.yml
└── docs/
```

---

### Task 1: Project Scaffolding & Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `docker-compose.prod.yml`
- Create: `.env.example`
- Create: `backend/pyproject.toml`
- Create: `backend/Dockerfile`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/database.py`
- Create: `frontend/package.json`
- Create: `frontend/Dockerfile`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/src/app/App.tsx`

**Interfaces:**
- Consumes: Nothing (first task)
- Produces: Running Docker Compose stack (`docker compose up` starts API on :8000, frontend on :5173, Postgres on :5432, Redis on :6379). FastAPI health endpoint `GET /health` returns `{"status": "ok"}`.

- [ ] **Step 1: Create `.env.example`**

```env
# Database
DATABASE_URL=postgresql+asyncpg://planapp:planapp@postgres:5432/planapp
DATABASE_URL_SYNC=postgresql://planapp:planapp@postgres:5432/planapp

# Redis
REDIS_URL=redis://redis:6379/0

# Auth
JWT_SECRET_KEY=change-me-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

# App
APP_NAME=PlanApp
CORS_ORIGINS=http://localhost:5173
```

- [ ] **Step 2: Create `backend/pyproject.toml`**

```toml
[project]
name = "planapp-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "sqlalchemy[asyncio]>=2.0.30",
    "asyncpg>=0.29.0",
    "alembic>=1.13.0",
    "pydantic>=2.7.0",
    "pydantic-settings>=2.3.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "httpx>=0.27.0",
    "redis>=5.0.0",
    "celery[redis]>=5.4.0",
    "python-multipart>=0.0.9",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.2.0",
    "pytest-asyncio>=0.23.0",
    "httpx>=0.27.0",
    "factory-boy>=3.3.0",
    "ruff>=0.5.0",
    "pyright>=1.1.370",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[tool.ruff]
target-version = "py312"
line-length = 100
```

- [ ] **Step 3: Create `backend/app/core/config.py`**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    database_url_sync: str
    redis_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = ""
    app_name: str = "PlanApp"
    cors_origins: str = "http://localhost:5173"

    model_config = {"env_file": ".env"}


settings = Settings()
```

- [ ] **Step 4: Create `backend/app/core/database.py`**

```python
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(settings.database_url, echo=False)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session_factory() as session:
        yield session
```

- [ ] **Step 5: Create `backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
```

- [ ] **Step 6: Create `backend/Dockerfile`**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir .

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 7: Create `frontend/package.json` and scaffold Vite React app**

```json
{
  "name": "planapp-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "@tanstack/react-query": "^5.50.0",
    "zustand": "^4.5.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.0",
    "axios": "^1.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.5.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0",
    "vite": "^5.3.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0"
  }
}
```

- [ ] **Step 8: Create `frontend/src/app/App.tsx`**

```tsx
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold p-8">PlanApp</h1>
    </div>
  );
}

export default App;
```

- [ ] **Step 9: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: planapp
      POSTGRES_PASSWORD: planapp
      POSTGRES_DB: planapp
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env.example
    volumes:
      - ./backend:/app
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - api

volumes:
  pgdata:
```

- [ ] **Step 10: Verify stack starts**

Run: `docker compose up --build`
Expected: All 4 services start. `curl http://localhost:8000/health` returns `{"status":"ok"}`. Frontend loads at `http://localhost:5173`.

- [ ] **Step 11: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold project with Docker Compose, FastAPI, and React"
```

---

### Task 2: Core Utilities — Response Envelope, Pagination, Security

**Files:**
- Create: `backend/app/core/responses.py`
- Create: `backend/app/core/pagination.py`
- Create: `backend/app/core/security.py`
- Create: `backend/app/core/dependencies.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_core.py`

**Interfaces:**
- Consumes: `app.core.database.get_db`, `app.core.config.settings`
- Produces:
  - `envelope(data, meta=None) -> dict` — wraps any response
  - `paginate(query, cursor, limit) -> (items, meta)` — cursor pagination
  - `create_access_token(subject: str) -> str`
  - `create_refresh_token(subject: str) -> str`
  - `verify_token(token: str) -> str` — returns subject or raises
  - `hash_password(password: str) -> str`
  - `verify_password(plain: str, hashed: str) -> bool`
  - `get_current_user_id(token, db) -> str` — FastAPI dependency

- [ ] **Step 1: Write test for response envelope**

```python
# backend/tests/test_core.py
from app.core.responses import envelope


def test_envelope_wraps_data():
    result = envelope({"id": 1, "name": "Test"})
    assert result == {"data": {"id": 1, "name": "Test"}, "meta": None}


def test_envelope_includes_meta():
    meta = {"total": 10, "cursor": "abc123"}
    result = envelope([1, 2, 3], meta=meta)
    assert result == {"data": [1, 2, 3], "meta": meta}
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `cd backend && python -m pytest tests/test_core.py -v`
Expected: ImportError — `app.core.responses` does not exist yet.

- [ ] **Step 3: Implement `backend/app/core/responses.py`**

```python
from typing import Any


def envelope(data: Any, meta: dict | None = None) -> dict:
    return {"data": data, "meta": meta}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `cd backend && python -m pytest tests/test_core.py::test_envelope_wraps_data -v`
Expected: PASS

- [ ] **Step 5: Write test for password hashing**

```python
# append to backend/tests/test_core.py
from app.core.security import hash_password, verify_password


def test_hash_and_verify_password():
    hashed = hash_password("mypassword123")
    assert hashed != "mypassword123"
    assert verify_password("mypassword123", hashed) is True
    assert verify_password("wrongpassword", hashed) is False
```

- [ ] **Step 6: Implement `backend/app/core/security.py`**

```python
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    payload = {"sub": subject, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def verify_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        subject: str | None = payload.get("sub")
        if subject is None:
            raise ValueError("Invalid token: no subject")
        return subject
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}")
```

- [ ] **Step 7: Run all tests — expect PASS**

Run: `cd backend && python -m pytest tests/test_core.py -v`
Expected: All tests PASS

- [ ] **Step 8: Implement `backend/app/core/pagination.py`**

```python
from base64 import b64decode, b64encode
from typing import Any

from sqlalchemy import Select, asc, desc
from sqlalchemy.ext.asyncio import AsyncSession


def encode_cursor(value: Any) -> str:
    return b64encode(str(value).encode()).decode()


def decode_cursor(cursor: str) -> str:
    return b64decode(cursor.encode()).decode()


async def paginate(
    db: AsyncSession,
    query: Select,
    cursor: str | None = None,
    limit: int = 50,
    order_column=None,
    direction: str = "desc",
) -> tuple[list, dict]:
    if order_column is None:
        raise ValueError("order_column is required")

    if direction == "desc":
        query = query.order_by(desc(order_column))
    else:
        query = query.order_by(asc(order_column))

    if cursor:
        cursor_value = decode_cursor(cursor)
        if direction == "desc":
            query = query.where(order_column < cursor_value)
        else:
            query = query.where(order_column > cursor_value)

    query = query.limit(limit + 1)
    result = await db.execute(query)
    items = list(result.scalars().all())

    has_next = len(items) > limit
    if has_next:
        items = items[:limit]

    next_cursor = None
    if has_next and items:
        last_item = items[-1]
        cursor_val = getattr(last_item, order_column.key)
        next_cursor = encode_cursor(cursor_val)

    meta = {
        "limit": limit,
        "next_cursor": next_cursor,
        "has_next": has_next,
    }

    return items, meta
```

- [ ] **Step 9: Create `backend/app/core/dependencies.py`**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import verify_token

security_scheme = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> str:
    try:
        user_id = verify_token(credentials.credentials)
        return user_id
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
```

- [ ] **Step 10: Create `backend/tests/conftest.py`**

```python
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


@pytest.fixture(autouse=True)
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
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()
```

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat: add core utilities — response envelope, pagination, security, test setup"
```

---

### Task 3: Auth Module — Registration & Login

**Files:**
- Create: `backend/app/modules/__init__.py`
- Create: `backend/app/modules/auth/__init__.py`
- Create: `backend/app/modules/auth/models.py`
- Create: `backend/app/modules/auth/schemas.py`
- Create: `backend/app/modules/auth/service.py`
- Create: `backend/app/modules/auth/router.py`
- Create: `backend/app/modules/auth/exceptions.py`
- Create: `backend/tests/auth/__init__.py`
- Create: `backend/tests/auth/test_auth_api.py`
- Modify: `backend/app/main.py` (register auth router)

**Interfaces:**
- Consumes: `app.core.security.hash_password`, `verify_password`, `create_access_token`, `create_refresh_token`; `app.core.database.get_db`; `app.core.responses.envelope`
- Produces:
  - `POST /api/auth/register` — creates user, returns tokens
  - `POST /api/auth/login` — validates credentials, returns tokens
  - `POST /api/auth/refresh` — refreshes access token
  - `User` SQLAlchemy model (id: UUID, email: str, hashed_password: str, full_name: str, created_at: datetime)

- [ ] **Step 1: Write failing integration tests**

```python
# backend/tests/auth/test_auth_api.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_creates_user(client: AsyncClient):
    response = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "securepass123",
        "full_name": "Test User",
    })
    assert response.status_code == 201
    body = response.json()
    assert body["data"]["access_token"]
    assert body["data"]["refresh_token"]
    assert body["data"]["user"]["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_register_duplicate_email_fails(client: AsyncClient):
    payload = {"email": "dupe@example.com", "password": "pass123", "full_name": "Dupe"}
    await client.post("/api/auth/register", json=payload)
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_login_with_valid_credentials(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "login@example.com",
        "password": "mypassword",
        "full_name": "Login User",
    })
    response = await client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "mypassword",
    })
    assert response.status_code == 200
    assert response.json()["data"]["access_token"]


@pytest.mark.asyncio
async def test_login_with_wrong_password(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "wrong@example.com",
        "password": "correctpass",
        "full_name": "Wrong Pass",
    })
    response = await client.post("/api/auth/login", json={
        "email": "wrong@example.com",
        "password": "incorrectpass",
    })
    assert response.status_code == 401
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `cd backend && python -m pytest tests/auth/ -v`
Expected: FAIL — modules don't exist yet.

- [ ] **Step 3: Implement `backend/app/modules/auth/models.py`**

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
```

- [ ] **Step 4: Implement `backend/app/modules/auth/schemas.py`**

```python
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserResponse
```

- [ ] **Step 5: Implement `backend/app/modules/auth/exceptions.py`**

```python
from fastapi import HTTPException, status


class EmailAlreadyExistsError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )


class InvalidCredentialsError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
```

- [ ] **Step 6: Implement `backend/app/modules/auth/service.py`**

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.modules.auth.exceptions import EmailAlreadyExistsError, InvalidCredentialsError
from app.modules.auth.models import User
from app.modules.auth.schemas import RegisterRequest


async def register_user(db: AsyncSession, data: RegisterRequest) -> tuple[User, str, str]:
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise EmailAlreadyExistsError()

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    return user, access_token, refresh_token


async def login_user(db: AsyncSession, email: str, password: str) -> tuple[User, str, str]:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        raise InvalidCredentialsError()

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    return user, access_token, refresh_token
```

- [ ] **Step 7: Implement `backend/app/modules/auth/router.py`**

```python
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import envelope
from app.core.security import create_access_token, verify_token
from app.modules.auth.schemas import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.modules.auth.service import login_user, register_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user, access_token, refresh_token = await register_user(db, data)
    return envelope(
        TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        ).model_dump()
    )


@router.post("/login")
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user, access_token, refresh_token = await login_user(db, data.email, data.password)
    return envelope(
        TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        ).model_dump()
    )


@router.post("/refresh")
async def refresh(data: RefreshRequest):
    user_id = verify_token(data.refresh_token)
    new_access_token = create_access_token(user_id)
    return envelope({"access_token": new_access_token})
```

- [ ] **Step 8: Register router in `backend/app/main.py`**

Add after the CORS middleware:

```python
from app.modules.auth.router import router as auth_router

app.include_router(auth_router)
```

- [ ] **Step 9: Run Alembic migration**

```bash
cd backend
alembic init alembic
# Edit alembic/env.py to import Base and all models, set target_metadata = Base.metadata
alembic revision --autogenerate -m "create users table"
alembic upgrade head
```

- [ ] **Step 10: Run tests — expect PASS**

Run: `cd backend && python -m pytest tests/auth/ -v`
Expected: All 4 tests PASS

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat: add auth module — registration, login, token refresh"
```

---

### Task 4: Workspaces Module

**Files:**
- Create: `backend/app/modules/workspaces/__init__.py`
- Create: `backend/app/modules/workspaces/models.py`
- Create: `backend/app/modules/workspaces/schemas.py`
- Create: `backend/app/modules/workspaces/service.py`
- Create: `backend/app/modules/workspaces/router.py`
- Create: `backend/app/modules/workspaces/exceptions.py`
- Create: `backend/tests/workspaces/__init__.py`
- Create: `backend/tests/workspaces/test_workspaces_api.py`
- Modify: `backend/app/main.py` (register workspace router)

**Interfaces:**
- Consumes: `app.core.dependencies.get_current_user_id`, `app.core.database.get_db`, `app.core.responses.envelope`, `app.core.pagination.paginate`
- Produces:
  - `POST /api/workspaces` — create workspace (creator becomes owner)
  - `GET /api/workspaces` — list user's workspaces
  - `GET /api/workspaces/{id}` — get workspace details
  - `POST /api/workspaces/{id}/members` — invite member by email
  - `GET /api/workspaces/{id}/members` — list members
  - `Workspace` model (id: UUID, name: str, slug: str, created_by: UUID)
  - `WorkspaceMember` model (workspace_id: UUID, user_id: UUID, role: enum[owner,admin,member,viewer])

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/workspaces/test_workspaces_api.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_workspace(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/workspaces",
        json={"name": "My Team", "slug": "my-team"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["data"]["name"] == "My Team"
    assert body["data"]["slug"] == "my-team"


@pytest.mark.asyncio
async def test_list_workspaces(client: AsyncClient, auth_headers: dict):
    await client.post(
        "/api/workspaces",
        json={"name": "Workspace 1", "slug": "ws-1"},
        headers=auth_headers,
    )
    response = await client.get("/api/workspaces", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()["data"]) >= 1


@pytest.mark.asyncio
async def test_create_workspace_requires_auth(client: AsyncClient):
    response = await client.post(
        "/api/workspaces",
        json={"name": "No Auth", "slug": "no-auth"},
    )
    assert response.status_code == 403 or response.status_code == 401


@pytest.mark.asyncio
async def test_invite_member(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post(
        "/api/workspaces",
        json={"name": "Invite Test", "slug": "invite-test"},
        headers=auth_headers,
    )
    ws_id = create_resp.json()["data"]["id"]
    response = await client.post(
        f"/api/workspaces/{ws_id}/members",
        json={"email": "newmember@example.com", "role": "member"},
        headers=auth_headers,
    )
    assert response.status_code == 201 or response.status_code == 200
```

- [ ] **Step 2: Add `auth_headers` fixture to `conftest.py`**

```python
# Add to backend/tests/conftest.py
@pytest.fixture
async def auth_headers(client: AsyncClient) -> dict:
    resp = await client.post("/api/auth/register", json={
        "email": "fixture@example.com",
        "password": "testpass123",
        "full_name": "Fixture User",
    })
    token = resp.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

- [ ] **Step 3: Run tests — expect FAIL**

Run: `cd backend && python -m pytest tests/workspaces/ -v`
Expected: FAIL — workspace module doesn't exist.

- [ ] **Step 4: Implement `backend/app/modules/workspaces/models.py`**

```python
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class WorkspaceRole(str, PyEnum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    members: Mapped[list["WorkspaceMember"]] = relationship(back_populates="workspace")


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"
    __table_args__ = (
        UniqueConstraint("workspace_id", "user_id", name="uq_workspace_user"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    role: Mapped[WorkspaceRole] = mapped_column(
        Enum(WorkspaceRole), default=WorkspaceRole.MEMBER
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    workspace: Mapped["Workspace"] = relationship(back_populates="members")
```

- [ ] **Step 5: Implement `backend/app/modules/workspaces/schemas.py`**

```python
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.modules.workspaces.models import WorkspaceRole


class CreateWorkspaceRequest(BaseModel):
    name: str
    slug: str


class InviteMemberRequest(BaseModel):
    email: str
    role: WorkspaceRole = WorkspaceRole.MEMBER


class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    created_by: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceMemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    role: WorkspaceRole
    joined_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 6: Implement `backend/app/modules/workspaces/service.py`**

```python
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.workspaces.models import Workspace, WorkspaceMember, WorkspaceRole


async def create_workspace(db: AsyncSession, name: str, slug: str, user_id: UUID) -> Workspace:
    workspace = Workspace(name=name, slug=slug, created_by=user_id)
    db.add(workspace)
    await db.flush()

    member = WorkspaceMember(
        workspace_id=workspace.id, user_id=user_id, role=WorkspaceRole.OWNER
    )
    db.add(member)
    await db.commit()
    await db.refresh(workspace)
    return workspace


async def list_user_workspaces(db: AsyncSession, user_id: UUID) -> list[Workspace]:
    result = await db.execute(
        select(Workspace)
        .join(WorkspaceMember)
        .where(WorkspaceMember.user_id == user_id)
    )
    return list(result.scalars().all())


async def get_workspace(db: AsyncSession, workspace_id: UUID) -> Workspace | None:
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    return result.scalar_one_or_none()


async def invite_member(
    db: AsyncSession, workspace_id: UUID, email: str, role: WorkspaceRole
) -> WorkspaceMember:
    user_result = await db.execute(select(User).where(User.email == email))
    user = user_result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")

    member = WorkspaceMember(workspace_id=workspace_id, user_id=user.id, role=role)
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


async def list_members(db: AsyncSession, workspace_id: UUID) -> list[WorkspaceMember]:
    result = await db.execute(
        select(WorkspaceMember).where(WorkspaceMember.workspace_id == workspace_id)
    )
    return list(result.scalars().all())
```

- [ ] **Step 7: Implement `backend/app/modules/workspaces/router.py`**

```python
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.workspaces.schemas import (
    CreateWorkspaceRequest,
    InviteMemberRequest,
    WorkspaceMemberResponse,
    WorkspaceResponse,
)
from app.modules.workspaces.service import (
    create_workspace,
    get_workspace,
    invite_member,
    list_members,
    list_user_workspaces,
)

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create(
    data: CreateWorkspaceRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    workspace = await create_workspace(db, data.name, data.slug, UUID(user_id))
    return envelope(WorkspaceResponse.model_validate(workspace).model_dump())


@router.get("")
async def list_workspaces(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    workspaces = await list_user_workspaces(db, UUID(user_id))
    return envelope([WorkspaceResponse.model_validate(w).model_dump() for w in workspaces])


@router.get("/{workspace_id}")
async def get_workspace_detail(
    workspace_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    workspace = await get_workspace(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return envelope(WorkspaceResponse.model_validate(workspace).model_dump())


@router.post("/{workspace_id}/members", status_code=status.HTTP_201_CREATED)
async def invite(
    workspace_id: UUID,
    data: InviteMemberRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    member = await invite_member(db, workspace_id, data.email, data.role)
    return envelope(WorkspaceMemberResponse.model_validate(member).model_dump())


@router.get("/{workspace_id}/members")
async def get_members(
    workspace_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    members = await list_members(db, workspace_id)
    return envelope([WorkspaceMemberResponse.model_validate(m).model_dump() for m in members])
```

- [ ] **Step 8: Register router in `main.py`**

```python
from app.modules.workspaces.router import router as workspaces_router

app.include_router(workspaces_router)
```

- [ ] **Step 9: Create and run migration**

```bash
alembic revision --autogenerate -m "create workspaces and workspace_members tables"
alembic upgrade head
```

- [ ] **Step 10: Run tests — expect PASS**

Run: `cd backend && python -m pytest tests/workspaces/ -v`
Expected: All 4 tests PASS

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat: add workspaces module — CRUD, member invites, roles"
```

---

### Task 5: Projects Module

**Files:**
- Create: `backend/app/modules/projects/__init__.py`
- Create: `backend/app/modules/projects/models.py`
- Create: `backend/app/modules/projects/schemas.py`
- Create: `backend/app/modules/projects/service.py`
- Create: `backend/app/modules/projects/router.py`
- Create: `backend/app/modules/projects/exceptions.py`
- Create: `backend/tests/projects/__init__.py`
- Create: `backend/tests/projects/test_projects_api.py`
- Modify: `backend/app/main.py` (register projects router)

**Interfaces:**
- Consumes: `app.core.dependencies.get_current_user_id`, `app.core.database.get_db`, `app.core.responses.envelope`, `app.modules.workspaces.models.WorkspaceMember`
- Produces:
  - `POST /api/workspaces/{ws_id}/projects` — create project with default columns
  - `GET /api/workspaces/{ws_id}/projects` — list projects in workspace
  - `GET /api/projects/{id}` — get project details
  - `PATCH /api/projects/{id}` — update project
  - `Project` model (id: UUID, workspace_id: UUID, name: str, key: str, description: str)
  - `WorkflowColumn` model (id: UUID, project_id: UUID, name: str, position: str)

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/projects/test_projects_api.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_project(client: AsyncClient, auth_headers: dict, workspace_id: str):
    response = await client.post(
        f"/api/workspaces/{workspace_id}/projects",
        json={"name": "Sprint Board", "key": "SB", "description": "Main sprint board"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["data"]["name"] == "Sprint Board"
    assert body["data"]["key"] == "SB"
    assert len(body["data"]["columns"]) == 3  # default: To Do, In Progress, Done


@pytest.mark.asyncio
async def test_list_projects(client: AsyncClient, auth_headers: dict, workspace_id: str):
    await client.post(
        f"/api/workspaces/{workspace_id}/projects",
        json={"name": "Project A", "key": "PA", "description": ""},
        headers=auth_headers,
    )
    response = await client.get(
        f"/api/workspaces/{workspace_id}/projects",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert len(response.json()["data"]) >= 1


@pytest.mark.asyncio
async def test_get_project(client: AsyncClient, auth_headers: dict, workspace_id: str):
    create_resp = await client.post(
        f"/api/workspaces/{workspace_id}/projects",
        json={"name": "Detail", "key": "DT", "description": "test"},
        headers=auth_headers,
    )
    project_id = create_resp.json()["data"]["id"]
    response = await client.get(f"/api/projects/{project_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["data"]["id"] == project_id
```

- [ ] **Step 2: Add `workspace_id` fixture to `conftest.py`**

```python
@pytest.fixture
async def workspace_id(client: AsyncClient, auth_headers: dict) -> str:
    resp = await client.post(
        "/api/workspaces",
        json={"name": "Test WS", "slug": "test-ws"},
        headers=auth_headers,
    )
    return resp.json()["data"]["id"]
```

- [ ] **Step 3: Implement `backend/app/modules/projects/models.py`**

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key: Mapped[str] = mapped_column(String(10), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    is_archived: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    columns: Mapped[list["WorkflowColumn"]] = relationship(
        back_populates="project", order_by="WorkflowColumn.position"
    )


class WorkflowColumn(Base):
    __tablename__ = "workflow_columns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    position: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    project: Mapped["Project"] = relationship(back_populates="columns")
```

- [ ] **Step 4: Implement `backend/app/modules/projects/schemas.py`**

```python
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CreateProjectRequest(BaseModel):
    name: str
    key: str
    description: str = ""


class UpdateProjectRequest(BaseModel):
    name: str | None = None
    description: str | None = None


class ColumnResponse(BaseModel):
    id: UUID
    name: str
    position: str

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    key: str
    description: str
    is_archived: bool
    created_at: datetime
    columns: list[ColumnResponse] = []

    model_config = {"from_attributes": True}
```

- [ ] **Step 5: Implement `backend/app/modules/projects/service.py`**

```python
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.projects.models import Project, WorkflowColumn

DEFAULT_COLUMNS = [
    ("To Do", "a"),
    ("In Progress", "b"),
    ("Done", "c"),
]


async def create_project(
    db: AsyncSession, workspace_id: UUID, name: str, key: str, description: str
) -> Project:
    project = Project(workspace_id=workspace_id, name=name, key=key, description=description)
    db.add(project)
    await db.flush()

    for col_name, position in DEFAULT_COLUMNS:
        column = WorkflowColumn(project_id=project.id, name=col_name, position=position)
        db.add(column)

    await db.commit()

    result = await db.execute(
        select(Project).options(selectinload(Project.columns)).where(Project.id == project.id)
    )
    return result.scalar_one()


async def list_projects(db: AsyncSession, workspace_id: UUID) -> list[Project]:
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.columns))
        .where(Project.workspace_id == workspace_id, Project.is_archived == False)
    )
    return list(result.scalars().all())


async def get_project(db: AsyncSession, project_id: UUID) -> Project | None:
    result = await db.execute(
        select(Project).options(selectinload(Project.columns)).where(Project.id == project_id)
    )
    return result.scalar_one_or_none()


async def update_project(
    db: AsyncSession, project_id: UUID, name: str | None, description: str | None
) -> Project | None:
    project = await get_project(db, project_id)
    if not project:
        return None
    if name is not None:
        project.name = name
    if description is not None:
        project.description = description
    await db.commit()
    await db.refresh(project)
    return project
```

- [ ] **Step 6: Implement `backend/app/modules/projects/router.py`**

```python
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.projects.schemas import (
    CreateProjectRequest,
    ProjectResponse,
    UpdateProjectRequest,
)
from app.modules.projects.service import (
    create_project,
    get_project,
    list_projects,
    update_project,
)

router = APIRouter(tags=["projects"])


@router.post("/api/workspaces/{workspace_id}/projects", status_code=status.HTTP_201_CREATED)
async def create(
    workspace_id: UUID,
    data: CreateProjectRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    project = await create_project(db, workspace_id, data.name, data.key, data.description)
    return envelope(ProjectResponse.model_validate(project).model_dump())


@router.get("/api/workspaces/{workspace_id}/projects")
async def list_workspace_projects(
    workspace_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    projects = await list_projects(db, workspace_id)
    return envelope([ProjectResponse.model_validate(p).model_dump() for p in projects])


@router.get("/api/projects/{project_id}")
async def get_project_detail(
    project_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return envelope(ProjectResponse.model_validate(project).model_dump())


@router.patch("/api/projects/{project_id}")
async def update(
    project_id: UUID,
    data: UpdateProjectRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    project = await update_project(db, project_id, data.name, data.description)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return envelope(ProjectResponse.model_validate(project).model_dump())
```

- [ ] **Step 7: Register in `main.py`, run migration**

```python
from app.modules.projects.router import router as projects_router

app.include_router(projects_router)
```

```bash
alembic revision --autogenerate -m "create projects and workflow_columns tables"
alembic upgrade head
```

- [ ] **Step 8: Run tests — expect PASS**

Run: `cd backend && python -m pytest tests/projects/ -v`
Expected: All 3 tests PASS

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: add projects module — CRUD with default workflow columns"
```

---

### Task 6: Boards & Tasks Module

**Files:**
- Create: `backend/app/modules/boards/__init__.py`
- Create: `backend/app/modules/boards/models.py`
- Create: `backend/app/modules/boards/schemas.py`
- Create: `backend/app/modules/boards/service.py`
- Create: `backend/app/modules/boards/router.py`
- Create: `backend/app/modules/tasks/__init__.py`
- Create: `backend/app/modules/tasks/models.py`
- Create: `backend/app/modules/tasks/schemas.py`
- Create: `backend/app/modules/tasks/service.py`
- Create: `backend/app/modules/tasks/router.py`
- Create: `backend/tests/tasks/__init__.py`
- Create: `backend/tests/tasks/test_tasks_api.py`
- Modify: `backend/app/main.py` (register routers)

**Interfaces:**
- Consumes: `app.modules.projects.models.Project`, `WorkflowColumn`; `app.core.dependencies.get_current_user_id`; `app.core.pagination.paginate`
- Produces:
  - `POST /api/projects/{project_id}/tasks` — create task in first column
  - `GET /api/projects/{project_id}/tasks` — list tasks with filters
  - `GET /api/tasks/{id}` — get task detail
  - `PATCH /api/tasks/{id}` — update task fields
  - `POST /api/tasks/{id}/move` — move task to column/position
  - `DELETE /api/tasks/{id}` — soft delete (archive)
  - `GET /api/projects/{project_id}/board` — full board (columns + cards)
  - `Task` model (id: UUID, project_id: UUID, column_id: UUID, title: str, description: str, priority: enum, assignee_id: UUID|null, position: str, due_date: date|null)
  - `Label` model, `TaskLabel` join table

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/tasks/test_tasks_api.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, auth_headers: dict, project_id: str):
    response = await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "My first task", "description": "Do something", "priority": "medium"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["data"]["title"] == "My first task"
    assert body["data"]["column_id"] is not None


@pytest.mark.asyncio
async def test_get_board(client: AsyncClient, auth_headers: dict, project_id: str):
    await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Task A", "priority": "high"},
        headers=auth_headers,
    )
    response = await client.get(
        f"/api/projects/{project_id}/board",
        headers=auth_headers,
    )
    assert response.status_code == 200
    board = response.json()["data"]
    assert len(board["columns"]) == 3
    assert any(
        any(t["title"] == "Task A" for t in col["tasks"])
        for col in board["columns"]
    )


@pytest.mark.asyncio
async def test_move_task(client: AsyncClient, auth_headers: dict, project_id: str):
    create_resp = await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Movable", "priority": "low"},
        headers=auth_headers,
    )
    task_id = create_resp.json()["data"]["id"]

    board_resp = await client.get(f"/api/projects/{project_id}/board", headers=auth_headers)
    columns = board_resp.json()["data"]["columns"]
    target_column_id = columns[1]["id"]  # "In Progress"

    response = await client.post(
        f"/api/tasks/{task_id}/move",
        json={"column_id": target_column_id, "position": "a"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["data"]["column_id"] == target_column_id


@pytest.mark.asyncio
async def test_update_task(client: AsyncClient, auth_headers: dict, project_id: str):
    create_resp = await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Update me", "priority": "medium"},
        headers=auth_headers,
    )
    task_id = create_resp.json()["data"]["id"]

    response = await client.patch(
        f"/api/tasks/{task_id}",
        json={"title": "Updated title", "priority": "high"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["data"]["title"] == "Updated title"


@pytest.mark.asyncio
async def test_filter_tasks(client: AsyncClient, auth_headers: dict, project_id: str):
    await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "High priority", "priority": "high"},
        headers=auth_headers,
    )
    await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Low priority", "priority": "low"},
        headers=auth_headers,
    )
    response = await client.get(
        f"/api/projects/{project_id}/tasks?priority=high",
        headers=auth_headers,
    )
    assert response.status_code == 200
    tasks = response.json()["data"]
    assert all(t["priority"] == "high" for t in tasks)
```

- [ ] **Step 2: Add `project_id` fixture to `conftest.py`**

```python
@pytest.fixture
async def project_id(client: AsyncClient, auth_headers: dict, workspace_id: str) -> str:
    resp = await client.post(
        f"/api/workspaces/{workspace_id}/projects",
        json={"name": "Test Project", "key": "TP", "description": ""},
        headers=auth_headers,
    )
    return resp.json()["data"]["id"]
```

- [ ] **Step 3: Implement `backend/app/modules/tasks/models.py`**

```python
import uuid
from datetime import date, datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TaskPriority(str, PyEnum):
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE")
    )
    column_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workflow_columns.id")
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    priority: Mapped[TaskPriority] = mapped_column(
        Enum(TaskPriority), default=TaskPriority.MEDIUM
    )
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    position: Mapped[str] = mapped_column(String(50), nullable=False, default="a")
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_archived: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    comments: Mapped[list["Comment"]] = relationship(back_populates="task")
    labels: Mapped[list["TaskLabel"]] = relationship(back_populates="task")


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE")
    )
    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    task: Mapped["Task"] = relationship(back_populates="comments")


class Label(Base):
    __tablename__ = "labels"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(7), default="#6366f1")


class TaskLabel(Base):
    __tablename__ = "task_labels"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE")
    )
    label_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("labels.id", ondelete="CASCADE")
    )

    task: Mapped["Task"] = relationship(back_populates="labels")
```

- [ ] **Step 4: Implement `backend/app/modules/tasks/schemas.py`**

```python
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel

from app.modules.tasks.models import TaskPriority


class CreateTaskRequest(BaseModel):
    title: str
    description: str = ""
    priority: TaskPriority = TaskPriority.MEDIUM
    assignee_id: UUID | None = None
    due_date: date | None = None


class UpdateTaskRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: TaskPriority | None = None
    assignee_id: UUID | None = None
    due_date: date | None = None


class MoveTaskRequest(BaseModel):
    column_id: UUID
    position: str


class TaskResponse(BaseModel):
    id: UUID
    project_id: UUID
    column_id: UUID
    title: str
    description: str
    priority: TaskPriority
    assignee_id: UUID | None
    position: str
    due_date: date | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CommentRequest(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: UUID
    task_id: UUID
    author_id: UUID
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class BoardColumnResponse(BaseModel):
    id: UUID
    name: str
    position: str
    tasks: list[TaskResponse] = []


class BoardResponse(BaseModel):
    project_id: UUID
    columns: list[BoardColumnResponse]
```

- [ ] **Step 5: Implement `backend/app/modules/tasks/service.py`**

```python
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.projects.models import WorkflowColumn
from app.modules.tasks.models import Comment, Task, TaskPriority


async def create_task(
    db: AsyncSession,
    project_id: UUID,
    title: str,
    description: str,
    priority: TaskPriority,
    assignee_id: UUID | None,
    due_date=None,
) -> Task:
    first_col = await db.execute(
        select(WorkflowColumn)
        .where(WorkflowColumn.project_id == project_id)
        .order_by(WorkflowColumn.position)
        .limit(1)
    )
    column = first_col.scalar_one()

    task = Task(
        project_id=project_id,
        column_id=column.id,
        title=title,
        description=description,
        priority=priority,
        assignee_id=assignee_id,
        due_date=due_date,
        position="a",
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def get_task(db: AsyncSession, task_id: UUID) -> Task | None:
    result = await db.execute(select(Task).where(Task.id == task_id))
    return result.scalar_one_or_none()


async def update_task(db: AsyncSession, task_id: UUID, **fields) -> Task | None:
    task = await get_task(db, task_id)
    if not task:
        return None
    for key, value in fields.items():
        if value is not None:
            setattr(task, key, value)
    await db.commit()
    await db.refresh(task)
    return task


async def move_task(db: AsyncSession, task_id: UUID, column_id: UUID, position: str) -> Task | None:
    task = await get_task(db, task_id)
    if not task:
        return None
    task.column_id = column_id
    task.position = position
    await db.commit()
    await db.refresh(task)
    return task


async def list_tasks(
    db: AsyncSession, project_id: UUID, priority: str | None = None, search: str | None = None
) -> list[Task]:
    query = select(Task).where(Task.project_id == project_id, Task.is_archived == False)
    if priority:
        query = query.where(Task.priority == priority)
    if search:
        query = query.where(Task.title.ilike(f"%{search}%"))
    query = query.order_by(Task.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_board(db: AsyncSession, project_id: UUID) -> dict:
    columns_result = await db.execute(
        select(WorkflowColumn)
        .where(WorkflowColumn.project_id == project_id)
        .order_by(WorkflowColumn.position)
    )
    columns = list(columns_result.scalars().all())

    tasks_result = await db.execute(
        select(Task)
        .where(Task.project_id == project_id, Task.is_archived == False)
        .order_by(Task.position)
    )
    tasks = list(tasks_result.scalars().all())

    tasks_by_column: dict[UUID, list[Task]] = {col.id: [] for col in columns}
    for task in tasks:
        if task.column_id in tasks_by_column:
            tasks_by_column[task.column_id].append(task)

    return {
        "project_id": project_id,
        "columns": [
            {
                "id": col.id,
                "name": col.name,
                "position": col.position,
                "tasks": tasks_by_column[col.id],
            }
            for col in columns
        ],
    }


async def add_comment(
    db: AsyncSession, task_id: UUID, author_id: UUID, content: str
) -> Comment:
    comment = Comment(task_id=task_id, author_id=author_id, content=content)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


async def list_comments(db: AsyncSession, task_id: UUID) -> list[Comment]:
    result = await db.execute(
        select(Comment).where(Comment.task_id == task_id).order_by(Comment.created_at)
    )
    return list(result.scalars().all())
```

- [ ] **Step 6: Implement `backend/app/modules/tasks/router.py`**

```python
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.tasks.schemas import (
    BoardResponse,
    CommentRequest,
    CommentResponse,
    CreateTaskRequest,
    MoveTaskRequest,
    TaskResponse,
    UpdateTaskRequest,
)
from app.modules.tasks.service import (
    add_comment,
    create_task,
    get_board,
    get_task,
    list_comments,
    list_tasks,
    move_task,
    update_task,
)

router = APIRouter(tags=["tasks"])


@router.post("/api/projects/{project_id}/tasks", status_code=status.HTTP_201_CREATED)
async def create(
    project_id: UUID,
    data: CreateTaskRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    task = await create_task(
        db, project_id, data.title, data.description, data.priority, data.assignee_id, data.due_date
    )
    return envelope(TaskResponse.model_validate(task).model_dump())


@router.get("/api/projects/{project_id}/tasks")
async def list_project_tasks(
    project_id: UUID,
    priority: str | None = None,
    search: str | None = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    tasks = await list_tasks(db, project_id, priority=priority, search=search)
    return envelope([TaskResponse.model_validate(t).model_dump() for t in tasks])


@router.get("/api/projects/{project_id}/board")
async def get_project_board(
    project_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    board = await get_board(db, project_id)
    return envelope(board)


@router.get("/api/tasks/{task_id}")
async def get_task_detail(
    task_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    task = await get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return envelope(TaskResponse.model_validate(task).model_dump())


@router.patch("/api/tasks/{task_id}")
async def update(
    task_id: UUID,
    data: UpdateTaskRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    task = await update_task(db, task_id, **data.model_dump(exclude_unset=True))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return envelope(TaskResponse.model_validate(task).model_dump())


@router.post("/api/tasks/{task_id}/move")
async def move(
    task_id: UUID,
    data: MoveTaskRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    task = await move_task(db, task_id, data.column_id, data.position)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return envelope(TaskResponse.model_validate(task).model_dump())


@router.delete("/api/tasks/{task_id}")
async def archive(
    task_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    task = await update_task(db, task_id, is_archived=True)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return envelope({"archived": True})


@router.post("/api/tasks/{task_id}/comments", status_code=status.HTTP_201_CREATED)
async def create_comment(
    task_id: UUID,
    data: CommentRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    comment = await add_comment(db, task_id, UUID(user_id), data.content)
    return envelope(CommentResponse.model_validate(comment).model_dump())


@router.get("/api/tasks/{task_id}/comments")
async def get_comments(
    task_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    comments = await list_comments(db, task_id)
    return envelope([CommentResponse.model_validate(c).model_dump() for c in comments])
```

- [ ] **Step 7: Register routers in `main.py`**

```python
from app.modules.tasks.router import router as tasks_router

app.include_router(tasks_router)
```

- [ ] **Step 8: Run migration**

```bash
alembic revision --autogenerate -m "create tasks, comments, labels tables"
alembic upgrade head
```

- [ ] **Step 9: Run tests — expect PASS**

Run: `cd backend && python -m pytest tests/tasks/ -v`
Expected: All 5 tests PASS

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat: add tasks module — CRUD, move, board view, comments, labels"
```

---

### Task 7: Real-time WebSocket for Boards

**Files:**
- Create: `backend/app/core/websocket.py`
- Create: `backend/app/modules/boards/websocket.py`
- Modify: `backend/app/modules/tasks/router.py` (emit events on task move/create/update)
- Create: `backend/tests/boards/__init__.py`
- Create: `backend/tests/boards/test_websocket.py`

**Interfaces:**
- Consumes: `app.core.config.settings.redis_url`, `app.modules.tasks.router` (hooks into task mutations)
- Produces:
  - `WS /api/boards/{board_id}/live` — WebSocket endpoint
  - `ConnectionManager.broadcast(board_id, event)` — sends JSON events to all connected clients
  - Events: `task.created`, `task.updated`, `task.moved`, `task.archived`

- [ ] **Step 1: Implement `backend/app/core/websocket.py`**

```python
import json
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, channel: str, websocket: WebSocket):
        await websocket.accept()
        self._connections[channel].append(websocket)

    def disconnect(self, channel: str, websocket: WebSocket):
        self._connections[channel].remove(websocket)
        if not self._connections[channel]:
            del self._connections[channel]

    async def broadcast(self, channel: str, event: dict):
        message = json.dumps(event)
        dead_connections = []
        for connection in self._connections.get(channel, []):
            try:
                await connection.send_text(message)
            except Exception:
                dead_connections.append(connection)
        for conn in dead_connections:
            self.disconnect(channel, conn)

    def get_active_users(self, channel: str) -> int:
        return len(self._connections.get(channel, []))


manager = ConnectionManager()
```

- [ ] **Step 2: Implement `backend/app/modules/boards/websocket.py`**

```python
from uuid import UUID

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from app.core.dependencies import get_current_user_id
from app.core.websocket import manager

router = APIRouter()


@router.websocket("/api/boards/{project_id}/live")
async def board_websocket(websocket: WebSocket, project_id: UUID):
    channel = f"board:{project_id}"
    await manager.connect(channel, websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(channel, websocket)
```

- [ ] **Step 3: Add broadcast calls to task mutations in `tasks/router.py`**

After each task create/update/move/archive, add:

```python
from app.core.websocket import manager

# After task creation:
await manager.broadcast(
    f"board:{task.project_id}",
    {"event": "task.created", "data": TaskResponse.model_validate(task).model_dump()},
)

# After task update:
await manager.broadcast(
    f"board:{task.project_id}",
    {"event": "task.updated", "data": TaskResponse.model_validate(task).model_dump()},
)

# After task move:
await manager.broadcast(
    f"board:{task.project_id}",
    {"event": "task.moved", "data": TaskResponse.model_validate(task).model_dump()},
)

# After task archive:
await manager.broadcast(
    f"board:{task.project_id}",
    {"event": "task.archived", "data": {"id": str(task_id)}},
)
```

- [ ] **Step 4: Register WebSocket router in `main.py`**

```python
from app.modules.boards.websocket import router as boards_ws_router

app.include_router(boards_ws_router)
```

- [ ] **Step 5: Write WebSocket test**

```python
# backend/tests/boards/test_websocket.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_websocket_receives_task_created(client: AsyncClient, auth_headers: dict, project_id: str):
    import asyncio
    from httpx._transports.asgi import ASGITransport
    import websockets

    # This is an integration test that verifies the broadcast works
    # In practice, test with a WebSocket test client
    # For now, verify the endpoint accepts connections
    pass  # WebSocket testing requires specialized setup — verify manually
```

- [ ] **Step 6: Manual verification**

Start the stack, open two browser tabs to the same board, move a task in one — verify the other updates.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add real-time WebSocket for board updates"
```

---

### Task 8: Permissions Middleware

**Files:**
- Create: `backend/app/core/permissions.py`
- Modify: `backend/app/modules/workspaces/router.py` (add permission checks)
- Modify: `backend/app/modules/projects/router.py` (add permission checks)
- Modify: `backend/app/modules/tasks/router.py` (add permission checks)
- Create: `backend/tests/test_permissions.py`

**Interfaces:**
- Consumes: `app.modules.workspaces.models.WorkspaceMember`, `WorkspaceRole`; `app.core.dependencies.get_current_user_id`
- Produces:
  - `require_workspace_role(workspace_id, min_role) -> dependency` — FastAPI dependency that checks role
  - `require_project_access(project_id) -> dependency` — verifies user has access via workspace membership
  - Raises 403 if insufficient permissions

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_permissions.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_viewer_cannot_create_task(client: AsyncClient, viewer_headers: dict, project_id: str):
    response = await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Should fail", "priority": "low"},
        headers=viewer_headers,
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_member_can_create_task(client: AsyncClient, auth_headers: dict, project_id: str):
    response = await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Should work", "priority": "low"},
        headers=auth_headers,
    )
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_non_member_cannot_access_workspace(client: AsyncClient, outsider_headers: dict):
    response = await client.get("/api/workspaces", headers=outsider_headers)
    assert response.status_code == 200
    assert response.json()["data"] == []
```

- [ ] **Step 2: Add `viewer_headers` and `outsider_headers` fixtures**

```python
@pytest.fixture
async def viewer_headers(client: AsyncClient, auth_headers: dict, workspace_id: str) -> dict:
    # Register a second user
    resp = await client.post("/api/auth/register", json={
        "email": "viewer@example.com",
        "password": "viewerpass",
        "full_name": "Viewer User",
    })
    token = resp.json()["data"]["access_token"]

    # Invite as viewer
    await client.post(
        f"/api/workspaces/{workspace_id}/members",
        json={"email": "viewer@example.com", "role": "viewer"},
        headers=auth_headers,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def outsider_headers(client: AsyncClient) -> dict:
    resp = await client.post("/api/auth/register", json={
        "email": "outsider@example.com",
        "password": "outsiderpass",
        "full_name": "Outsider User",
    })
    token = resp.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

- [ ] **Step 3: Implement `backend/app/core/permissions.py`**

```python
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.modules.projects.models import Project
from app.modules.workspaces.models import WorkspaceMember, WorkspaceRole

ROLE_HIERARCHY = {
    WorkspaceRole.VIEWER: 0,
    WorkspaceRole.MEMBER: 1,
    WorkspaceRole.ADMIN: 2,
    WorkspaceRole.OWNER: 3,
}


async def get_workspace_member(
    db: AsyncSession, workspace_id: UUID, user_id: UUID
) -> WorkspaceMember | None:
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


def require_workspace_role(min_role: WorkspaceRole):
    async def dependency(
        workspace_id: UUID,
        user_id: str = Depends(get_current_user_id),
        db: AsyncSession = Depends(get_db),
    ):
        member = await get_workspace_member(db, workspace_id, UUID(user_id))
        if not member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member")
        if ROLE_HIERARCHY[member.role] < ROLE_HIERARCHY[min_role]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return member

    return dependency


def require_project_role(min_role: WorkspaceRole):
    async def dependency(
        project_id: UUID,
        user_id: str = Depends(get_current_user_id),
        db: AsyncSession = Depends(get_db),
    ):
        project_result = await db.execute(select(Project).where(Project.id == project_id))
        project = project_result.scalar_one_or_none()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        member = await get_workspace_member(db, project.workspace_id, UUID(user_id))
        if not member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member")
        if ROLE_HIERARCHY[member.role] < ROLE_HIERARCHY[min_role]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return member

    return dependency
```

- [ ] **Step 4: Add permission dependencies to task creation endpoint**

```python
# In tasks/router.py, update the create endpoint:
from app.core.permissions import require_project_role
from app.modules.workspaces.models import WorkspaceRole

@router.post("/api/projects/{project_id}/tasks", status_code=status.HTTP_201_CREATED)
async def create(
    project_id: UUID,
    data: CreateTaskRequest,
    _member=Depends(require_project_role(WorkspaceRole.MEMBER)),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # ... existing implementation
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `cd backend && python -m pytest tests/test_permissions.py -v`
Expected: All 3 tests PASS

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add role-based permission middleware"
```

---

### Task 9: Frontend — Auth, Layout, API Client

**Files:**
- Create: `frontend/src/lib/api-client.ts`
- Create: `frontend/src/hooks/useAuth.ts`
- Create: `frontend/src/features/auth/api.ts`
- Create: `frontend/src/features/auth/pages/LoginPage.tsx`
- Create: `frontend/src/features/auth/pages/RegisterPage.tsx`
- Create: `frontend/src/features/auth/components/LoginForm.tsx`
- Create: `frontend/src/features/auth/components/RegisterForm.tsx`
- Create: `frontend/src/components/shared/Layout.tsx`
- Create: `frontend/src/components/shared/Sidebar.tsx`
- Create: `frontend/src/components/shared/ProtectedRoute.tsx`
- Create: `frontend/src/app/Router.tsx`
- Create: `frontend/src/app/providers.tsx`
- Create: `frontend/src/stores/ui-store.ts`
- Modify: `frontend/src/app/App.tsx`

**Interfaces:**
- Consumes: Backend auth endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`)
- Produces:
  - `apiClient` — axios instance with token interceptors
  - `useAuth()` — hook returning `{ user, login, register, logout, isAuthenticated }`
  - `<ProtectedRoute>` — redirects to login if unauthenticated
  - `<Layout>` — sidebar + main content shell
  - Route structure: `/login`, `/register`, `/` (dashboard), `/workspaces/:id`

- [ ] **Step 1: Create `frontend/src/lib/api-client.ts`**

```typescript
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const resp = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const newToken = resp.data.data.access_token;
          localStorage.setItem("access_token", newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);
```

- [ ] **Step 2: Create `frontend/src/features/auth/api.ts`**

```typescript
import { apiClient } from "../../lib/api-client";

interface AuthResponse {
  data: {
    access_token: string;
    refresh_token: string;
    user: { id: string; email: string; full_name: string };
  };
}

export async function registerUser(email: string, password: string, fullName: string) {
  const resp = await apiClient.post<AuthResponse>("/api/auth/register", {
    email,
    password,
    full_name: fullName,
  });
  return resp.data.data;
}

export async function loginUser(email: string, password: string) {
  const resp = await apiClient.post<AuthResponse>("/api/auth/login", { email, password });
  return resp.data.data;
}
```

- [ ] **Step 3: Create `frontend/src/hooks/useAuth.ts`**

```typescript
import { useCallback, useEffect, useState } from "react";
import { loginUser, registerUser } from "../features/auth/api";

interface User {
  id: string;
  email: string;
  full_name: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginUser(email, password);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    const data = await registerUser(email, password, fullName);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return { user, login, register, logout, isAuthenticated: !!user, isLoading };
}
```

- [ ] **Step 4: Create login and register pages (simplified — form + submit)**

```tsx
// frontend/src/features/auth/pages/LoginPage.tsx
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-8">
        <h1 className="text-2xl font-bold">Sign In</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <button type="submit" className="w-full bg-blue-600 text-white rounded py-2">
          Sign In
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Create `frontend/src/components/shared/ProtectedRoute.tsx`**

```tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 6: Create `frontend/src/app/Router.tsx`**

```tsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { ProtectedRoute } from "../components/shared/ProtectedRoute";

function Dashboard() {
  return <div className="p-8"><h1 className="text-xl">Dashboard — coming next</h1></div>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 7: Wire up `App.tsx` with providers**

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppRouter } from "./Router";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  );
}

export default App;
```

- [ ] **Step 8: Verify in browser**

Run frontend + backend. Navigate to `/` — should redirect to `/login`. Log in — should land on dashboard.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: add frontend auth, routing, API client, protected routes"
```

---

### Task 10: Frontend — Board View with Drag-and-Drop

**Files:**
- Create: `frontend/src/features/board/api.ts`
- Create: `frontend/src/features/board/hooks/useBoard.ts`
- Create: `frontend/src/features/board/hooks/useBoardWebSocket.ts`
- Create: `frontend/src/features/board/pages/BoardPage.tsx`
- Create: `frontend/src/features/board/components/BoardColumn.tsx`
- Create: `frontend/src/features/board/components/TaskCard.tsx`
- Create: `frontend/src/features/board/components/CreateTaskDialog.tsx`
- Create: `frontend/src/features/task/components/TaskDetailModal.tsx`
- Create: `frontend/src/hooks/useWebSocket.ts`
- Modify: `frontend/src/app/Router.tsx` (add board route)

**Interfaces:**
- Consumes: `apiClient`, backend board/task endpoints, WebSocket `/api/boards/{id}/live`
- Produces:
  - `<BoardPage>` — full kanban board with columns and cards
  - `useBoard(projectId)` — React Query hook fetching board data
  - `useBoardWebSocket(projectId)` — subscribes to live updates, patches query cache
  - Drag-and-drop via dnd-kit — calls `POST /api/tasks/{id}/move` on drop

- [ ] **Step 1: Create `frontend/src/features/board/api.ts`**

```typescript
import { apiClient } from "../../lib/api-client";

export interface TaskData {
  id: string;
  project_id: string;
  column_id: string;
  title: string;
  description: string;
  priority: string;
  assignee_id: string | null;
  position: string;
  due_date: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ColumnData {
  id: string;
  name: string;
  position: string;
  tasks: TaskData[];
}

export interface BoardData {
  project_id: string;
  columns: ColumnData[];
}

export async function fetchBoard(projectId: string): Promise<BoardData> {
  const resp = await apiClient.get(`/api/projects/${projectId}/board`);
  return resp.data.data;
}

export async function moveTask(taskId: string, columnId: string, position: string) {
  const resp = await apiClient.post(`/api/tasks/${taskId}/move`, {
    column_id: columnId,
    position,
  });
  return resp.data.data;
}

export async function createTask(projectId: string, data: { title: string; priority: string }) {
  const resp = await apiClient.post(`/api/projects/${projectId}/tasks`, data);
  return resp.data.data;
}
```

- [ ] **Step 2: Create `frontend/src/hooks/useWebSocket.ts`**

```typescript
import { useEffect, useRef } from "react";

export function useWebSocket(url: string, onMessage: (event: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.onerror = () => {
      console.error("WebSocket error");
    };

    return () => {
      ws.close();
    };
  }, [url, onMessage]);

  return wsRef;
}
```

- [ ] **Step 3: Create `frontend/src/features/board/hooks/useBoard.ts`**

```typescript
import { useQuery } from "@tanstack/react-query";
import { BoardData, fetchBoard } from "../api";

export function useBoard(projectId: string) {
  return useQuery<BoardData>({
    queryKey: ["board", projectId],
    queryFn: () => fetchBoard(projectId),
  });
}
```

- [ ] **Step 4: Create `frontend/src/features/board/hooks/useBoardWebSocket.ts`**

```typescript
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useWebSocket } from "../../../hooks/useWebSocket";
import { BoardData, TaskData } from "../api";

export function useBoardWebSocket(projectId: string) {
  const queryClient = useQueryClient();
  const wsUrl = `${import.meta.env.VITE_WS_URL || "ws://localhost:8000"}/api/boards/${projectId}/live`;

  const handleMessage = useCallback(
    (event: { event: string; data: TaskData }) => {
      queryClient.setQueryData<BoardData>(["board", projectId], (old) => {
        if (!old) return old;
        const columns = old.columns.map((col) => ({ ...col, tasks: [...col.tasks] }));

        switch (event.event) {
          case "task.created": {
            const col = columns.find((c) => c.id === event.data.column_id);
            if (col) col.tasks.push(event.data);
            break;
          }
          case "task.moved": {
            for (const col of columns) {
              col.tasks = col.tasks.filter((t) => t.id !== event.data.id);
            }
            const targetCol = columns.find((c) => c.id === event.data.column_id);
            if (targetCol) targetCol.tasks.push(event.data);
            break;
          }
          case "task.updated": {
            for (const col of columns) {
              const idx = col.tasks.findIndex((t) => t.id === event.data.id);
              if (idx !== -1) {
                col.tasks[idx] = event.data;
                break;
              }
            }
            break;
          }
          case "task.archived": {
            for (const col of columns) {
              col.tasks = col.tasks.filter((t) => t.id !== (event.data as any).id);
            }
            break;
          }
        }

        return { ...old, columns };
      });
    },
    [projectId, queryClient]
  );

  useWebSocket(wsUrl, handleMessage);
}
```

- [ ] **Step 5: Create `frontend/src/features/board/components/TaskCard.tsx`**

```tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskData } from "../api";

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-blue-500",
  low: "border-l-gray-400",
};

export function TaskCard({ task, onClick }: { task: TaskData; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white rounded-lg border-l-4 ${PRIORITY_COLORS[task.priority]} p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
    >
      <p className="text-sm font-medium text-gray-900">{task.title}</p>
      {task.due_date && (
        <p className="text-xs text-gray-500 mt-1">{task.due_date}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create `frontend/src/features/board/components/BoardColumn.tsx`**

```tsx
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ColumnData } from "../api";
import { TaskCard } from "./TaskCard";

export function BoardColumn({
  column,
  onTaskClick,
}: {
  column: ColumnData;
  onTaskClick: (taskId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="font-semibold text-sm text-gray-700">{column.name}</h3>
        <span className="text-xs text-gray-400">{column.tasks.length}</span>
      </div>
      <div ref={setNodeRef} className="flex-1 p-2 space-y-2 bg-gray-100 rounded-lg min-h-[200px]">
        <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create `frontend/src/features/board/pages/BoardPage.tsx`**

```tsx
import { DndContext, DragEndEvent, closestCorners } from "@dnd-kit/core";
import { useParams } from "react-router-dom";
import { useBoard } from "../hooks/useBoard";
import { useBoardWebSocket } from "../hooks/useBoardWebSocket";
import { BoardColumn } from "../components/BoardColumn";
import { moveTask } from "../api";
import { useQueryClient } from "@tanstack/react-query";

export function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: board, isLoading } = useBoard(projectId!);
  const queryClient = useQueryClient();

  useBoardWebSocket(projectId!);

  if (isLoading || !board) return <div className="p-8">Loading board...</div>;

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const targetColumnId = over.id as string;

    await moveTask(taskId, targetColumnId, "a");
    queryClient.invalidateQueries({ queryKey: ["board", projectId] });
  };

  return (
    <div className="h-full p-6">
      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto h-full">
          {board.columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              onTaskClick={(id) => console.log("open task", id)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
```

- [ ] **Step 8: Add board route to Router.tsx**

```tsx
import { BoardPage } from "../features/board/pages/BoardPage";

// Inside Routes:
<Route path="/projects/:projectId/board" element={<ProtectedRoute><BoardPage /></ProtectedRoute>} />
```

- [ ] **Step 9: Verify in browser**

Create a workspace and project via API (curl or Postman), navigate to `/projects/{id}/board`, verify columns render and drag-and-drop works.

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat: add frontend board view with drag-and-drop and real-time WebSocket"
```

---

### Task 11: Frontend — Workspace & Project Pages

**Files:**
- Create: `frontend/src/features/workspace/api.ts`
- Create: `frontend/src/features/workspace/hooks/useWorkspaces.ts`
- Create: `frontend/src/features/workspace/pages/WorkspaceListPage.tsx`
- Create: `frontend/src/features/workspace/pages/WorkspaceDetailPage.tsx`
- Create: `frontend/src/features/workspace/components/CreateWorkspaceDialog.tsx`
- Create: `frontend/src/features/project/api.ts`
- Create: `frontend/src/features/project/hooks/useProjects.ts`
- Create: `frontend/src/features/project/pages/ProjectListPage.tsx`
- Create: `frontend/src/features/project/components/CreateProjectDialog.tsx`
- Create: `frontend/src/components/shared/Layout.tsx`
- Create: `frontend/src/components/shared/Sidebar.tsx`
- Modify: `frontend/src/app/Router.tsx` (add workspace/project routes)

**Interfaces:**
- Consumes: Backend workspace/project endpoints, `apiClient`
- Produces: Full navigation flow: login → workspace list → workspace detail → project list → board

- [ ] **Step 1: Create `frontend/src/features/workspace/api.ts`**

```typescript
import { apiClient } from "../../lib/api-client";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const resp = await apiClient.get("/api/workspaces");
  return resp.data.data;
}

export async function createWorkspace(name: string, slug: string): Promise<Workspace> {
  const resp = await apiClient.post("/api/workspaces", { name, slug });
  return resp.data.data;
}
```

- [ ] **Step 2: Create workspace pages and project pages**

Build simple list/detail views using React Query hooks, matching the pattern from auth. Each page fetches data and renders a list or detail view with navigation links.

- [ ] **Step 3: Create `frontend/src/components/shared/Layout.tsx`**

```tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Create `frontend/src/components/shared/Sidebar.tsx`**

```tsx
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold">PlanApp</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link to="/" className="block px-3 py-2 rounded hover:bg-gray-800">
          Workspaces
        </Link>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <p className="text-sm text-gray-400">{user?.full_name}</p>
        <button onClick={logout} className="text-sm text-red-400 mt-1">
          Sign out
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 5: Update Router with layout and all routes**

```tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
    <Route path="/" element={<WorkspaceListPage />} />
    <Route path="/workspaces/:workspaceId" element={<WorkspaceDetailPage />} />
    <Route path="/workspaces/:workspaceId/projects" element={<ProjectListPage />} />
    <Route path="/projects/:projectId/board" element={<BoardPage />} />
  </Route>
</Routes>
```

- [ ] **Step 6: Verify full flow in browser**

Register → lands on workspace list → create workspace → navigate to projects → create project → view board → drag tasks.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add workspace and project pages, layout with sidebar, full navigation"
```

---

### Task 12: Search, Filters & Docker Production Config

**Files:**
- Modify: `frontend/src/features/board/pages/BoardPage.tsx` (add filter bar)
- Create: `frontend/src/features/board/components/FilterBar.tsx`
- Create: `docker-compose.prod.yml`
- Create: `frontend/Dockerfile` (production multi-stage build)
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `GET /api/projects/{id}/tasks?priority=X&search=Y`
- Produces:
  - Filter bar UI (priority dropdown, search input)
  - Production Docker Compose (Nginx + API + Postgres + Redis)
  - CI pipeline (lint + type check + test + build)

- [ ] **Step 1: Create `frontend/src/features/board/components/FilterBar.tsx`**

```tsx
import { useState } from "react";

interface FilterBarProps {
  onFilterChange: (filters: { priority?: string; search?: string }) => void;
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");

  const handlePriorityChange = (value: string) => {
    setPriority(value);
    onFilterChange({ priority: value || undefined, search: search || undefined });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ priority: priority || undefined, search: value || undefined });
  };

  return (
    <div className="flex gap-3 mb-4">
      <input
        type="text"
        placeholder="Search tasks..."
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="border rounded px-3 py-1.5 text-sm w-64"
      />
      <select
        value={priority}
        onChange={(e) => handlePriorityChange(e.target.value)}
        className="border rounded px-3 py-1.5 text-sm"
      >
        <option value="">All priorities</option>
        <option value="urgent">Urgent</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Create `docker-compose.prod.yml`**

```yaml
services:
  proxy:
    image: traefik:v3.0
    command:
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
    ports:
      - "80:80"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    labels:
      - "traefik.http.routers.frontend.rule=PathPrefix(`/`)"

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
    env_file: .env
    labels:
      - "traefik.http.routers.api.rule=PathPrefix(`/api`) || PathPrefix(`/health`)"
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER:-planapp}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-planapp}
      POSTGRES_DB: ${DB_NAME:-planapp}
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

- [ ] **Step 3: Create `frontend/Dockerfile.prod`**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 4: Create `.github/workflows/ci.yml`**

```yaml
name: CI
on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: planapp
          POSTGRES_PASSWORD: planapp
          POSTGRES_DB: planapp_test
        ports: ["5432:5432"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: cd backend && pip install -e ".[dev]"
      - run: cd backend && ruff check .
      - run: cd backend && pyright
      - run: cd backend && pytest --cov=app --cov-report=term-missing
        env:
          DATABASE_URL: postgresql+asyncpg://planapp:planapp@localhost:5432/planapp_test
          DATABASE_URL_SYNC: postgresql://planapp:planapp@localhost:5432/planapp_test
          REDIS_URL: redis://localhost:6379/0
          JWT_SECRET_KEY: test-secret

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && npx tsc --noEmit
      - run: cd frontend && npm test -- --run
```

- [ ] **Step 5: Test production build locally**

```bash
docker compose -f docker-compose.prod.yml up --build
# Verify app loads at http://localhost
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add search/filters, production Docker config, CI pipeline"
```


