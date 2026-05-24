# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
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

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Email
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()