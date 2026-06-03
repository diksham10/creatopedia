#!/usr/bin/env python3
"""
Diagnose B2 upload permissions.
Tests direct put_object (not presigned) to confirm if the key has write access.
Run: python scripts/test_b2_write.py
"""
import os, sys, boto3
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

endpoint  = os.environ["B2_ENDPOINT_URL"]
key_id    = os.environ["B2_KEY_ID"]
app_key   = os.environ["B2_APPLICATION_KEY"]
bucket    = os.environ["B2_BUCKET_NAME"]

b2 = boto3.client(
    "s3",
    endpoint_url=endpoint,
    aws_access_key_id=key_id,
    aws_secret_access_key=app_key,
)

TEST_KEY  = "diagnostics/test-write-check.txt"
TEST_DATA = b"B2 write access check"

print(f"Bucket   : {bucket}")
print(f"Endpoint : {endpoint}")
print(f"Key ID   : {key_id[:8]}...")
print()

# ── 1. Direct put_object ──────────────────────────────────────────────
print("1. Testing direct put_object...")
try:
    b2.put_object(Bucket=bucket, Key=TEST_KEY, Body=TEST_DATA, ContentType="text/plain")
    print("   ✓ Direct put_object SUCCEEDED — key has writeFiles\n")
except Exception as e:
    print(f"   ✗ Direct put_object FAILED: {e}\n")
    print("   → The application key does NOT have writeFiles permission.")
    print("   → Go to B2 dashboard → Application Keys → create a new key with Read+Write.")
    sys.exit(1)

# ── 2. Presigned PUT ──────────────────────────────────────────────────
print("2. Testing presigned PUT URL...")
try:
    import requests
    url = b2.generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket, "Key": TEST_KEY, "ContentType": "text/plain"},
        ExpiresIn=300,
    )
    resp = requests.put(url, data=TEST_DATA, headers={"Content-Type": "text/plain"})
    if resp.status_code in (200, 204):
        print(f"   ✓ Presigned PUT SUCCEEDED (HTTP {resp.status_code})\n")
    else:
        print(f"   ✗ Presigned PUT FAILED: HTTP {resp.status_code}")
        print(f"   Response: {resp.text[:300]}\n")
except Exception as e:
    print(f"   ✗ Presigned PUT error: {e}\n")

# ── 3. Cleanup ────────────────────────────────────────────────────────
try:
    b2.delete_object(Bucket=bucket, Key=TEST_KEY)
    print("3. ✓ Test file cleaned up")
except Exception:
    pass
