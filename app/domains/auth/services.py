# app/domains/auth/services.py
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.domains.users.models import Creator
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.common.exceptions import ConflictError, UnauthorizedError, BadRequestError
from app.domains.auth.schemas import RegisterRequest, LoginRequest
import uuid

async def register_creator(db: AsyncSession, data: RegisterRequest) -> Creator:
    # Check email uniqueness
    existing = await db.exec(select(Creator).where(Creator.email == data.email))
    if existing.first():
        raise ConflictError("Email already registered")

    # Check handle uniqueness
    handle_taken = await db.exec(select(Creator).where(Creator.handle == data.handle))
    if handle_taken.first():
        raise ConflictError("Handle already taken")

    creator = Creator(
        email=data.email,
        hashed_password=hash_password(data.password),
        name=data.name,
        handle=data.handle,
        subdomain=data.handle,  # default subdomain = handle
    )
    db.add(creator)
    await db.commit()
    await db.refresh(creator)
    return creator

async def login_creator(db: AsyncSession, data: LoginRequest) -> dict:
    result = await db.exec(select(Creator).where(Creator.email == data.email))
    creator = result.first()

    if not creator or not verify_password(data.password, creator.hashed_password):
        raise UnauthorizedError("Invalid email or password")
    if not creator.is_active:
        raise UnauthorizedError("Account is deactivated")

    return {
        "access_token": create_access_token(str(creator.id)),
        "refresh_token": create_refresh_token(str(creator.id)),
        "token_type": "bearer",
    }

async def refresh_tokens(db: AsyncSession, refresh_token: str) -> dict:
    payload = decode_token(refresh_token)
    if not payload:
        raise UnauthorizedError("Invalid or expired refresh token")
        
    if payload.get("type") != "refresh":
        raise BadRequestError("Invalid token type")

    from app.domains.users.services import get_creator_by_id
    creator = await get_creator_by_id(db, payload["sub"])
    if not creator:
        raise UnauthorizedError("Creator not found")

    return {
        "access_token": create_access_token(str(creator.id)),
        "refresh_token": create_refresh_token(str(creator.id)),
        "token_type": "bearer",
    }