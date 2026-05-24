import asyncio
import json
from uuid import UUID
from datetime import datetime
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

# Import the database engine
from app.core.database import engine

# Import Models
from app.domains.users.models import Creator
from app.domains.prompts.models import Prompt, Category
try:
    from app.domains.integrations.models import InstagramToken
except ImportError:
    InstagramToken = None
    
try:
    from app.domains.portfolio.models import Portfolio
except ImportError:
    Portfolio = None

try:
    from app.domains.ads.models import Campaign
except ImportError:
    Campaign = None

try:
    from app.domains.analytics.models import AnalyticsEvent
except ImportError:
    AnalyticsEvent = None


# Custom JSON encoder to handle UUIDs and Datetimes
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, UUID):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

async def dump_table(session: AsyncSession, model, table_name: str):
    if not model:
        return
        
    print(f"\n{'='*50}")
    print(f" 🗃️  TABLE: {table_name.upper()}")
    print(f"{'='*50}")
    
    result = await session.execute(select(model))
    items = result.scalars().all()
    
    if not items:
        print("  (Empty)")
        return
        
    for item in items:
        data = item.model_dump()
        formatted_json = json.dumps(data, indent=2, cls=CustomJSONEncoder)
        print(formatted_json)
        print("-" * 50)


async def main():
    print("Connecting to the database and fetching all records...\n")
    async with AsyncSession(engine) as session:
        await dump_table(session, Creator, "Creators")
        await dump_table(session, Category, "Categories")
        await dump_table(session, Prompt, "Prompts")
        await dump_table(session, Portfolio, "Portfolios")
        await dump_table(session, Campaign, "Ad Campaigns")
        await dump_table(session, AnalyticsEvent, "Analytics Events")

if __name__ == "__main__":
    asyncio.run(main())
