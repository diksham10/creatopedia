import asyncio
import json
from uuid import UUID
from datetime import datetime, date
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import engine

# Import app.main to load all models and relations
import app.main

from app.domains.ads.models import AdCampaign, AdPlacement, AdClient

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, UUID):
            return str(obj)
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

async def dump_ads():
    async with AsyncSession(engine) as session:
        print("--- CLIENTS ---")
        clients = (await session.execute(select(AdClient))).scalars().all()
        for c in clients:
            print(json.dumps(c.model_dump(), indent=2, cls=CustomJSONEncoder))
            
        print("\n--- CAMPAIGNS ---")
        campaigns = (await session.execute(select(AdCampaign))).scalars().all()
        for c in campaigns:
            print(json.dumps(c.model_dump(), indent=2, cls=CustomJSONEncoder))

        print("\n--- PLACEMENTS ---")
        placements = (await session.execute(select(AdPlacement))).scalars().all()
        for p in placements:
            print(json.dumps(p.model_dump(), indent=2, cls=CustomJSONEncoder))

if __name__ == "__main__":
    asyncio.run(dump_ads())
