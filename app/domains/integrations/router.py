from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_creator
from app.domains.users.models import Creator
from app.domains.integrations import services, schemas

router = APIRouter(prefix="/api/instagram", tags=["Instagram Integration"])

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
