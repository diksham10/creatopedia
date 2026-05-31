from fastapi import APIRouter, Depends, status
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_creator
from app.domains.users.models import Creator
from app.domains.ads import schemas, services
import uuid

router = APIRouter(prefix="/ads", tags=["Ads"])

@router.post("/clients", response_model=schemas.AdClientOut, status_code=status.HTTP_201_CREATED)
async def create_client(
    data: schemas.AdClientCreate,
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator)
):
    return await services.create_client(db, creator, data)

@router.get("/clients", response_model=list[schemas.AdClientOut])
async def list_clients(
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator)
):
    return await services.get_clients(db, creator)

@router.patch("/clients/{client_id}", response_model=schemas.AdClientOut)
async def update_client(
    client_id: uuid.UUID,
    data: schemas.AdClientUpdate,
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator)
):
    return await services.update_client(db, creator, client_id, data)

@router.delete("/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator)
):
    await services.delete_client(db, creator, client_id)
    return None

@router.post("/campaigns", response_model=schemas.AdCampaignOut, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    data: schemas.AdCampaignCreate,
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator)
):
    return await services.create_campaign(db, creator, data)

@router.get("/", response_model=list[schemas.AdCampaignOut])
async def get_active_ads(
    creator_id: uuid.UUID,
    page_type: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Public endpoint to fetch active ads so the frontend knows what to display.
    """
    return await services.get_active_ads(db, creator_id, page_type)

@router.get("/campaigns", response_model=list[schemas.AdCampaignOut])
async def list_campaigns(
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator)
):
    return await services.get_campaigns(db, creator)

@router.patch("/campaigns/{campaign_id}", response_model=schemas.AdCampaignOut)
async def update_campaign(
    campaign_id: uuid.UUID,
    data: schemas.AdCampaignUpdate,
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator)
):
    return await services.update_campaign(db, creator, campaign_id, data)

@router.delete("/campaigns/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator)
):
    await services.delete_campaign(db, creator, campaign_id)
    return None

@router.post("/{campaign_id}/click", status_code=status.HTTP_202_ACCEPTED)
async def record_click(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    await services.record_click(db, campaign_id)
    return {"status": "recorded"}

@router.post("/{campaign_id}/impression", status_code=status.HTTP_202_ACCEPTED)
async def record_impression(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    await services.record_impression(db, campaign_id)
    return {"status": "recorded"}
