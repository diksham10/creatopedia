#!/bin/bash

# PromptHub Docker Run Script
# This script pulls the production image and runs it with actual environment variables.

# Take Docker username as an environment variable or default to "blueneontech"
DOCKER_USERNAME=${DOCKER_USERNAME:-"blueneontech"}
IMAGE_NAME="prompthub"
IMAGE_TAG="$DOCKER_USERNAME/$IMAGE_NAME:latest"

echo "--- Pulling latest image: $IMAGE_TAG ---"
docker pull "$IMAGE_TAG"

echo "--- Stopping and removing existing container (if any) ---"
docker stop prompthub 2>/dev/null
docker rm prompthub 2>/dev/null

echo "--- Starting PromptHub container with actual secrets ---"

# Running without exposing ports (-p) as requested, using restart policy and 'fotosfolio-zip' network.
docker run -d \
  --name prompthub \
  --restart always \
  --network web \
  -e NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-""}" \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-""}" \
  -e SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-""}" \
  -e NEXT_PUBLIC_POSTHOG_KEY="${NEXT_PUBLIC_POSTHOG_KEY:-""}" \
  -e NEXT_PUBLIC_POSTHOG_HOST="${NEXT_PUBLIC_POSTHOG_HOST:-"https://app.posthog.com"}" \
  -e INSTAGRAM_ACCESS_TOKEN="${INSTAGRAM_ACCESS_TOKEN:-""}" \
  -e NEXT_PUBLIC_BASE_DOMAIN="creatopedia.tech" \
  -e CRON_SECRET="${CRON_SECRET:-""}" \
  -e INSTAGRAM_APP_ID="${INSTAGRAM_APP_ID:-""}" \
  -e INSTAGRAM_APP_SECRET="${INSTAGRAM_APP_SECRET:-""}" \
  -e INSTAGRAM_CLIENT_ID="${INSTAGRAM_CLIENT_ID:-""}" \
  -e INSTAGRAM_CLIENT_SECRET="${INSTAGRAM_CLIENT_SECRET:-""}" \
  -e INSTAGRAM_REDIRECT_URI="${INSTAGRAM_REDIRECT_URI:-""}" \
  -e TOKEN_ENCRYPTION_KEY="${TOKEN_ENCRYPTION_KEY:-""}" \
  "$IMAGE_TAG"

# Wait a few seconds and check if container is still running
sleep 3
if [ "$(docker inspect -f '{{.State.Running}}' prompthub 2>/dev/null)" = "true" ]; then
  echo "✅ PromptHub is running successfully!"
  echo "Container ID: $(docker ps -qf name=prompthub)"
else
  echo "❌ Failed to start PromptHub container or it crashed immediately."
  echo "Check logs with: docker logs prompthub"
  exit 1
fi


