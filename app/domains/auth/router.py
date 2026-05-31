# app/domains/auth/router.py
from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_creator, set_auth_cookies, clear_auth_cookies
from app.domains.auth import schemas, services
from fastapi import Response, Request

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.TokenResponse, status_code=201)
async def register(data: schemas.RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    creator = await services.register_creator(db, data)
    tokens = await services.login_creator(
        db, schemas.LoginRequest(email=data.email, password=data.password)
    )
    set_auth_cookies(response, tokens["access_token"], tokens["refresh_token"])
    return tokens

@router.post("/login", response_model=schemas.TokenResponse)
async def login(data: schemas.LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    tokens = await services.login_creator(db, data)
    set_auth_cookies(response, tokens["access_token"], tokens["refresh_token"])
    return tokens

@router.post("/refresh", response_model=schemas.TokenResponse)
async def refresh(request: Request, response: Response, data: schemas.RefreshRequest | None = None, db: AsyncSession = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token and data and data.refresh_token:
        refresh_token = data.refresh_token
        
    if not refresh_token:
        from app.common.exceptions import UnauthorizedError
        raise UnauthorizedError("No refresh token provided")
        
    tokens = await services.refresh_tokens(db, refresh_token)
    set_auth_cookies(response, tokens["access_token"], tokens["refresh_token"])
    return tokens

@router.post("/logout", status_code=200)
async def logout(response: Response):
    """
    Invalidate session/tokens. Often handled on the client-side for JWT,
    but here to align with the API requirements.
    """
    clear_auth_cookies(response)
    return {"status": "logged_out", "message": "Successfully logged out."}

@router.get("/me")
async def get_me(creator=Depends(get_current_creator)):
    """
    Get current authenticated user details.
    """
    return creator