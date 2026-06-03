# app/domains/prompts/services.py
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, func
from app.domains.prompts.models import Prompt, Category, EmailCapture
from app.domains.prompts.schemas import PromptCreate, PromptUpdate, EmailCaptureCreate
from app.domains.users.models import Creator
from app.common.exceptions import NotFoundError, ForbiddenError, ConflictError
from app.common.pagination import PaginationParams
from app.common.enums import PromptStatus, GateType, ContentType
import uuid, re
from urllib.parse import urlparse

def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9-]", "", re.sub(r"\s+", "-", text.lower()))

def validate_content_type(content_type: ContentType, content: str):
    if content_type == ContentType.pdf:
        # Simple URL validation
        parsed_url = urlparse(content)
        if not all([parsed_url.scheme, parsed_url.netloc]):
            raise ValueError("When content type is PDF, content must be a valid URL")

async def create_prompt(
    db: AsyncSession, creator: Creator, data: PromptCreate
) -> Prompt:
    validate_content_type(data.content_type, data.content)
    
    slug = slugify(data.title)
    # Ensure slug uniqueness per creator
    count = await db.exec(
        select(func.count(Prompt.id)).where(
            Prompt.creator_id == creator.id,
            Prompt.slug.startswith(slug)
        )
    )
    total = count.first() or 0
    final_slug = slug if total == 0 else f"{slug}-{total}"

    prompt = Prompt(
        creator_id=creator.id,
        slug=final_slug,
        **data.model_dump()
    )
    db.add(prompt)
    await db.commit()
    await db.refresh(prompt)
    return prompt

async def get_prompts(
    db: AsyncSession,
    params: PaginationParams,
    creator_id: uuid.UUID | None = None,
    category_id: uuid.UUID | None = None,
    status: PromptStatus | None = None,
):
    query = select(Prompt)
    if creator_id:
        query = query.where(Prompt.creator_id == creator_id)
    if category_id:
        query = query.where(Prompt.category_id == category_id)
    if status:
        query = query.where(Prompt.status == status)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.exec(count_q)).first()

    query = query.offset(params.offset).limit(params.limit)
    items = (await db.exec(query)).all()
    return items, total

async def get_prompt_by_id(db: AsyncSession, prompt_id: uuid.UUID) -> Prompt:
    result = await db.exec(select(Prompt).where(Prompt.id == prompt_id))
    prompt = result.first()
    if not prompt:
        raise NotFoundError("Prompt")
    return prompt

async def update_prompt(
    db: AsyncSession, prompt_id: uuid.UUID, creator: Creator, data: PromptUpdate
) -> Prompt:
    prompt = await get_prompt_by_id(db, prompt_id)
    if prompt.creator_id != creator.id:
        raise ForbiddenError()
    
    content_type_to_validate = data.content_type if data.content_type else prompt.content_type
    content_to_validate = data.content if data.content else prompt.content
    validate_content_type(content_type_to_validate, content_to_validate)

    # Track old files to delete if they are replaced with new values
    old_pdf_to_delete = None
    if data.content and prompt.content_type == ContentType.pdf and prompt.content != data.content:
        old_pdf_to_delete = prompt.content
        
    old_thumbnail_to_delete = None
    if data.thumbnail_url and prompt.thumbnail_url and prompt.thumbnail_url != data.thumbnail_url:
        old_thumbnail_to_delete = prompt.thumbnail_url

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(prompt, field, value)
    prompt.touch()
    print(f"Updating prompt {prompt.id} with data: {data}")
    db.add(prompt)
    await db.commit()
    await db.refresh(prompt)

    # Clean up replaced files from storage
    if old_pdf_to_delete or old_thumbnail_to_delete:
        from app.core.storage import delete_file_by_url
        if old_pdf_to_delete:
            delete_file_by_url(old_pdf_to_delete)
        if old_thumbnail_to_delete:
            delete_file_by_url(old_thumbnail_to_delete)

    return prompt

async def delete_prompt(
    db: AsyncSession, prompt_id: uuid.UUID, creator: Creator
) -> None:
    prompt = await get_prompt_by_id(db, prompt_id)
    if prompt.creator_id != creator.id:
        raise ForbiddenError()
    
    # Store references to fields before deletion
    content = prompt.content
    content_type = prompt.content_type
    thumbnail_url = prompt.thumbnail_url

    await db.delete(prompt)
    await db.commit()

    # Clean up physical files from B2 storage
    from app.core.storage import delete_file_by_url
    if content_type == ContentType.pdf and content:
        delete_file_by_url(content)
    if thumbnail_url:
        delete_file_by_url(thumbnail_url)

# Make sure to import the Prompt model at the top of your file if it's not already there!
from app.domains.prompts.models import Prompt
from app.common.exceptions import BadRequestError # Or NotFoundError depending on your setup

async def capture_email(
    db: AsyncSession, data: EmailCaptureCreate, ip: str | None
):
    # 1. Fetch the prompt first so we can return its hidden content
    prompt = await db.get(Prompt, data.prompt_id)
    if not prompt:
        raise BadRequestError("Prompt not found")

    # 2. Check for duplicate capture
    existing = await db.exec(
        select(EmailCapture).where(
            EmailCapture.email == data.email,
            EmailCapture.prompt_id == data.prompt_id
        )
    )
    capture = existing.first()
    
    # 3. If they haven't entered their email before, save it!
    if not capture:
        capture = EmailCapture(
            email=data.email,
            name=data.name,
            prompt_id=data.prompt_id,
            ip_address=ip,
        )
        db.add(capture)
        await db.commit()
        await db.refresh(capture)

    # 4. Return the dictionary containing the content the Next.js frontend is waiting for!
    return {
        "success": True,
        "capture_id": str(capture.id),
        "content": prompt.content
    }