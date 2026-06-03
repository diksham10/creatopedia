# app/domains/uploads/router.py
import uuid
import logging
import mimetypes
from fastapi import APIRouter, Depends, UploadFile, File, Form
from app.core.security import get_current_creator
from app.core.config import get_settings
from app.domains.uploads import services, schemas
from app.common.exceptions import BadRequestError
from app.core.storage import direct_upload_to_b2

router = APIRouter(prefix="/upload", tags=["Uploads"])
settings = get_settings()
logger = logging.getLogger("uvicorn.error")

ALLOWED_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "application/pdf",
    "video/mp4", "video/webm", "video/ogg", "video/quicktime",
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/file", response_model=schemas.UploadResponse)
async def upload_file_direct(
    file: UploadFile = File(...),
    creator=Depends(get_current_creator),
):
    """
    Accept a raw file upload from the Next.js server and store it in B2
    using put_object directly (presigned URLs are blocked by bucket policy).
    """
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_TYPES:
        raise BadRequestError(f"Unsupported file type: {content_type}")

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise BadRequestError("File too large. Max 50 MB.")

    # Determine folder and extension
    ext = ""
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()
    else:
        guessed = mimetypes.guess_extension(content_type)
        if guessed:
            ext = guessed.lstrip(".")

    if content_type == "application/pdf":
        folder = "pdfs"
    elif content_type.startswith("video/"):
        folder = "videos"
    else:
        folder = "images"

    unique_name = f"{uuid.uuid4()}.{ext}" if ext else str(uuid.uuid4())
    object_key  = f"creators/{creator.id}/{folder}/{unique_name}"

    logger.info(f"[UPLOAD] creator={creator.id} file={file.filename} type={content_type} key={object_key}")

    direct_upload_to_b2(object_key, data, content_type)

    public_url = f"{settings.B2_PUBLIC_URL}/{object_key}"
    logger.info(f"[UPLOAD] ✓ Stored at {public_url}")

    return schemas.UploadResponse(url=public_url, object_key=object_key)

@router.post("/presign", response_model=schemas.PresignResponse)
async def get_presigned_url(
    req: schemas.PresignRequest,
    creator=Depends(get_current_creator),
):
    # Validate content type
    allowed_types = {
        "image/jpeg", "image/png", "image/webp", "image/gif",
        "application/pdf",
        "video/mp4", "video/webm", "video/ogg", "video/quicktime"
    }
    if req.content_type not in allowed_types:
        raise BadRequestError(f"Unsupported content type: {req.content_type}")

    # Determine file extension
    ext = ""
    if "." in req.filename:
        ext = req.filename.rsplit(".", 1)[-1].lower()
    else:
        guessed_ext = mimetypes.guess_extension(req.content_type)
        if guessed_ext:
            ext = guessed_ext.lstrip(".")

    # Classify folder based on content type
    if req.content_type == "application/pdf":
        folder = "pdfs"
    elif req.content_type.startswith("video/"):
        folder = "videos"
    else:
        folder = "images"

    # Generate a unique path/key for the file
    unique_filename = f"{uuid.uuid4()}"
    if ext:
        unique_filename = f"{unique_filename}.{ext}"
    
    object_key = f"creators/{creator.id}/{folder}/{unique_filename}"

    # Generate the presigned upload URL (for PUT request)
    upload_url = services.generate_presigned_upload_url(
        object_key=object_key,
        content_type=req.content_type
    )

    # Construct the final public URL
    public_url = f"{settings.B2_PUBLIC_URL}/{object_key}"

    return schemas.PresignResponse(
        upload_url=upload_url,
        public_url=public_url,
        object_key=object_key
    )