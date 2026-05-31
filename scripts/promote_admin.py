import argparse
import asyncio
import os
import sys
import secrets
from dotenv import load_dotenv
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

# Ensure the root of the project is in the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import engine
from app.domains.users.models import Creator

load_dotenv()

async def promote_admin(provided_secret: str):
    admin_email = os.getenv("ADMIN_EMAIL")
    expected_secret = os.getenv("ADMIN_PROMOTE_SECRET")
    
    if not admin_email or not expected_secret:
        print("❌ Error: ADMIN_EMAIL or ADMIN_PROMOTE_SECRET is not set in your .env file.")
        print("Please add ADMIN_EMAIL='your@email.com' and ADMIN_PROMOTE_SECRET='your_super_secret_key' to .env and run again.")
        sys.exit(1)

    # Use secrets.compare_digest to prevent timing attacks when checking the secret
    if not secrets.compare_digest(provided_secret, expected_secret):
        print("❌ Error: Invalid secret key provided. Access denied.")
        sys.exit(1)

    print(f"🔍 Searching for user with email: {admin_email}...")
    
    async with AsyncSession(engine) as db:
        result = await db.exec(select(Creator).where(Creator.email == admin_email))
        user = result.first()
        
        if user:
            if user.role == 'admin':
                print(f"✅ User {admin_email} is already an admin!")
            else:
                user.role = 'admin'
                db.add(user)
                await db.commit()
                print(f"🎉 Success! User {admin_email} has been promoted to admin.")
        else:
            print(f"❌ User not found with email: {admin_email}")
            print("Make sure you have registered an account with this email on the frontend first.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Promote a user to admin.")
    parser.add_argument("--secret", required=True, help="The secret key required to execute this script.")
    args = parser.parse_args()
    
    asyncio.run(promote_admin(args.secret))
