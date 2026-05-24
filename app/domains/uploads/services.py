# app/domains/uploads/services.py
# Delegates all storage operations to app.core.storage — no boto3 here.

from fastapi import UploadFile
from app.core.storage import upload_image, upload_pdf

__all__ = ["upload_image", "upload_pdf"]