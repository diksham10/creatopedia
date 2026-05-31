# app/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.config import settings
from app.core.database import get_db

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(subject: str, extra: dict[str, Any] = {}) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "exp": expire, "type": "access", **extra}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {"sub": subject, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        path="/",
        domain=settings.COOKIE_DOMAIN,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        path="/",
        domain=settings.COOKIE_DOMAIN,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key="access_token", path="/", domain=settings.COOKIE_DOMAIN)
    response.delete_cookie(key="refresh_token", path="/", domain=settings.COOKIE_DOMAIN)

# Alias used by users/router.py
get_password_hash = hash_password

async def get_current_creator(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    auth: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)
):
    # Extract the token from the Authorization header or cookie
    token = request.cookies.get("access_token")
    if not token and auth:
        token = auth.credentials
    if not token:
        # Fallback manual check
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    payload = None
    if token:
        payload = decode_token(token)

    # If access token is missing, invalid, or expired, check the refresh token
    if not payload or payload.get("type") != "access":
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated. Please login again.",
            )
        
        refresh_payload = decode_token(refresh_token)
        if not refresh_payload or refresh_payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired. Please login again.",
            )
        
        creator_id: str = refresh_payload.get("sub")
        if not creator_id:
            raise HTTPException(status_code=401, detail="Invalid token subject")
            
        # Create a new access token
        new_access_token = create_access_token(subject=creator_id)
        
        # Set new access token cookie
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=settings.ENVIRONMENT == "production",
            samesite="lax",
            domain=settings.COOKIE_DOMAIN,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
        
        # Re-assign payload to use values from newly minted token for further checks if any
        payload = {"sub": creator_id}

    creator_id: str = payload.get("sub")
    if not creator_id:
        raise HTTPException(status_code=401, detail="Invalid token subject")

    # Import here to avoid circular imports
    from app.domains.users.services import get_creator_by_id
    creator = await get_creator_by_id(db, creator_id)
    if not creator or not creator.is_active:
        raise HTTPException(status_code=401, detail="Creator not found or inactive")
    return creator

# Optional auth — returns None if no token
async def get_optional_creator(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    auth: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)
):
    token = request.cookies.get("access_token")
    if not token and auth:
        token = auth.credentials
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    refresh_token = request.cookies.get("refresh_token")
    if not token and not refresh_token:
        return None
    
    # Try fetching the creator now that we know we have a token
    try:
        return await get_current_creator(request, response, db, auth)
    except HTTPException:
        return None

async def get_current_admin(
    creator = Depends(get_current_creator)
):
    if creator.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource."
        )
    return creator