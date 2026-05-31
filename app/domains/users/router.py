# app/domains/users/router.py
from fastapi import APIRouter, Depends, UploadFile, File
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_creator, get_password_hash
from app.core.storage import generate_presigned_url
from app.domains.users import schemas, services
from app.domains.users.models import Creator
from app.domains.uploads import services as upload_services
from app.common.exceptions import BadRequestError
import uuid
import mimetypes
from app.core.config import settings
from app.core.storage import b2_client

router = APIRouter(prefix="/users/me", tags=["Users (Me)"])

def append_presigned_avatar(creator: Creator):
    """Helper to convert B2 object keys into presigned URLs for frontend consumption."""
    if creator.avatar_url and not creator.avatar_url.startswith("http"):
        # It's an object key, so replace it in the response model with a presigned URL
        creator_copy = creator.model_copy()
        creator_copy.avatar_url = generate_presigned_url(creator.avatar_url)
        return creator_copy
    return creator

@router.post("/initialize", response_model=schemas.CreatorPublic)
async def init_profile(
    data: schemas.CreatorInitRequest,
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator),
):
    updated = await services.init_creator_profile(db, creator, data)
    return append_presigned_avatar(updated)

@router.get("/profile", response_model=schemas.CreatorPublic)
async def get_profile(creator: Creator = Depends(get_current_creator)):
    return append_presigned_avatar(creator)

@router.put("/profile", response_model=schemas.CreatorPublic)
async def update_profile(
    data: schemas.CreatorUpdateRequest,
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator),
):
    updated = await services.update_creator(db, creator, data)
    return append_presigned_avatar(updated)

@router.post("/avatar", response_model=schemas.CreatorPublic)
async def upload_avatar(
    file: UploadFile = File(...),
    creator: Creator = Depends(get_current_creator),
    db: AsyncSession = Depends(get_db),
):
    """Upload or update profile avatar directly to B2"""
    allowed_types = ['image/jpeg', 'image/png', 'image/webp']
    if file.content_type not in allowed_types:
        raise BadRequestError("Only JPEG, PNG and WEBP images are allowed")

    content = await file.read()
    ext = mimetypes.guess_extension(file.content_type) or '.jpg'
    filename = f"avatars/{creator.id}-{uuid.uuid4()}{ext}"

    url = await upload_services.upload_file_b2(filename, content, file.content_type)
    
    # Update creator profile
    creator.avatar_url = url
    db.add(creator)
    await db.commit()
    await db.refresh(creator)
    
    return creator

@router.put("/email", response_model=schemas.CreatorPublic)
async def update_email(
    payload: schemas.EmailUpdateRequest,
    creator: Creator = Depends(get_current_creator),
    db: AsyncSession = Depends(get_db),
):
    """Update creator email"""
    creator.email = payload.email
    db.add(creator)
    await db.commit()
    await db.refresh(creator)
    return creator

@router.put("/password", response_model=schemas.CreatorPublic)
async def update_password(
    payload: schemas.PasswordUpdateRequest,
    creator: Creator = Depends(get_current_creator),
    db: AsyncSession = Depends(get_db),
):
    """Update creator password"""
    creator.hashed_password = get_password_hash(payload.password)
    db.add(creator)
    await db.commit()
    await db.refresh(creator)
    return creator


# ============================================
# Public Routes (No Authentication Required)
# ============================================

public_router = APIRouter(prefix="/users", tags=["Users (Public)"])


@public_router.get("/by-subdomain/{subdomain}", response_model=schemas.CreatorPublic)
async def get_user_by_subdomain(
    subdomain: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get public profile info for a creator by their subdomain.
    Used by Next.js frontend for multi-tenant subdomain system.
    
    Returns user profile with public-safe fields only.
    """
    creator = await services.get_creator_by_subdomain(db, subdomain)
    if not creator:
        raise BadRequestError(f"Creator with subdomain '{subdomain}' not found")
    
    return append_presigned_avatar(creator)


@public_router.get("/{creator_id}/prompts")
async def get_creator_public_prompts(
    creator_id: str,
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
    include_public: bool = True,
):
    """
    Get public prompts for a creator.
    
    Query Parameters:
    - include_public: Include public prompts (default: true)
    - limit: Max results (default: 50, max: 100)
    - offset: Pagination offset (default: 0)
    
    Returns only published prompts that are marked as public.
    """
    try:
        creator_uuid = uuid.UUID(creator_id)
    except ValueError:
        raise BadRequestError("Invalid creator ID format")
    
    limit = min(limit, 100)  # Cap at 100
    
    prompts = await services.get_creator_public_prompts(
        db,
        creator_uuid,
        limit=limit,
        offset=offset,
        include_public=include_public,
    )
    
    return {
        "creator_id": creator_id,
        "prompts": prompts,
        "limit": limit,
        "offset": offset,
        "total": len(prompts),
    }