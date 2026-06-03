# app/domains/uploads/services.py
# Delegates all storage operations to app.core.storage — no boto3 here.

from app.core.storage import generate_presigned_upload_url

__all__ = ["generate_presigned_upload_url"]