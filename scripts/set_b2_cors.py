#!/usr/bin/env python3
"""
Set CORS rules on the Backblaze B2 bucket so the browser can PUT files
directly using presigned URLs from any origin.

Run:  python scripts/set_b2_cors.py
"""
import os
import boto3
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

endpoint   = os.environ["B2_ENDPOINT_URL"]
key_id     = os.environ["B2_KEY_ID"]
app_key    = os.environ["B2_APPLICATION_KEY"]
bucket     = os.environ["B2_BUCKET_NAME"]

b2 = boto3.client(
    "s3",
    endpoint_url=endpoint,
    aws_access_key_id=key_id,
    aws_secret_access_key=app_key,
)

cors_config = {
    "CORSRules": [
        {
            "AllowedOrigins": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
            "AllowedHeaders": ["*"],
            "ExposeHeaders":  ["ETag"],
            "MaxAgeSeconds":  3600,
        }
    ]
}

print(f"Applying CORS to bucket: {bucket}")
b2.put_bucket_cors(Bucket=bucket, CORSConfiguration=cors_config)
print("✓ CORS rules applied successfully!\n")

result = b2.get_bucket_cors(Bucket=bucket)
for rule in result["CORSRules"]:
    print(f"  Origins : {rule['AllowedOrigins']}")
    print(f"  Methods : {rule['AllowedMethods']}")
    print(f"  Headers : {rule['AllowedHeaders']}")
