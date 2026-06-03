# app/domains/uploads/router.py
import uuid
import logging
import mimetypes
from fastapi import APIRouter, Depends, UploadFile, File, Form, Request, Response
from fastapi.responses import StreamingResponse
from botocore.exceptions import ClientError
from app.core.security import get_current_creator
from app.core.config import get_settings
from app.domains.uploads import services, schemas
from app.common.exceptions import BadRequestError, NotFoundError
from app.core.storage import direct_upload_to_b2, b2_client

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
    request: Request,
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

    base_url = str(request.base_url).rstrip("/")
    public_url = f"{base_url}{settings.API_PREFIX}/upload/media/{object_key}"
    logger.info(f"[UPLOAD] ✓ Stored at {public_url}")

    return schemas.UploadResponse(url=public_url, object_key=object_key)

@router.post("/presign", response_model=schemas.PresignResponse)
async def get_presigned_url(
    request: Request,
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
    base_url = str(request.base_url).rstrip("/")
    public_url = f"{base_url}{settings.API_PREFIX}/upload/media/{object_key}"

    return schemas.PresignResponse(
        upload_url=upload_url,
        public_url=public_url,
        object_key=object_key
    )

@router.head("/media/{object_key:path}")
async def get_media_file_info(object_key: str):
    """
    Proxy metadata from Backblaze B2 so file sizes can be checked.
    """
    try:
        response = b2_client.head_object(
            Bucket=settings.B2_BUCKET_NAME,
            Key=object_key
        )
        headers = {
            "Content-Length": str(response.get("ContentLength", 0)),
            "Content-Type": response.get("ContentType", "application/octet-stream"),
        }
        return Response(status_code=200, headers=headers)
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            raise NotFoundError("File")
        raise

@router.get("/media/{object_key:path}")
async def get_media_file(object_key: str):
    """
    Proxy download from Backblaze B2 so private files can be viewed publicly.
    """
    try:
        response = b2_client.get_object(
            Bucket=settings.B2_BUCKET_NAME,
            Key=object_key
        )
        return StreamingResponse(
            response['Body'],
            media_type=response.get('ContentType', 'application/octet-stream')
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            raise NotFoundError("File")
        raise