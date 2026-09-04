from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.core.security import create_access_token, hash_password, verify_password, verify_token
from app.modules.auth.models import User
from app.modules.auth.schemas import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserProfileResponse,
    UserResponse,
)
from app.modules.auth.service import login_user, register_user

router = APIRouter(prefix="/api/auth", tags=["auth"])
users_router = APIRouter(prefix="/api/users", tags=["users"])


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


@users_router.get("/me")
async def get_my_profile(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return envelope(UserProfileResponse.model_validate(user).model_dump())


@users_router.patch("/me")
async def update_my_profile(
    data: UpdateProfileRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if data.current_password is not None and data.new_password is not None:
        if not verify_password(data.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        user.hashed_password = hash_password(data.new_password)
    elif data.current_password is not None or data.new_password is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both current_password and new_password are required to change password",
        )

    if data.full_name is not None:
        user.full_name = data.full_name

    await db.commit()
    await db.refresh(user)
    return envelope(UserProfileResponse.model_validate(user).model_dump())
