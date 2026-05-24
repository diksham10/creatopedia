# app/domains/uploads/router.py
from fastapi import APIRouter, UploadFile, File, Depends
from app.core.security import get_current_creator
from app.domains.uploads import services

router = APIRouter(prefix="/upload", tags=["Uploads"])

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    creator=Depends(get_current_creator),
):
    url = await services.upload_image(file, folder=f"creators/{creator.id}")
    return {"url": url}

@router.post("/pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    creator=Depends(get_current_creator),
):
    url = await services.upload_pdf(file, folder=f"creators/{creator.id}/pdfs")
    return {"url": url}