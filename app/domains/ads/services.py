from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, update
from app.domains.ads.models import AdClient, AdCampaign, AdPlacement
from app.domains.ads.schemas import AdClientCreate, AdCampaignCreate, AdClientUpdate, AdCampaignUpdate
from app.domains.users.models import Creator
from app.common.exceptions import NotFoundError, ForbiddenError
import uuid
import secrets

async def create_client(db: AsyncSession, creator: Creator, data: AdClientCreate) -> AdClient:
    report_token = secrets.token_urlsafe(32)
    client = AdClient(
        **data.model_dump(),
        creator_id=creator.id,
        report_token=report_token
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client

async def get_clients(db: AsyncSession, creator: Creator) -> list[AdClient]:
    result = await db.exec(select(AdClient).where(AdClient.creator_id == creator.id))
    return result.all()

async def update_client(db: AsyncSession, creator: Creator, client_id: uuid.UUID, data: AdClientUpdate) -> AdClient:
    result = await db.exec(select(AdClient).where(AdClient.id == client_id, AdClient.creator_id == creator.id))
    client = result.first()
    if not client:
        raise NotFoundError("AdClient")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(client, key, value)
    
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client

async def delete_client(db: AsyncSession, creator: Creator, client_id: uuid.UUID) -> None:
    result = await db.exec(select(AdClient).where(AdClient.id == client_id, AdClient.creator_id == creator.id))
    client = result.first()
    if not client:
        raise NotFoundError("AdClient")
    
    await db.delete(client)
    await db.commit()

async def create_campaign(db: AsyncSession, creator: Creator, data: AdCampaignCreate) -> AdCampaign:
    # Verify client belongs to creator
    client_result = await db.exec(select(AdClient).where(AdClient.id == data.client_id))
    client = client_result.first()
    if not client:
        raise NotFoundError("AdClient")
    if client.creator_id != creator.id:
        raise ForbiddenError()

    campaign = AdCampaign(
        **data.model_dump(),
        creator_id=creator.id
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign

async def get_campaigns(db: AsyncSession, creator: Creator) -> list[AdCampaign]:
    result = await db.exec(select(AdCampaign).where(AdCampaign.creator_id == creator.id))
    return result.all()

async def update_campaign(db: AsyncSession, creator: Creator, campaign_id: uuid.UUID, data: AdCampaignUpdate) -> AdCampaign:
    result = await db.exec(select(AdCampaign).where(AdCampaign.id == campaign_id, AdCampaign.creator_id == creator.id))
    campaign = result.first()
    if not campaign:
        raise NotFoundError("AdCampaign")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(campaign, key, value)
    
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign

async def delete_campaign(db: AsyncSession, creator: Creator, campaign_id: uuid.UUID) -> None:
    result = await db.exec(select(AdCampaign).where(AdCampaign.id == campaign_id, AdCampaign.creator_id == creator.id))
    campaign = result.first()
    if not campaign:
        raise NotFoundError("AdCampaign")
    
    await db.delete(campaign)
    await db.commit()

async def record_click(db: AsyncSession, campaign_id: uuid.UUID):
    result = await db.exec(select(AdCampaign).where(AdCampaign.id == campaign_id))
    campaign = result.first()
    if not campaign:
        raise NotFoundError("AdCampaign")
    
    campaign.click_count += 1
    db.add(campaign)
    await db.commit()

async def record_impression(db: AsyncSession, campaign_id: uuid.UUID):
    result = await db.exec(select(AdCampaign).where(AdCampaign.id == campaign_id))
    campaign = result.first()
    if not campaign:
        raise NotFoundError("AdCampaign")
    
    campaign.impression_count += 1
    db.add(campaign)
    await db.commit()

async def get_active_ads(db: AsyncSession, creator_id: uuid.UUID, page_type: str | None = None) -> list[AdCampaign]:
    query = select(AdCampaign).where(
        AdCampaign.creator_id == creator_id,
        AdCampaign.status == "active"
    )
    result = await db.exec(query)
    # Typically you would join with AdPlacement here to filter by page, but returning all active campaigns for now.
    return result.all()
