from app.common.pagination import PaginationParams, PaginatedResponse
from app.common.enums import PromptStatus
from sqlmodel import select
from app.domains.prompts.models import Category
# app/domains/prompts/router.py
from fastapi import APIRouter, Depends, Query, Request, UploadFile, File, Form, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_creator, get_optional_creator
from app.domains.users.models import Creator
from app.common.enums import GateType, OutputType, ContentType
from app.domains.prompts import schemas
from app.domains.prompts import services
from app.core.storage import upload_file_to_b2, generate_presigned_url
import uuid

router = APIRouter(tags=["Prompts"])

def resolve_prompt_content(prompt):
    """Helper to swap S3 key with Presigned URL if it is a PDF."""
    if prompt.content_type == ContentType.pdf and prompt.content:
        # Avoid double-wrapping if it's already a full HTTP URL
        if not prompt.content.startswith("http"):
            prompt.content = generate_presigned_url(prompt.content)
    return prompt

@router.get("/prompts", response_model=PaginatedResponse[schemas.PromptOut])
async def list_prompts(
    creator_id: Optional[uuid.UUID] = Query(None),
    category_id: Optional[uuid.UUID] = Query(None),
    status: Optional[PromptStatus] = Query(None),
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
):
    items, total = await services.get_prompts(
        db, params, creator_id, category_id, status
    )
    for item in items:
        resolve_prompt_content(item)
    return PaginatedResponse.build(items, total, params)

@router.post("/prompts", response_model=schemas.PromptOut, status_code=201)
async def create_prompt(
    title: str = Form(...),
    description: str | None = Form(None),
    price: float | None = Form(None),
    ai_tool: str | None = Form(None),
    status: str | None = Form(None),
    output_type: OutputType = Form(OutputType.text),
    gate_type: GateType = Form(GateType.open),
    category_id: uuid.UUID | None = Form(None),
    content: str | None = Form(None),
    thumbnail_url: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator)
):
    # Normalize empty strings to None
    description = description if description else None
    ai_tool = ai_tool if ai_tool else None
    status = status if status else None
    content = content if content else None
    thumbnail_url = thumbnail_url if thumbnail_url else None
    
    if file:
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        try:
            # Upload the PDF file to BackBlaze B2 / S3 using storage utility
            pdf_url = await upload_file_to_b2(file.file, file.filename, file.content_type)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        prompt_data = schemas.PromptCreate(
            title=title,
            description=description,
            price=price,
            ai_tool=ai_tool,
            output_type=output_type,
            gate_type=gate_type,
            category_id=category_id,
            content=pdf_url,
            content_type=ContentType.pdf,
            thumbnail_url=thumbnail_url,
        )
    else:
        if not content:
            raise HTTPException(status_code=400, detail="Either 'content' or 'file' must be provided")
        prompt_data = schemas.PromptCreate(
            title=title,
            description=description,
            price=price,
            ai_tool=ai_tool,
            output_type=output_type,
            gate_type=gate_type,
            category_id=category_id,
            content=content,
            content_type=ContentType.text,
            thumbnail_url=thumbnail_url,
        )

    try:
        parsed_status = PromptStatus(status) if status else PromptStatus.draft
        prompt = await services.create_prompt(db, creator, prompt_data)
        prompt.status = parsed_status
        db.add(prompt)
        await db.commit()
        await db.refresh(prompt)
        if file:
            prompt.content_type = ContentType.pdf
            db.add(prompt)
            await db.commit()
            await db.refresh(prompt)
        return resolve_prompt_content(prompt)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/prompts/{prompt_id}", response_model=schemas.PromptOut)
async def get_prompt(prompt_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    prompt = await services.get_prompt_by_id(db, prompt_id)
    return resolve_prompt_content(prompt)

@router.patch("/prompts/{prompt_id}", response_model=schemas.PromptOut)
async def update_prompt(
    prompt_id: uuid.UUID,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    ai_tool: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    gate_type: Optional[GateType] = Form(None),
    category_id: Optional[uuid.UUID] = Form(None),
    content: Optional[str] = Form(None),
    thumbnail_url: Optional[str] = Form(None),
    file: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator),
):
    update_data = {}
    print(f"Received update for prompt {prompt_id} with fields: title={title}, description={description}, price={price}, ai_tool={ai_tool}, status={status}, gate_type={gate_type}, category_id={category_id}, content={'[file upload]' if file else content}, thumbnail_url={thumbnail_url}")
    
    # For PATCH, only include fields that are explicitly provided (not None and not empty strings)
    if title: update_data["title"] = title
    if description: update_data["description"] = description
    if price is not None: update_data["price"] = price
    if ai_tool: update_data["ai_tool"] = ai_tool
    if status:
        try:
            update_data["status"] = PromptStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid prompt status: {status}")
    if gate_type is not None: update_data["gate_type"] = gate_type
    if category_id is not None: update_data["category_id"] = category_id
    if content: update_data["content"] = content
    if thumbnail_url: update_data["thumbnail_url"] = thumbnail_url

    if file:
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        try:
            # Upload the new PDF file to BackBlaze B2
            pdf_url = await upload_file_to_b2(file.file, file.filename, file.content_type)
            update_data["content"] = pdf_url
            update_data["content_type"] = ContentType.pdf
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    elif "content" in update_data:
        update_data["content_type"] = ContentType.text

    # Construct the schema so we pass clean data to the service layer
    prompt_update = schemas.PromptUpdate(**update_data)
    
    prompt = await services.update_prompt(db, prompt_id, creator, prompt_update)
    return resolve_prompt_content(prompt)

@router.delete("/prompts/{prompt_id}", status_code=204)
async def delete_prompt(
    prompt_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator),
):
    await services.delete_prompt(db, prompt_id, creator)

@router.get("/prompts/{prompt_id}/page", response_model=schemas.PromptPageOut)
async def get_prompt_page(
    prompt_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    creator: Optional[Creator] = Depends(get_optional_creator),
):
    prompt = await services.get_prompt_by_id(db, prompt_id)
    resolve_prompt_content(prompt)
    is_owner = creator and creator.id == prompt.creator_id
    return schemas.PromptPageOut(
        id=prompt.id,
        title=prompt.title,
        description=prompt.description,
        # Only reveal content if open or owner is viewing
        content=prompt.content if (prompt.gate_type == GateType.open or is_owner) else None,
        content_type=prompt.content_type,
        gate_type=prompt.gate_type,
        price=prompt.price,
        ai_tool=prompt.ai_tool,
        output_type=prompt.output_type,
        creator={"id": str(prompt.creator_id)},
        category=prompt.category,
        is_gated=prompt.gate_type != GateType.open and not is_owner,
    )

@router.get("/categories", response_model=list[schemas.CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)):
    from sqlmodel import select
    result = await db.exec(select(Category))
    return result.all()

class CategoryCreateUpdate(schemas.BaseModel):
    name: str
    slug: str
    icon: Optional[str] = None

@router.post("/categories", response_model=schemas.CategoryOut, status_code=201)
async def create_category(
    data: CategoryCreateUpdate, 
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator)
):
    category = Category(**data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@router.put("/categories/{category_id}", response_model=schemas.CategoryOut)
async def update_category(
    category_id: uuid.UUID, 
    data: CategoryCreateUpdate, 
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator)
):
    from app.common.exceptions import NotFoundError
    category = await db.get(Category, category_id)
    if not category:
        raise NotFoundError("Category")
    for key, value in data.model_dump().items():
        setattr(category, key, value)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@router.delete("/categories/{category_id}", status_code=204)
async def delete_category(
    category_id: uuid.UUID, 
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator)
):
    from app.common.exceptions import NotFoundError
    category = await db.get(Category, category_id)
    if not category:
        raise NotFoundError("Category")
    await db.delete(category)
    await db.commit()

@router.get("/platforms")
async def list_platforms():
    """Return supported social platforms"""
    return [
        {"id": "youtube", "name": "YouTube"},
        {"id": "tiktok", "name": "TikTok"},
        {"id": "instagram", "name": "Instagram"},
        {"id": "twitter", "name": "Twitter / X"},
    ]

@router.post("/email-capture", status_code=201)
async def capture_email(
    request: Request,
    data: schemas.EmailCaptureCreate,
    db: AsyncSession = Depends(get_db),
):
    ip = request.client.host if request.client else None
    return await services.capture_email(db, data, ip)