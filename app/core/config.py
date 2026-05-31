# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_NAME: str = "PromptHub API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    API_PREFIX: str = "/api"
    COOKIE_DOMAIN: str | None = None

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Auth / JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Instagram OAuth
    INSTAGRAM_CLIENT_ID: str = ""
    INSTAGRAM_CLIENT_SECRET: str = ""
    INSTAGRAM_REDIRECT_URI: str = ""

    # Storage — Backblaze B2 (S3-compatible API)
    # B2_ENDPOINT_URL  → e.g. https://s3.us-west-004.backblazeb2.com
    # B2_KEY_ID        → Application Key ID from the B2 dashboard
    # B2_APPLICATION_KEY → Application Key secret
    # B2_BUCKET_NAME   → Name of the B2 bucket
    # B2_PUBLIC_URL    → Public CDN / download base URL, e.g. https://f004.backblazeb2.com/file/<bucket-name>
    B2_ENDPOINT_URL: str = ""
    B2_KEY_ID: str = ""
    B2_APPLICATION_KEY: str = ""
    B2_BUCKET_NAME: str = ""
    B2_PUBLIC_URL: str = ""

    # Cron security
    CRON_SECRET: str = ""

    # Internal API secret (used by frontend server to call protected internal endpoints)
    INTERNAL_API_SECRET: str = ""
    # Optional comma-separated IP allowlist for internal API callers (e.g. "1.2.3.4,5.6.7.8")
    INTERNAL_API_ALLOWLIST: str | None = None
    # Subdomain blacklist (comma-separated). Names not allowed to be claimed as subdomains.
    SUBDOMAIN_BLACKLIST: str | None = None

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Email
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    @field_validator("COOKIE_DOMAIN", mode="before")
    @classmethod
    def _empty_cookie_domain_to_none(cls, v: object) -> object:
        # `.env` often uses COOKIE_DOMAIN="" in dev; passing an empty `Domain=` attribute
        # causes browsers to reject Set-Cookie. Treat empty as unset.
        if v is None:
            return None
        if isinstance(v, str) and v.strip() == "":
            return None
        return v

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()