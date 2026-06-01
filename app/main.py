# app/main.py
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import create_db_and_tables

# Import all routers
from app.domains.auth.router import router as auth_router
from app.domains.users.router import router as users_router, public_router as users_public_router
from app.domains.prompts.router import router as prompts_router
from app.domains.ads.router import router as ads_router, public_router as ads_public_router
from app.domains.portfolio.router import router as portfolio_router
from app.domains.analytics.router import router as analytics_router, public_router as analytics_public_router
from app.domains.integrations.router import router as integrations_router
from app.domains.integrations.router import public_router as integrations_public_router
from app.domains.uploads.router import router as uploads_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 PromptHub API starting...")
    yield
    # Shutdown
    print("🛑 PromptHub API shutting down...")

# Show API docs in every environment except production
_show_docs = settings.ENVIRONMENT.lower() != "production"

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs" if _show_docs else None,
    redoc_url="/redoc" if _show_docs else None,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    # Allow local dev + subdomain localhost (e.g. milan.localhost:3000)
    # and production subdomains (e.g. creator.creatopedia.tech).
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_origin_regex=r"^https?://([a-z0-9-]+\.)?(localhost|127\.0\.0\.1|creatopedia\.tech)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )

# Register all routers under /api prefix
PREFIX = settings.API_PREFIX

app.include_router(auth_router, prefix=PREFIX)
app.include_router(users_router, prefix=PREFIX)
app.include_router(users_public_router, prefix=PREFIX)  # Public users endpoints
app.include_router(prompts_router, prefix=PREFIX)
app.include_router(ads_router, prefix=PREFIX)
app.include_router(ads_public_router, prefix=PREFIX)
app.include_router(portfolio_router, prefix=PREFIX)
app.include_router(analytics_router, prefix=PREFIX)
app.include_router(analytics_public_router, prefix=PREFIX)  # Public analytics endpoints
app.include_router(integrations_router, prefix=PREFIX)
app.include_router(integrations_public_router, prefix=PREFIX)
app.include_router(uploads_router, prefix=PREFIX)

@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}