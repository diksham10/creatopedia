from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, or_
from app.core.database import get_db
from app.core.security import get_current_creator
from app.domains.users.models import Creator
from app.domains.ads import schemas, services
from app.domains.ads.models import AdPlacement, AdCampaign
from app.common.enums import AdStatus, PageType
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/ads", tags=["Ads"])
public_router = APIRouter(prefix="/public/ads", tags=["Ads (Public)"])

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


@router.get("/placements/discovery", response_model=list[schemas.AdPlacementOut])
async def get_discovery_placements(
    creator_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    query = select(AdPlacement).join(AdCampaign).where(
        AdCampaign.creator_id == creator_id,
        AdPlacement.page_type == PageType.discovery
    )
    result = await db.exec(query)
    return result.all()


@router.post("/placements/discovery", response_model=list[schemas.AdPlacementOut])
async def update_discovery_placements(
    data: schemas.DiscoverySlotsUpdate,
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator)
):
    # Verify all campaign ids belong to the creator
    campaign_ids = [slot.campaign_id for slot in data.slots]
    if campaign_ids:
        camp_query = select(AdCampaign.id).where(
            AdCampaign.id.in_(campaign_ids),
            AdCampaign.creator_id == creator.id
        )
        camp_result = await db.exec(camp_query)
        valid_campaign_ids = set(camp_result.all())
        
        for cid in campaign_ids:
            if cid not in valid_campaign_ids:
                raise HTTPException(status_code=400, detail=f"Campaign {cid} not found or unauthorized")

    # Fetch existing discovery placements
    existing_query = select(AdPlacement).join(AdCampaign).where(
        AdCampaign.creator_id == creator.id,
        AdPlacement.page_type == PageType.discovery
    )
    existing_result = await db.exec(existing_query)
    for p in existing_result.all():
        await db.delete(p)

    # Insert new ones
    new_placements = []
    for slot in data.slots:
        position = "discovery_header_banner" if slot.index == -1 else f"discovery_slot_{slot.index}"
        placement = AdPlacement(
            position=position,
            page_type=PageType.discovery,
            campaign_id=slot.campaign_id,
            priority=0,
            prompt_id=None,
            category_id=None
        )
        db.add(placement)
        new_placements.append(placement)

    await db.commit()
    for p in new_placements:
        await db.refresh(p)
    return new_placements


@public_router.get("/placements")
async def get_public_ad_placements(
    creator_id: uuid.UUID = Query(...),
    page_type: str | None = Query(None),
    prompt_id: uuid.UUID | None = Query(None),
    category_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint used by the frontend to fetch active ad placements for a
    creator page or prompt page.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    query = (
        select(AdPlacement, AdCampaign)
        .join(AdCampaign, AdPlacement.campaign_id == AdCampaign.id)
        .where(
            AdCampaign.creator_id == creator_id,
            AdCampaign.status == AdStatus.active,
        )
    )

    # If prompt_id or category_id is specified, fetch matching context-specific or global placements
    if prompt_id or category_id:
        conditions = [
            (AdPlacement.prompt_id == None) & (AdPlacement.category_id == None)
        ]
        if prompt_id:
            conditions.append(AdPlacement.prompt_id == prompt_id)
        if category_id:
            conditions.append(AdPlacement.category_id == category_id)
        query = query.where(or_(*conditions))
    elif page_type:
        normalized_page_type = page_type.strip().lower()
        if normalized_page_type in {"creator_page", "creator-page", "creator"}:
            query = query.where(
                (AdPlacement.prompt_id == None) & (AdPlacement.category_id == None)
            )
        else:
            query = query.where(AdPlacement.page_type == normalized_page_type)

    result = await db.exec(query)
    rows = result.all()

    placements = []
    for placement, campaign in rows:
        if campaign.start_date and campaign.start_date > now.date():
            continue
        if campaign.end_date and campaign.end_date < now.date():
            continue

        placements.append({
            "id": str(placement.id),
            "position": placement.position,
            "is_global": placement.page_type == PageType.global_,
            "prompt_id": str(placement.prompt_id) if placement.prompt_id else None,
            "category_id": str(placement.category_id) if placement.category_id else None,
            "creator_id": str(campaign.creator_id),
            "created_at": placement.created_at.isoformat() if placement.created_at else None,
            "campaign": {
                "id": str(campaign.id),
                "creator_id": str(campaign.creator_id),
                "client_id": str(campaign.client_id) if campaign.client_id else None,
                "name": campaign.name,
                "banner_url": campaign.banner_url,
                "banner_alt": None,
                "target_url": campaign.target_url,
                "utm_source": "",
                "utm_medium": "",
                "utm_campaign": None,
                "client_webhook_url": None,
                "report_token": None,
                "status": campaign.status.value if hasattr(campaign.status, "value") else campaign.status,
                "starts_at": campaign.start_date.isoformat() if campaign.start_date else None,
                "ends_at": campaign.end_date.isoformat() if campaign.end_date else None,
                "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
                "updated_at": campaign.updated_at.isoformat() if campaign.updated_at else None,
            },
        })

    return placements
