# app/core/storage.py
# All Backblaze B2 storage operations go through this module.
# Uses boto3 with the B2 S3-compatible API endpoint.

import uuid
import mimetypes
import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile

from app.core.config import get_settings

settings = get_settings()

# ── Single shared B2 client ────────────────────────────────────────────────────
b2_client = boto3.client(
    "s3",
    endpoint_url=settings.B2_ENDPOINT_URL,
    aws_access_key_id=settings.B2_KEY_ID,
    aws_secret_access_key=settings.B2_APPLICATION_KEY,
)

# ── File-size / type constants ─────────────────────────────────────────────────
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_PDF_TYPES   = {"application/pdf"}
MAX_IMAGE_SIZE = 5  * 1024 * 1024   # 5 MB
MAX_PDF_SIZE   = 20 * 1024 * 1024   # 20 MB


# ── Generic file-object upload (used by prompts router) ───────────────────────
async def upload_file_to_b2(file_obj, filename: str, content_type: str) -> str:
    """
    Upload a raw file-like object to Backblaze B2.
    Returns the object key (stored path), NOT a public URL.
    """
    ext = filename.rsplit(".", 1)[-1] if "." in filename else ""
    unique_filename = f"{uuid.uuid4()}.{ext}"
    object_key = f"prompts/pdfs/{unique_filename}"

    try:
        b2_client.upload_fileobj(
            file_obj,
            settings.B2_BUCKET_NAME,
            object_key,
            ExtraArgs={"ContentType": content_type},
        )
        return object_key
    except ClientError as e:
        raise Exception(f"Failed to upload to Backblaze B2: {str(e)}")


# ── Presigned URL generation ───────────────────────────────────────────────────
def generate_presigned_url(object_key: str, expiration: int = 3600) -> str:
    """
    Generate a time-limited presigned URL for a private B2 object.
    """
    try:
        return b2_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.B2_BUCKET_NAME, "Key": object_key},
            ExpiresIn=expiration,
        )
    except ClientError as e:
        raise Exception(f"Failed to generate presigned URL: {str(e)}")


# ── Image upload (used by uploads domain) ─────────────────────────────────────
async def upload_image(file: UploadFile, folder: str = "images") -> str:
    """
    Validate and upload an image to B2. Returns the public CDN URL.
    """
    from app.common.exceptions import BadRequestError

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise BadRequestError("Image exceeds 5 MB limit")

    mime = file.content_type or mimetypes.guess_type(file.filename or "")[0]
    if mime not in ALLOWED_IMAGE_TYPES:
        raise BadRequestError(f"Unsupported image type: {mime}")

    ext = file.filename.rsplit(".", 1)[-1] if file.filename else "jpg"
    key = f"{folder}/{uuid.uuid4()}.{ext}"

    try:
        b2_client.put_object(
            Bucket=settings.B2_BUCKET_NAME,
            Key=key,
            Body=content,
            ContentType=mime,
        )
    except ClientError as e:
        raise Exception(f"Failed to upload image to Backblaze B2: {str(e)}")

    return f"{settings.B2_PUBLIC_URL}/{key}"


# ── PDF upload (used by uploads domain) ───────────────────────────────────────
async def upload_pdf(file: UploadFile, folder: str = "pdfs") -> str:
    """
    Validate and upload a PDF to B2. Returns the public CDN URL.
    """
    from app.common.exceptions import BadRequestError

    content = await file.read()
    if len(content) > MAX_PDF_SIZE:
        raise BadRequestError("PDF exceeds 20 MB limit")

    key = f"{folder}/{uuid.uuid4()}.pdf"

    try:
        b2_client.put_object(
            Bucket=settings.B2_BUCKET_NAME,
            Key=key,
            Body=content,
            ContentType="application/pdf",
        )
    except ClientError as e:
        raise Exception(f"Failed to upload PDF to Backblaze B2: {str(e)}")

    return f"{settings.B2_PUBLIC_URL}/{key}"
