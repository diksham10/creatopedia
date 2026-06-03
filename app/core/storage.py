# app/core/storage.py
# All Backblaze B2 storage operations go through this module.
# Uses boto3 with the B2 S3-compatible API endpoint.

import uuid
import mimetypes
import boto3
import logging
from botocore.exceptions import ClientError
from fastapi import UploadFile

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger("uvicorn.error")

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


# ── Presigned URL generation ───────────────────────────────────────────────────
def generate_presigned_url(object_key: str, expiration: int = 3600) -> str:
    """
    Generate a presigned GET URL for fetching private objects.
    """
    try:
        url = b2_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.B2_BUCKET_NAME, "Key": object_key},
            ExpiresIn=expiration,
        )
        return url
    except ClientError as e:
        logger.error(f"[STORAGE] Failed to generate presigned GET URL for key {object_key}: {str(e)}")
        raise Exception(f"Failed to generate presigned GET URL: {str(e)}")


def generate_presigned_upload_url(object_key: str, content_type: str, expiration: int = 3600) -> str:
    """
    Generate a presigned PUT URL for client-side direct uploads.
    """
    logger.info(f"[STORAGE] Generating presigned upload URL for key: {object_key} (ContentType: {content_type})")
    try:
        url = b2_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.B2_BUCKET_NAME,
                "Key": object_key,
                "ContentType": content_type,
            },
            ExpiresIn=expiration,
        )
        return url
    except ClientError as e:
        logger.error(f"[STORAGE] Failed to generate presigned upload URL for key {object_key}: {str(e)}")
        raise Exception(f"Failed to generate presigned upload URL: {str(e)}")



def direct_upload_to_b2(object_key: str, data: bytes, content_type: str) -> None:
    """
    Upload bytes directly to Backblaze B2 using put_object.
    Used when presigned URLs are blocked (bucket requires authentication).
    """
    logger.info(f"[STORAGE] Direct upload to B2: {object_key} ({content_type}, {len(data)} bytes)")
    try:
        b2_client.put_object(
            Bucket=settings.B2_BUCKET_NAME,
            Key=object_key,
            Body=data,
            ContentType=content_type,
        )
        logger.info(f"[STORAGE] ✓ Direct upload succeeded: {object_key}")
    except ClientError as e:
        logger.error(f"[STORAGE] Direct upload failed for {object_key}: {str(e)}")
        raise Exception(f"Failed to upload file: {str(e)}")


def delete_object_from_b2(object_key: str) -> None:
    """
    Delete an object from Backblaze B2/S3.
    """
    logger.info(f"[STORAGE] Attempting to delete object from B2: {object_key}")
    try:
        b2_client.delete_object(
            Bucket=settings.B2_BUCKET_NAME,
            Key=object_key,
        )
        logger.info(f"[STORAGE] Successfully deleted object from B2: {object_key}")
    except ClientError as e:
        logger.error(f"[STORAGE] Failed to delete object {object_key} from Backblaze B2: {str(e)}")


def delete_file_by_url(url: str) -> None:
    """
    Given a URL or key, extract the B2 object key and delete the file.
    """
    if not url:
        return
    
    logger.info(f"[STORAGE] Request to delete file by URL/key: {url}")
    
    # If the URL is already an object key (doesn't start with http/https)
    if not url.startswith("http"):
        delete_object_from_b2(url)
        return

    # Check if it starts with the public B2 base URL
    if settings.B2_PUBLIC_URL and url.startswith(settings.B2_PUBLIC_URL):
        key = url[len(settings.B2_PUBLIC_URL):].lstrip("/")
        delete_object_from_b2(key)
        return

    # Fallback path parser
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        path = parsed.path.lstrip("/")
        
        # Check if it is a backend media proxy URL
        if "api/upload/media/" in path:
            key = path.split("api/upload/media/", 1)[1]
            delete_object_from_b2(key)
            return

        # Check standard /file/<bucket>/ prefix
        if path.startswith("file/"):
            parts = path.split("/", 2)
            if len(parts) >= 3:
                delete_object_from_b2(parts[2])
                return
                
        # Check if B2 bucket name is in path
        if settings.B2_BUCKET_NAME in path:
            parts = path.split(settings.B2_BUCKET_NAME + "/", 1)
            if len(parts) == 2:
                delete_object_from_b2(parts[1])
                return
    except Exception as e:
        logger.error(f"[STORAGE] Failed to parse URL {url} for deletion: {str(e)}")
