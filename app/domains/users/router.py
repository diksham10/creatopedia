# app/domains/users/router.py
from fastapi import APIRouter, Depends, UploadFile, File
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_creator
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
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator),
):
    # Upload directly strictly for private presigned bucket storage
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise BadRequestError("Image exceeds 5 MB limit")

    mime = file.content_type or mimetypes.guess_type(file.filename or "")[0]
    ext = file.filename.rsplit(".", 1)[-1] if file.filename else "jpg"
    
    # This is the "Key" that we save in the database
    object_key = f"creators/{creator.id}/avatar/{uuid.uuid4()}.{ext}"

    # Push to BackBaze B2 using core logic
    try:
        b2_client.put_object(
            Bucket=settings.B2_BUCKET_NAME,
            Key=object_key,
            Body=content,
            ContentType=mime,
        )
    except Exception as e:
        raise Exception(f"Failed to upload avatar to B2: {str(e)}")
    
    # Save the KEY, not the full URL
    update_data = schemas.CreatorUpdateRequest(avatar_url=object_key)
    updated_creator = await services.update_creator(db, creator, update_data)
    
    # Return with Presigned URL injected
    return append_presigned_avatar(updated_creator)