from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_creator
from app.domains.users.models import Creator
from app.domains.integrations import services, schemas
import uuid

router = APIRouter(prefix="/instagram", tags=["Instagram Integration"])
public_router = APIRouter(prefix="/public/instagram", tags=["Instagram Public"])

@router.post("/import-post", status_code=201)
async def import_instagram_post(
    data: schemas.ImportPostRequest,
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator),
):
    """
    Fetch a single Instagram post by ID and create a Prompt from it.
    The caption becomes the prompt content; the image URL becomes the thumbnail.
    """
    try:
        post = await services.fetch_single_instagram_post(creator, db, data.post_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch Instagram post: {str(e)}")

    caption = post.get("caption") or ""
    media_url = post.get("media_url") or ""
    thumbnail_url = post.get("thumbnail_url") or media_url

    # Derive title: first line of caption, capped at 60 chars, or use provided title
    if data.title:
        title = data.title
    elif caption:
        title = caption.split("\n")[0].strip()[:60] or "Instagram Prompt"
    else:
        title = "Instagram Prompt"

    # Build description from remainder of caption
    description = data.description
    if not description and caption:
        lines = caption.split("\n")
        if len(lines) > 1:
            description = "\n".join(lines[1:]).strip()[:500]

    content = caption or f"See Instagram post: {post.get('permalink', '')}"

    from app.domains.prompts.schemas import PromptCreate
    from app.domains.prompts.services import create_prompt
    from app.common.enums import GateType, ContentType, OutputType

    gate = GateType.open
    for g in GateType:
        if g.value == data.gate_type:
            gate = g
            break

    prompt_data = PromptCreate(
        title=title,
        description=description,
        content=content,
        content_type=ContentType.text,
        ai_tool=data.ai_tool,
        output_type=OutputType.image,
        gate_type=gate,
        category_id=data.category_id,
        thumbnail_url=thumbnail_url or None,
    )

    try:
        prompt = await create_prompt(db, creator, prompt_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create prompt: {str(e)}")

    return {
        "id": str(prompt.id),
        "title": prompt.title,
        "slug": prompt.slug,
        "thumbnail_url": prompt.thumbnail_url,
        "instagram_post_id": data.post_id,
        "permalink": post.get("permalink"),
    }


@router.get("/auth-url", response_model=schemas.OAuthResponse)
async def get_instagram_auth_url(creator: Creator = Depends(get_current_creator)):
    # Generate URL with a state token matching the user ID for security
    url = services.get_oauth_url(state=str(creator.id))
    return {"url": url}

@router.get("/callback")
async def instagram_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    from app.domains.users.services import get_creator_by_id
    creator = await get_creator_by_id(db, state)
    if not creator:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    try:
        token_data = await services.exchange_code_for_token(code)
        
        # User profile to get username
        async with getattr(services, 'httpx', __import__('httpx')).AsyncClient() as client:
            resp = await client.get(
                f"{services.INSTAGRAM_API}/me",
                params={"fields": "id,username", "access_token": token_data["access_token"]}
            )
            resp.raise_for_status()
            user_data = resp.json()
            token_data["user_id"] = user_data.get("id")
            # We'll patch save_instagram_token to also take username if needed, 
            # but currently the model requires it to not be null. Let's pass it by modifying
            # the token_data dict
            token_data["username"] = user_data.get("username", "instagram_user")

        await services.save_instagram_token(db, creator, token_data)
        return {"status": "success", "message": "Instagram connected successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to connect Instagram: {str(e)}")

@router.get("/posts", response_model=list[schemas.InstagramPost])
async def fetch_posts(
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator)
):
    try:
        posts = await services.fetch_instagram_posts(creator, db)
        return posts
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch posts: {str(e)}")

@router.get("/status", response_model=schemas.InstagramStatus)
async def check_status(
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator)
):
    from sqlmodel import select
    from app.domains.integrations.models import InstagramToken
    result = await db.exec(select(InstagramToken).where(
        InstagramToken.creator_id == creator.id,
        InstagramToken.is_valid == True
    ))
    token = result.first()
    if token:
        return {
            "is_connected": True,
            "username": token.username,
            "expires_at": token.expires_at
        }
    return {"is_connected": False}

@router.post("/disconnect")
async def disconnect_instagram(
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator)
):
    from sqlmodel import select
    from app.domains.integrations.models import InstagramToken
    result = await db.exec(select(InstagramToken).where(InstagramToken.creator_id == creator.id))
    token = result.first()
    if token:
        await db.delete(token)
        await db.commit()
    return {"status": "disconnected"}

@public_router.get("/{creator_id}/user")
async def get_public_instagram_user(creator_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    from sqlmodel import select
    from app.domains.integrations.models import InstagramToken
    from app.domains.users.services import get_creator_by_id

    creator = await get_creator_by_id(db, str(creator_id))
    if not creator:
        return None

    result = await db.exec(select(InstagramToken).where(
        InstagramToken.creator_id == creator.id,
        InstagramToken.is_valid == True
    ))
    token = result.first()
    if not token:
        return None

    return {
        "username": token.username,
        "media_count": 0,
        "followers_count": 0,
        "follows_count": 0,
        "profile_picture_url": None,
        "biography": getattr(creator, "bio", "")
    }

@public_router.get("/{creator_id}/feed")
async def get_public_instagram_feed(
    creator_id: uuid.UUID,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    from app.domains.users.services import get_creator_by_id
    creator = await get_creator_by_id(db, str(creator_id))
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
        
    try:
        posts = await services.fetch_instagram_posts(creator, db)
        return posts[:limit]
    except Exception as e:
        # Don't fail the page loading on public feed fetch
        return []

@public_router.get("/{creator_id}/media")
async def get_public_instagram_media(
    creator_id: uuid.UUID,
    url: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    # Try to find a matching post in the feed or return empty
    from app.domains.users.services import get_creator_by_id
    creator = await get_creator_by_id(db, str(creator_id))
    if not creator:
        return {}
        
    try:
        posts = await services.fetch_instagram_posts(creator, db)
        for p in posts:
            if p.get("permalink") == url:
                return p
        return {"permalink": url}
    except Exception:
        return {"permalink": url}
