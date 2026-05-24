# app/domains/auth/router.py
from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_creator
from app.domains.auth import schemas, services

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.TokenResponse, status_code=201)
async def register(data: schemas.RegisterRequest, db: AsyncSession = Depends(get_db)):
    creator = await services.register_creator(db, data)
    tokens = await services.login_creator(
        db, schemas.LoginRequest(email=data.email, password=data.password)
    )
    return tokens

@router.post("/login", response_model=schemas.TokenResponse)
async def login(data: schemas.LoginRequest, db: AsyncSession = Depends(get_db)):
    return await services.login_creator(db, data)

@router.post("/refresh", response_model=schemas.TokenResponse)
async def refresh(data: schemas.RefreshRequest, db: AsyncSession = Depends(get_db)):
    return await services.refresh_tokens(db, data.refresh_token)

@router.post("/logout", status_code=200)
async def logout():
    """
    Invalidate session/tokens. Often handled on the client-side for JWT,
    but here to align with the API requirements.
    """
    return {"status": "logged_out", "message": "Successfully logged out."}

@router.get("/me")
async def get_me(creator=Depends(get_current_creator)):
    """
    Get current authenticated user details.
    """
    return creator