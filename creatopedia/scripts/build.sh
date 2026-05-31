#!/bin/bash

# Creatopedia Docker Build and Push Script
# This script uses the production keys provided to build and push the Docker image.

# Load environment variables from .env if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Take Docker username as an environment variable or default to "local"
DOCKER_USERNAME=${DOCKER_USERNAME:-"blueneontech"}

IMAGE_NAME="prompthub"
if [ "$DOCKER_USERNAME" != "local" ]; then
  IMAGE_TAG="$DOCKER_USERNAME/$IMAGE_NAME:latest"
else
  IMAGE_TAG="$IMAGE_NAME:latest"
fi

echo "--- Starting Docker build for $IMAGE_TAG (Platform: linux/amd64) ---"

# Use the values from .env or fall back to hardcoded defaults
# Note: For NEXT_PUBLIC_BASE_DOMAIN, we ensure it's just the domain without protocol for the layout.tsx logic
BASE_DOMAIN=${NEXT_PUBLIC_BASE_DOMAIN:-"creatopedia.tech"}
BASE_DOMAIN=${BASE_DOMAIN#https://}
BASE_DOMAIN=${BASE_DOMAIN#http://}

docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-""}" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-""}" \
  --build-arg SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-""}" \
  --build-arg NEXT_PUBLIC_POSTHOG_KEY="${NEXT_PUBLIC_POSTHOG_KEY:-""}" \
  --build-arg NEXT_PUBLIC_POSTHOG_HOST="${NEXT_PUBLIC_POSTHOG_HOST:-"https://app.posthog.com"}" \
  --build-arg INSTAGRAM_ACCESS_TOKEN="${INSTAGRAM_ACCESS_TOKEN:-""}" \
  --build-arg NEXT_PUBLIC_BASE_DOMAIN="$BASE_DOMAIN" \
  --build-arg CRON_SECRET="${CRON_SECRET:-""}" \
  --build-arg INSTAGRAM_APP_ID="${INSTAGRAM_APP_ID:-""}" \
  --build-arg INSTAGRAM_APP_SECRET="${INSTAGRAM_APP_SECRET:-""}" \
  --build-arg INSTAGRAM_CLIENT_ID="${INSTAGRAM_CLIENT_ID:-""}" \
  --build-arg INSTAGRAM_CLIENT_SECRET="${INSTAGRAM_CLIENT_SECRET:-""}" \
  --build-arg INSTAGRAM_REDIRECT_URI="${INSTAGRAM_REDIRECT_URI:-""}" \
  --build-arg TOKEN_ENCRYPTION_KEY="${TOKEN_ENCRYPTION_KEY:-""}" \
  -t "$IMAGE_TAG" .

if [ $? -eq 0 ]; then
  echo "Build successful!"
  
  if [ "$DOCKER_USERNAME" != "local" ]; then
    echo "--- Pushing image to Docker Hub ---"
    docker push "$IMAGE_TAG"
    if [ $? -eq 0 ]; then
      echo "✅ Push successful!"
    else
      echo "❌ Push failed!"
      exit 1
    fi
  fi
  
  echo "You can run the container with:"
  echo "docker run -p 3000:3000 $IMAGE_TAG"
else
  echo "❌ Build failed. Please check the logs above."
  exit 1
fi
