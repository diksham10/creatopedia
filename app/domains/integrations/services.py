# app/domains/integrations/services.py
import httpx
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.domains.integrations.models import InstagramToken
from app.domains.users.models import Creator
from app.core.config import settings
from datetime import datetime, timedelta, timezone

INSTAGRAM_API = "https://graph.instagram.com"
OAUTH_URL = "https://api.instagram.com/oauth/authorize"
TOKEN_URL = "https://api.instagram.com/oauth/access_token"
LONG_LIVED_URL = f"{INSTAGRAM_API}/access_token"

def get_oauth_url(state: str) -> str:
    params = {
        "client_id": settings.INSTAGRAM_CLIENT_ID,
        "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
        "scope": "user_profile,user_media",
        "response_type": "code",
        "state": state,
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{OAUTH_URL}?{query}"

async def exchange_code_for_token(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        # Short-lived token
        resp = await client.post(TOKEN_URL, data={
            "client_id": settings.INSTAGRAM_CLIENT_ID,
            "client_secret": settings.INSTAGRAM_CLIENT_SECRET,
            "grant_type": "authorization_code",
            "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
            "code": code,
        })
        resp.raise_for_status()
        short_lived = resp.json()

        # Exchange for long-lived token
        long_resp = await client.get(LONG_LIVED_URL, params={
            "grant_type": "ig_exchange_token",
            "client_secret": settings.INSTAGRAM_CLIENT_SECRET,
            "access_token": short_lived["access_token"],
        })
        long_resp.raise_for_status()
        return {**short_lived, **long_resp.json()}

async def save_instagram_token(
    db: AsyncSession, creator: Creator, token_data: dict
) -> InstagramToken:
    existing = await db.exec(
        select(InstagramToken).where(InstagramToken.creator_id == creator.id)
    )
    token = existing.first()

    expires_at = datetime.now(timezone.utc) + timedelta(
        seconds=token_data.get("expires_in", 5184000)   # 60 days default
    )
    if not token:
        token = InstagramToken(creator_id=creator.id)

    token.access_token = token_data["access_token"]
    token.instagram_user_id = str(token_data.get("user_id", ""))
    token.username = token_data.get("username", "instagram_user")
    token.expires_at = expires_at
    token.last_refreshed_at = datetime.now(timezone.utc)
    token.is_valid = True
    db.add(token)
    await db.commit()
    await db.refresh(token)
    return token

async def fetch_instagram_posts(creator: Creator, db: AsyncSession) -> list:
    result = await db.exec(
        select(InstagramToken).where(
            InstagramToken.creator_id == creator.id,
            InstagramToken.is_valid == True,
        )
    )
    token = result.first()
    if not token:
        return []

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{INSTAGRAM_API}/me/media",
            params={
                "fields": "id,caption,media_url,thumbnail_url,permalink,media_type,timestamp",
                "access_token": token.access_token,
            }
        )
        resp.raise_for_status()
        return resp.json().get("data", [])

async def refresh_all_expiring_tokens(db: AsyncSession) -> int:
    """Refresh tokens expiring within 7 days. Called by cron."""
    threshold = datetime.now(timezone.utc) + timedelta(days=7)
    result = await db.exec(
        select(InstagramToken).where(
            InstagramToken.is_valid == True,
            InstagramToken.expires_at <= threshold,
        )
    )
    tokens = result.all()

    refreshed = 0
    async with httpx.AsyncClient() as client:
        for token in tokens:
            try:
                resp = await client.get(
                    f"{INSTAGRAM_API}/refresh_access_token",
                    params={
                        "grant_type": "ig_refresh_token",
                        "access_token": token.access_token,
                    }
                )
                resp.raise_for_status()
                data = resp.json()
                token.access_token = data["access_token"]
                token.expires_at = datetime.now(timezone.utc) + timedelta(
                    seconds=data.get("expires_in", 5184000)
                )
                token.last_refreshed_at = datetime.now(timezone.utc)
                db.add(token)
                refreshed += 1
            except Exception:
                token.is_valid = False
                db.add(token)

    await db.commit()
    return refreshed