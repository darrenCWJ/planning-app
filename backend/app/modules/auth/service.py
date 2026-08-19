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
